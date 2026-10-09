#!/usr/bin/env python3
"""Факт-чек корпуса Security_QA через Message Batches API.

Каждый вопрос уходит отдельным запросом: модель читает ответ, открывает
ссылки из его sources (web_fetch) и возвращает JSON с находками.

Команды:
  build                      собрать запросы и оценку цены, без сети
  submit [--limit N]         отправить батч (N первых ещё не отправленных)
  status                     состояние отправленных батчей
  collect                    забрать результаты, написать отчёт

Состояние в _work/batch-factcheck/manifest.json, по нему команды
продолжают работу после перезапуска.
"""
from __future__ import annotations

import argparse
import glob
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "_work" / "batch-factcheck"
MANIFEST = WORK / "manifest.json"
REQUESTS = WORK / "requests.jsonl"
RESULTS = WORK / "results.jsonl"
REPORT = WORK / "report.md"
KEY_FILE = Path.home() / ".config" / "anthropic-batch.key"

MODEL = "claude-opus-5-5"
MAX_TOKENS = 16000
MAX_FETCHES = 3
MAX_SEARCHES = 2
FETCH_TOKENS = 8000
# Batch API берёт 50% от обычной цены Opus 5.5 ($4 / $20 за 1M).
PRICE_IN, PRICE_OUT = 2.0 / 1e6, 10.0 / 1e6

SYSTEM = """Ты технический редактор корпуса вопросов и ответов к собеседованию Security Engineer.
Проверь один ответ на фактические ошибки. Открывай ссылки из списка источников инструментом web_fetch, не больше трёх, сначала те, что подтверждают самые конкретные утверждения (номера, версии, флаги, названия, даты, статьи закона).
Если ссылка не открылась, найди тот же документ инструментом web_search (не больше двух поисков) и открой найденную копию на официальном сайте.

Ошибкой считается только то, что противоречит источнику или устарело: неверный факт, флаг, версия, название, номер статьи, битая или не та ссылка. Стиль, полнота и спорные мнения ошибками не считаются.

Ответь только JSON без пояснений вокруг, по схеме:
{"verdict": "ok" | "issues", "issues": [{"severity": "major" | "minor", "claim": "дословная фраза из ответа", "problem": "что не так", "fix": "как исправить", "evidence_url": "ссылка", "evidence_quote": "короткая цитата источника, до 15 слов"}], "unreachable_sources": ["ссылки, которые не открылись"]}
Если ошибок нет, issues пустой. Не выдумывай находки: нет подтверждения источником, значит нет находки."""


def load_questions() -> list[dict]:
    out = []
    for f in sorted(glob.glob(str(ROOT / "content" / "[0-9]*.json"))):
        prefix = Path(f).stem.split("-")[0]
        data = json.loads(Path(f).read_text(encoding="utf-8"))
        for i, q in enumerate(data["questions"], 1):
            out.append({
                "custom_id": f"c{prefix}-q{i:03d}",
                "category": data["category"],
                "text": q["text"],
                "answer": q["answer"],
                "sources": q.get("sources", []),
            })
    return out


def build_params(q: dict) -> dict:
    sources = "\n".join(f"- {u}" for u in q["sources"]) or "- (нет)"
    user = (f"Раздел: {q['category']}\nВопрос: {q['text']}\n\n"
            f"Ответ (HTML):\n{q['answer']}\n\nИсточники:\n{sources}")
    return {
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "output_config": {"effort": "medium"},
        "system": [{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}],
        "tools": [{"type": "web_fetch_20260209", "name": "web_fetch",
                   "max_uses": MAX_FETCHES, "max_content_tokens": FETCH_TOKENS},
                  {"type": "web_search_20260209", "name": "web_search", "max_uses": MAX_SEARCHES}],
        "messages": [{"role": "user", "content": user}],
    }


def load_manifest() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"batches": [], "submitted": []}


def save_manifest(m: dict) -> None:
    MANIFEST.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")


def cmd_build(_: argparse.Namespace) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    qs = load_questions()
    with REQUESTS.open("w", encoding="utf-8") as fh:
        for q in qs:
            fh.write(json.dumps({"custom_id": q["custom_id"], "params": build_params(q)},
                                ensure_ascii=False) + "\n")
    # Грубая оценка: русский текст около 3 символов на токен.
    prompt_tok = sum(len(SYSTEM) + len(q["answer"]) + len(q["text"]) + 200 for q in qs) / 3
    fetch_tok = len(qs) * MAX_FETCHES * FETCH_TOKENS
    out_tok = len(qs) * 3000
    low = (prompt_tok + fetch_tok * 0.5) * PRICE_IN + out_tok * 0.7 * PRICE_OUT
    high = (prompt_tok + fetch_tok) * PRICE_IN * 1.5 + out_tok * 1.5 * PRICE_OUT
    print(f"Запросов: {len(qs)}, файл {REQUESTS.relative_to(ROOT)}")
    print(f"Оценка цены всего корпуса: ${low:.0f}-{high:.0f} (точная после пилота)")


