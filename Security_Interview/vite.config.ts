import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// GitHub Pages отдаёт 404.html на неизвестный путь. Для SPA с маршрутами
// (например /devsecops) прямой заход и перезагрузка иначе дают 404. Копия
// index.html в 404.html делает такие ссылки рабочими. Только для Pages-сборки,
// в offline роутинг идёт через HashRouter и фолбэк не нужен.
const spaFallback = () => ({
  name: "spa-404-fallback",
  closeBundle() {
    const dist = path.resolve(__dirname, "dist");
    const index = path.join(dist, "index.html");
    if (fs.existsSync(index)) fs.copyFileSync(index, path.join(dist, "404.html"));
  },
});

// https://vitejs.dev/config/
// Режим offline собирает сайт для открытия из папки по file://, без сервера:
// относительные пути и весь код в одном файле (скрипт inline-offline.mjs).
export default defineConfig(({ mode }) => ({
  base: mode === "offline" ? "./" : process.env.NODE_ENV === "production" ? "/Security_QA/" : "/",
  build:
    mode === "offline"
      ? { outDir: "dist-offline", assetsInlineLimit: 100_000_000, rollupOptions: { output: { inlineDynamicImports: true } } }
      : {},
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), ...(mode === "offline" ? [] : [spaFallback()])],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
