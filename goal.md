# goal.md, Security_QA

Спецификация: `spec.md` (утверждена 21.09.2026). DevOps_QA не трогать.

## DONE WHEN (из spec.md, пункт 8)

- [x] Каркас: движок скопирован, `npm test`, `npm run lint` (0 ошибок), `npm run build` зелёные. 21.09.2026.
- [ ] 9 разделов, 250 ± 10 вопросов, у каждого непустой `sources`.
  - [x] 01 Основы безопасности, 42 вопроса. 21.09.2026.
  - [ ] 02 DevSecOps и AppSec (~40)
  - [ ] 03 Безопасность облака, контейнеров и Kubernetes (~35)
  - [ ] 04 Blue team и SOC (~35)
  - [ ] 05 GRC и compliance, включая право РК (~30)
  - [ ] 06 DFIR и форензика (~25)
  - [ ] 07 Пентест (~20)
  - [ ] 08 Сценарии (~15)
  - [ ] 09 Soft skills (~10)
- [ ] Все ссылки из `sources` отвечают 200 (`node scripts/check-links.mjs`). Сейчас 86 из 86.
- [ ] Факт-чек всех 9 разделов, находки закрыты.
- [ ] Сценарии 1-3 из спеки проверены в браузере. Сценарий 1 и поиск транслитом проверены 21.09.
- [ ] `git -C ~/Desktop/Projects/DevOps_QA status` чистый, HEAD 48f9b08.
- [ ] После «go» пользователя: репозиторий на GitHub, Pages, сценарии на живом сайте.

## Как добавлять раздел

1. Написать `content/NN-slug.json`.
2. `node scripts/build-corpus.mjs && node scripts/check-links.mjs`
3. `cd Security_Interview && npm test && npm run lint && npm run build`
