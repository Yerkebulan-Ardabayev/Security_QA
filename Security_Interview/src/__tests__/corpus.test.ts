/**
 * Проверки самого корпуса вопросов и ответов.
 *
 * Корпус собирается скриптом scripts/build-corpus.mjs из content/NN-*.json.
 * Часть проверок перенесена из DevOps-версии (там корпус был конвертирован
 * из текстового дампа и такие дефекты реально встречались), часть своя:
 * источник у каждого ответа, формат ссылок, стиль текста.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface Question {
  id: number;
  num: number;
  category: string;
  text: string;
  answer: string;
  sources?: string[];
}

const ROOT = path.resolve(__dirname, '../..');
const CORPUS = path.join(ROOT, 'public/Security_Interview.html');
const CORPUS_COPY = path.resolve(ROOT, '../Security_Interview.html');

function loadCorpus(file: string): { categories: string[]; questions: Question[] } {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/var\s+DATA\s*=\s*(\{[\s\S]*?\});/);
  if (!m) throw new Error(`в ${file} не найден объект DATA`);
  return JSON.parse(m[1]);
}

const data = loadCorpus(CORPUS);

/** Компактный список номеров вопросов — чтобы упавший тест сразу называл виновных. */
const offenders = (re: RegExp) => data.questions.filter((q) => re.test(q.answer)).map((q) => q.num);

describe('целостность корпуса', () => {
  it('вопросы есть и разложены по разделам', () => {
    expect(data.questions.length).toBeGreaterThan(0);
    expect(data.categories.length).toBeGreaterThan(0);
  });

  it('каждый вопрос лежит в существующем разделе', () => {
    const known = new Set(data.categories);
    expect(data.questions.filter((q) => !known.has(q.category)).map((q) => q.num)).toEqual([]);
  });

  it('id уникальны', () => {
    // Index.tsx ищет соседний вопрос через findIndex по q.id, а списки
    // результатов используют id как React-ключ: дубли ломают и то, и другое.
    expect(new Set(data.questions.map((q) => q.id)).size).toBe(data.questions.length);
  });

  it('номера вопросов уникальны', () => {
    expect(new Set(data.questions.map((q) => q.num)).size).toBe(data.questions.length);
  });

  it('копия корпуса в корне репозитория совпадает с той, что раздаётся сайтом', () => {
    expect(fs.readFileSync(CORPUS_COPY, 'utf8')).toBe(fs.readFileSync(CORPUS, 'utf8'));
  });
});

describe('качество ответов', () => {
  it('нет заглушек вместо ответа', () => {
    expect(offenders(/Ответ не найден|TODO|Lorem ipsum/i)).toEqual([]);
  });

  it('нет обрубков вместо ответа', () => {
    expect(data.questions.filter((q) => q.answer.trim().length < 200).map((q) => q.num)).toEqual([]);
  });

  it('нет мусора из интерфейса чат-ботов', () => {
    expect(offenders(/КопироватьРедактировать|Экспортировать в Таблицы/)).toEqual([]);
  });

  it('нет лишних обратных слэшей перед кавычками', () => {
    // На странице это выглядело как \"мозг\" вместо "мозг".
    expect(offenders(/\\["']/)).toEqual([]);
  });

  it('ключи командной строки не превратились в длинное тире', () => {
    // Конвертация делала из `--single-transaction` строку `—single-transaction`.
    expect(offenders(/—[a-zA-Z]{2}/)).toEqual([]);
  });

  it('нет остатков pandoc-экранирования плейсхолдеров', () => {
    expect(offenders(/\\<|\\>/)).toEqual([]);
  });

  it('псевдотаблицы из тире не остались обычным текстом', () => {
    // Настоящая таблица — <table>, невосстановимая — <pre>. Голый <p> с рамкой
    // из тире означает, что блок снова разъехался.
    expect(offenders(/<p>[\s—–-]{6,}<\/p>/)).toEqual([]);
  });
});

describe('источники и стиль', () => {
  it('у каждого вопроса есть хотя бы один источник', () => {
    expect(data.questions.filter((q) => !q.sources || q.sources.length === 0).map((q) => q.num)).toEqual([]);
  });

  it('все источники это https-ссылки', () => {
    const bad = data.questions.filter((q) => (q.sources ?? []).some((u) => !/^https:\/\/[^\s]+$/.test(u)));
    expect(bad.map((q) => q.num)).toEqual([]);
  });

  it('в ответах нет длинного тире', () => {
    expect(offenders(/—/)).toEqual([]);
  });

  it('формулировки вопросов не повторяются', () => {
    const seen = new Set<string>();
    const dups = data.questions.filter((q) => {
      const k = q.text.trim().toLowerCase();
      if (seen.has(k)) return true;
      seen.add(k);
      return false;
    });
    expect(dups.map((q) => q.num)).toEqual([]);
  });

  it('полный корпус на месте после закрывающих скобок внутри кода', () => {
    // Сборщик экранирует `};` в строках, иначе ленивое регулярное выражение
    // выше обрезало бы DATA на первом ответе с кодом.
    const html = fs.readFileSync(CORPUS, 'utf8');
    const total = (html.match(/"num":/g) ?? []).length;
    expect(data.questions.length).toBe(total);
  });
});

describe('практические разделы дают команды', () => {
  // Сайт готовит к учёбе и работе, а не только к разговору на собеседовании.
  // В практических разделах должно быть не меньше указанного числа ответов
  // с реальной командой (<pre><code> или инлайновый <code>). Порог намеренно
  // ниже фактического покрытия: он стережёт от возврата к чисто описательным
  // ответам, но не заставляет вставлять команду в концептуальный вопрос.
  const MIN_WITH_CODE: Record<string, number> = {
    'Основы безопасности': 20,
    'DevSecOps и AppSec': 20,
    'Безопасность облака, контейнеров и Kubernetes': 20,
    'Blue team и SOC': 15,
    'DFIR и форензика': 12,
    'Пентест и offensive-основы': 5,
  };

  const withCode = (category: string) =>
    data.questions.filter((q) => q.category === category && /<pre|<code/.test(q.answer)).length;

  for (const [category, min] of Object.entries(MIN_WITH_CODE)) {
    it(`«${category}»: не меньше ${min} ответов с командой`, () => {
      // Раздел должен существовать, иначе опечатка в названии тихо пройдёт.
      expect(data.categories).toContain(category);
      expect(withCode(category)).toBeGreaterThanOrEqual(min);
    });
  }
});
