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
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const REPORT = path.join(ROOT, '_reports/links.md');
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
      if (attempt === 2) return { status: 'ERR', final: String(e.cause?.code ?? e.name) };
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

const bad = urls.filter((u) => results.get(u).status !== 200);
const lines = [
  `# Проверка ссылок`,
  ``,
  `Дата: ${new Date().toISOString().slice(0, 10)}`,
  `Всего уникальных ссылок: ${urls.length}, код 200: ${urls.length - bad.length}, проблемных: ${bad.length}.`,
  ``,
];
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
