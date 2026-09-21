import { Search, Terminal, Mic, MicOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

interface HeaderProps {
  totalQuestions?: number;
  onSearchOpen?: () => void;
  voiceEnabled?: boolean;
  voiceListening?: boolean;
  onVoiceToggle?: () => void;
  voiceSupported?: boolean;
}

const Header = ({
  totalQuestions,
  onSearchOpen,
  voiceEnabled = false,
  voiceListening = false,
  onVoiceToggle,
  voiceSupported = false,
}: HeaderProps) => {
  const { pathname } = useLocation();
  // На корне HashRouter pathname это "/", на вкладке гайда "/devsecops".
  const onGuide = pathname.startsWith('/devsecops');

  const tab = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
      active
        ? 'border-primary/30 bg-primary/10 text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight leading-none truncate">
              Security <span className="text-primary">Interview</span>
            </h1>
          </div>
          {totalQuestions != null && !onGuide && (
            <span className="ml-1 text-xs font-mono font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20 shrink-0">
              {totalQuestions}
            </span>
          )}
        </div>

        {/* Вкладки */}
        <nav className="flex items-center gap-1 shrink-0">
          <Link to="/" className={tab(!onGuide)}>Вопросы</Link>
          <Link to="/devsecops" className={tab(onGuide)}>DevSecOps</Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          {/* Индикатор микрофона, только на странице вопросов */}
          {voiceSupported && !onGuide && (
            <button
              onClick={onVoiceToggle}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                voiceEnabled && voiceListening
                  ? 'border-red-500/30 bg-red-500/10 text-red-500'
                  : voiceEnabled
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
              title={voiceEnabled ? 'Выключить микрофон' : 'Включить постоянный микрофон'}
            >
              {voiceEnabled ? (
                <Mic className={`w-3.5 h-3.5 ${voiceListening ? 'animate-pulse' : ''}`} />
              ) : (
                <MicOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {voiceEnabled ? (voiceListening ? 'Слушаю' : 'Микрофон') : 'Микрофон'}
              </span>
            </button>
          )}

          {/* Кнопка текстового поиска, только когда обработчик передан */}
          {onSearchOpen && !onGuide && (
            <button
              onClick={onSearchOpen}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-sm group"
              title="Текстовый поиск (/ или V)"
            >
              <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="hidden sm:inline">Поиск</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">
                /
              </kbd>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
