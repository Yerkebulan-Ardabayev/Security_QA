import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";

// По file:// путь страницы это путь на диске, BrowserRouter его не сопоставит.
const Router = import.meta.env.MODE === "offline" ? HashRouter : BrowserRouter;
const routerProps = import.meta.env.MODE === "offline" ? {} : { basename: import.meta.env.BASE_URL };
import Index from "./pages/Index";
import DevSecOps from "./pages/DevSecOps";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  // storageKey совпадает с ключом в инлайн-скрипте index.html, который ставит
  // класс темы до первой отрисовки. Разъедутся — вернётся мигание при загрузке.
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="theme" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router {...routerProps}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/devsecops" element={<DevSecOps />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
