#!/usr/bin/env node
/**
 * Собирает корпус сайта из content/NN-*.json.
 *
 * Каждый файл раздела: { "category": "...", "questions": [{ text, answer, sources }] }.
 * Порядок разделов задаёт номер в имени файла. id и num проставляются здесь
 * сквозной нумерацией, руками их не пишем, чтобы не было дублей и дыр.
 *
 * Результат пишется в два места, которые должны совпадать (это держит тест):
 *   Security_Interview/public/Security_Interview.html  (раздаётся сайтом)
 *   Security_Interview.html                            (копия в корне)
 *
 * Запуск: node scripts/build-corpus.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = [
  path.join(ROOT, 'Security_Interview/public/Security_Interview.html'),
  path.join(ROOT, 'Security_Interview.html'),
];

const files = fs
  .readdirSync(CONTENT)
  .filter((f) => /^\d{2}-.+\.json$/.test(f))
  .sort();

const categories = [];
const questions = [];
const errors = [];

for (const file of files) {
  const sec = JSON.parse(fs.readFileSync(path.join(CONTENT, file), 'utf8'));
  if (!sec.category) errors.push(`${file}: нет category`);
  categories.push(sec.category);
  for (const [i, q] of (sec.questions ?? []).entries()) {
    const where = `${file} #${i + 1}`;
    if (!q.text?.trim()) errors.push(`${where}: пустой text`);
    if (!q.answer?.trim()) errors.push(`${where}: пустой answer`);
    if (!Array.isArray(q.sources) || q.sources.length === 0) errors.push(`${where}: нет sources`);
    questions.push({
      id: questions.length,
      num: questions.length + 1,
      category: sec.category,
      text: q.text,
      answer: q.answer,
      sources: q.sources,
    });
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

// `</` внутри JSON закрыл бы тег <script> раньше времени, экранируем.
// `};` встречается только внутри строк (в структуре JSON точки с запятой нет),
// а загрузчик и тест ищут конец DATA по первому `};`. Код в ответе вроде
// `function f() {};` обрезал бы корпус, поэтому скобку пишем как }.
const json = JSON.stringify({ categories, questions })
  .replace(/<\//g, '<\\/')
  .replace(/\};/g, '\\u007d;');
const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Security Interview, корпус</title>
</head>
<body>
<script>
var DATA = ${json};
</script>
</body>
</html>
`;

for (const out of OUT) fs.writeFileSync(out, html);
console.log(`корпус собран: ${categories.length} разделов, ${questions.length} вопросов`);
