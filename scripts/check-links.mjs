#!/usr/bin/env node
/**
 * Проверяет, что каждая ссылка из sources в content/*.json открывается.
 *
 * Запрос GET с переходом по редиректам (часть сайтов отвечает на HEAD 403/405).
 * Отчёт пишется в _reports/links.md: сводка и список проблемных ссылок с
 * вопросами, где они стоят. Код выхода 1, если есть хоть одна не-200.
 *
 * Запуск: node scripts/check-links.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const REPORT = path.join(ROOT, '_reports/links.md');
// Адреса, проверенные вручную в браузере (сайты блокируют скрипты). См. сам файл.
const MANUAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/browser-verified.json'), 'utf8'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';

const usage = new Map(); // url -> [где встречается]
for (const f of fs.readdirSync(CONTENT).filter((f) => f.endsWith('.json')).sort()) {
  const sec = JSON.parse(fs.readFileSync(path.join(CONTENT, f), 'utf8'));
  sec.questions.forEach((q, i) => {
    for (const u of q.sources ?? []) {
      if (!usage.has(u)) usage.set(u, []);
      usage.get(u).push(`${f} #${i + 1} «${q.text}»`);
    }
  });
}

// Node проверяет цепочку сертификатов по своему встроенному хранилищу и не
// догружает недостающий промежуточный сертификат по ссылке из самого сертификата
// (AIA). Сайты с неполной цепочкой из-за этого падают у Node, хотя в браузере и
// в curl открываются. Для таких случаев перепроверяем системным клиентом.
const TLS_CHAIN_ERRORS = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
]);

function checkWithCurl(url) {
  const r = spawnSync(
    '/usr/bin/curl',
    ['-s', '-o', '/dev/null', '-L', '-m', '25', '-A', UA, '-w', '%{http_code}', url],
    { encoding: 'utf8' },
  );
  const code = Number.parseInt((r.stdout ?? '').trim(), 10);
  return Number.isFinite(code) ? code : 0;
}

async function check(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
        signal: AbortSignal.timeout(20000),
      });
      await r.body?.cancel();
      if (r.status === 200 || attempt === 2) return { status: r.status, final: r.url };
    } catch (e) {
      const code = String(e.cause?.code ?? e.name);
      if (TLS_CHAIN_ERRORS.has(code) && checkWithCurl(url) === 200) {
        return { status: 200, final: url, note: `неполная цепочка сертификатов, проверено системным клиентом (${code})` };
      }
      if (attempt === 2) return { status: 'ERR', final: code };
    }
  }
}

const urls = [...usage.keys()];
const results = new Map();
const POOL = 8;
let next = 0;
await Promise.all(
  Array.from({ length: POOL }, async () => {
    while (next < urls.length) {
      const u = urls[next++];
      results.set(u, await check(u));
    }
  }),
);

const manual = urls.filter((u) => results.get(u).status !== 200 && MANUAL[u]);
const bad = urls.filter((u) => results.get(u).status !== 200 && !MANUAL[u]);
const lines = [
  `# Проверка ссылок`,
  ``,
  `Дата: ${new Date().toISOString().slice(0, 10)}`,
  `Всего уникальных ссылок: ${urls.length}, код 200: ${urls.length - bad.length - manual.length}, проверено вручную в браузере: ${manual.length}, проблемных: ${bad.length}.`,
  ``,
];
if (manual.length) {
  lines.push(`## Проверено вручную в браузере`, ``);
  for (const u of manual) lines.push(`- ${results.get(u).status} ${u} (${MANUAL[u].checked}, «${MANUAL[u].title}»)`);
  lines.push(``);
}
const viaCurl = urls.filter((u) => results.get(u).note);
if (viaCurl.length) {
  lines.push(`## Проверено системным клиентом`, ``);
  for (const u of viaCurl) lines.push(`- ${u} (${results.get(u).note})`);
  lines.push(``);
}
if (bad.length) {
  lines.push(`## Проблемные`, ``);
  for (const u of bad) {
    const r = results.get(u);
    lines.push(`- ${r.status} ${u}`, ...usage.get(u).map((w) => `  - ${w}`));
  }
}
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, lines.join('\n') + '\n');
console.log(lines.slice(3, 4).join(''));
for (const u of bad) console.log(`  ${results.get(u).status} ${u}`);
process.exit(bad.length ? 1 : 0);
