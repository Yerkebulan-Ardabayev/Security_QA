import Header from '@/components/Header';
// Гайд это самодостаточный HTML со своими стилями и скриптом. Рендерим его в iframe
// через srcDoc, чтобы его глобальные стили не конфликтовали с Tailwind, а в офлайн-
// сборке строка инлайнилась в один файл (импорт ?raw). Источник страницы:
// src/pages/devsecops-guide.html (копия из Projects/DevSecOps_Guide).
import guideHtml from './devsecops-guide.html?raw';

const DevSecOps = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <iframe
        title="DevSecOps: гайд уровня сеньор"
        srcDoc={guideHtml}
        className="w-full border-0 flex-1"
        style={{ height: 'calc(100vh - 4rem)' }}
      />
    </div>
  );
};

export default DevSecOps;
