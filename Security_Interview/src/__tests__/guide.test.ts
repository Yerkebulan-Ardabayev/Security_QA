/**
 * Проверки гайда вкладки DevSecOps (src/pages/devsecops-guide.html).
 *
 * Гайд долго отвечал только на «что защищать и почему», а порядка самой
 * работы в нём не было. Блок «Практика» закрывает этот пробел, тесты держат
 * его на месте, а заодно следят за оглавлением, источниками и стилем.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const GUIDE = path.resolve(__dirname, '../pages/devsecops-guide.html');
const STANDALONE = path.resolve(__dirname, '../../../../DevSecOps_Guide/DevSecOps_Guide.html');
const html = fs.readFileSync(GUIDE, 'utf8');

const sections = [...html.matchAll(/<section id="([^"]+)">([\s\S]*?)<\/section>/g)].map((m) => ({
  id: m[1],
  body: m[2],
}));

describe('гайд DevSecOps', () => {
  it('оглавление и разделы совпадают', () => {
    const toc = [...html.matchAll(/<a href="#([^"]+)">/g)].map((m) => m[1]);
    expect(toc).toEqual(sections.map((s) => s.id));
  });

  it('блок «Практика» на месте', () => {
    const practice = ['opmodel', 'first90', 'onboarding', 'tmsession', 'triage', 'gatefail', 'playbooks'];
    const ids = sections.map((s) => s.id);
    for (const id of practice) expect(ids).toContain(id);
  });

  it('у каждого раздела, кроме финального, есть источники со ссылками', () => {
    const without = sections
      .filter((s) => s.id !== 'checklist' && s.id !== 'roadmap')
      .filter((s) => !/class="src"[\s\S]*?href="https:\/\//.test(s.body))
      .map((s) => s.id);
    expect(without).toEqual([]);
  });

  it('нет длинного тире', () => {
    expect(html.includes('—')).toBe(false);
  });

  it('отдельная копия гайда совпадает с копией сайта', () => {
    if (!fs.existsSync(STANDALONE)) return; // в CI отдельной папки нет
    expect(fs.readFileSync(STANDALONE, 'utf8')).toBe(html);
  });
});
