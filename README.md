# Security Interview Q&A

Вопросы и ответы для подготовки к собеседованию Security Engineer и DevSecOps.
Движок взят из [DevOps_QA](https://github.com/Yerkebulan-Ardabayev/DevOps_QA), вопросы свои.

## Как устроен проект

- `content/NN-*.json`: вопросы и ответы, один файл на раздел. Правятся только здесь.
- `scripts/build-corpus.mjs`: собирает из них `Security_Interview.html` (в корне и в `Security_Interview/public/`).
- `scripts/check-links.mjs`: проверяет, что все ссылки на источники открываются, отчёт в `_reports/links.md`.
- `Security_Interview/`: сайт на React + Vite, поиск с транслитом и синонимами.

## Разработка

```bash
node scripts/build-corpus.mjs
node scripts/check-links.mjs
cd Security_Interview
npm ci
npm test
npm run lint
npm run build
npm run dev
```