def client():
    try:
        import anthropic
    except ImportError:
        sys.exit("Нет пакета anthropic: python3 -m pip install anthropic")
    # Ключ лежит в отдельном файле, а не в ~/.zshrc: переменная ANTHROPIC_API_KEY
    # в оболочке переключила бы Claude Code с подписки на оплату по API.
    if not KEY_FILE.exists():
        sys.exit(f"Нет файла с ключом {KEY_FILE}")
    return anthropic.Anthropic(api_key=KEY_FILE.read_text().strip())


def cmd_submit(a: argparse.Namespace) -> None:
    m = load_manifest()
    done = set(m["submitted"])
    rows = [json.loads(l) for l in REQUESTS.read_text(encoding="utf-8").splitlines()]
    if a.only:
        ids = set(a.only.split(","))
        todo = [r for r in rows if r["custom_id"] in ids]
    else:
        todo = [r for r in rows if r["custom_id"] not in done][: a.limit or None]
    if not todo:
        print("Все запросы уже отправлены.")
        return
    batch = client().messages.batches.create(requests=todo)
    m["batches"].append({"id": batch.id, "count": len(todo)})
    m["submitted"] += [r["custom_id"] for r in todo if r["custom_id"] not in done]
    save_manifest(m)
    print(f"Отправлен батч {batch.id}: {len(todo)} запросов")


def cmd_status(_: argparse.Namespace) -> None:
    c = client()
    for b in load_manifest()["batches"]:
        r = c.messages.batches.retrieve(b["id"])
        n = r.request_counts
        print(f"{b['id']}: {r.processing_status}, ok {n.succeeded}, ошибок {n.errored}, "
              f"в работе {n.processing}, истекло {n.expired}")


def parse_json(text: str) -> dict | None:
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


def cmd_collect(_: argparse.Namespace) -> None:
    c = client()
    have = {}
    if RESULTS.exists():
        for l in RESULTS.read_text(encoding="utf-8").splitlines():
            r = json.loads(l)
            have[r["custom_id"]] = r
    for b in load_manifest()["batches"]:
        if c.messages.batches.retrieve(b["id"]).processing_status != "ended":
            print(f"{b['id']} ещё в работе, пропускаю")
            continue
        for res in c.messages.batches.results(b["id"]):
            row = {"custom_id": res.custom_id, "type": res.result.type}
            if res.result.type == "succeeded":
                msg = res.result.message
                text = "".join(x.text for x in msg.content if x.type == "text")
                row.update(stop=msg.stop_reason, usage=msg.usage.model_dump(),
                           parsed=parse_json(text), raw=text[-4000:])
            have[res.custom_id] = row
    RESULTS.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n"
                               for r in sorted(have.values(), key=lambda r: r["custom_id"])),
                       encoding="utf-8")
    write_report(list(have.values()))


def write_report(rows: list[dict]) -> None:
    qs = {q["custom_id"]: q for q in load_questions()}
    def tok(key: str) -> int:
        return sum((r.get("usage") or {}).get(key) or 0 for r in rows)
    tin, tout = tok("input_tokens"), tok("output_tokens")
    # Запись в кэш стоит 1.25 цены входа, чтение из кэша 0.1.
    cost = ((tin + 1.25 * tok("cache_creation_input_tokens")
             + 0.1 * tok("cache_read_input_tokens")) * PRICE_IN + tout * PRICE_OUT)
    lines = [f"# Факт-чек Security_QA через Batch API\n",
             f"Обработано {len(rows)} из {len(qs)}. Токены вход {tin}, выход {tout}, "
             f"цена около ${cost:.2f}.\n"]
    bad = [r for r in rows if r["type"] != "succeeded" or not r.get("parsed")
           or r.get("stop") not in ("end_turn", None)]
    for r in sorted(rows, key=lambda r: r["custom_id"]):
        p = r.get("parsed") or {}
        issues = p.get("issues") or []
        if not issues:
            continue
        lines.append(f"\n## {r['custom_id']}. {qs[r['custom_id']]['text']}\n")
        for i in issues:
            lines.append(f"- **{i.get('severity')}**. «{i.get('claim')}». {i.get('problem')} "
                         f"Исправить, {i.get('fix')} Источник, {i.get('evidence_url')} "
                         f"(«{i.get('evidence_quote')}»)")
    if bad:
        lines.append("\n## Не разобрано\n")
        lines += [f"- {r['custom_id']}: {r['type']}, stop {r.get('stop')}" for r in bad]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    n_issue = sum(1 for r in rows if (r.get("parsed") or {}).get("issues"))
    print(f"Отчёт {REPORT.relative_to(ROOT)}: вопросов с находками {n_issue}, "
          f"не разобрано {len(bad)}, цена около ${cost:.2f}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("build").set_defaults(fn=cmd_build)
    s = sub.add_parser("submit")
    s.add_argument("--limit", type=int, default=0)
    s.add_argument("--only", help="повторить эти custom_id через запятую")
    s.set_defaults(fn=cmd_submit)
    sub.add_parser("status").set_defaults(fn=cmd_status)
    sub.add_parser("collect").set_defaults(fn=cmd_collect)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
