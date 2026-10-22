import { lazy, Suspense, useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Headphones,
  Home,
  Languages,
  Library,
  Menu,
  Mic,
  Monitor,
  Moon,
  PenLine,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Sun,
  Volume2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { cn } from "./lib/cn";
import { useTheme, type Theme } from "./lib/theme";
import { useProgress } from "./hooks/useProgress";
import { t } from "./lib/i18n";
import Today from "./routes/Today";
const Study = lazy(() => import("./routes/Study"));
const Browse = lazy(() => import("./routes/Browse"));
const Grammar = lazy(() => import("./routes/Grammar"));
const Reading = lazy(() => import("./routes/Reading"));
const Listening = lazy(() => import("./routes/Listening"));
const Pronunciation = lazy(() => import("./routes/Pronunciation"));
const Speaking = lazy(() => import("./routes/Speaking"));
const Writing = lazy(() => import("./routes/Writing"));
const Dictation = lazy(() => import("./routes/Dictation"));
const Translate = lazy(() => import("./routes/Translate"));
const Settings = lazy(() => import("./routes/Settings"));
const Search = lazy(() => import("./routes/Search"));
const Stats = lazy(() => import("./routes/Stats"));
const Credits = lazy(() => import("./routes/Credits"));
const Help = lazy(() => import("./routes/Help"));

interface NavItem {
  to: string;
  key: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: { key: string; items: NavItem[] }[] = [
  {
    key: "nav.learn",
    items: [
      { to: "/", key: "nav.today", icon: Home, end: true },
      { to: "/study", key: "nav.study", icon: GraduationCap },
      { to: "/browse", key: "nav.browse", icon: Library },
      { to: "/grammar", key: "nav.grammar", icon: BookOpen },
    ],
  },
  {
    key: "nav.practice",
    items: [
      { to: "/reading", key: "nav.reading", icon: BookOpen },
      { to: "/listening", key: "nav.listening", icon: Headphones },
      { to: "/pronunciation", key: "nav.pronunciation", icon: Volume2 },
      { to: "/speaking", key: "nav.speaking", icon: Mic },
      { to: "/writing", key: "nav.writing", icon: PenLine },
      { to: "/dictation", key: "nav.dictation", icon: Headphones },
      { to: "/translate", key: "nav.translate", icon: Languages },
    ],
  },
  {
    key: "nav.you",
    items: [
      { to: "/search", key: "nav.search", icon: SearchIcon },
      { to: "/stats", key: "nav.stats", icon: BarChart3 },
      { to: "/settings", key: "nav.settings", icon: SettingsIcon },
    ],
  },
];

const NEXT_THEME: Record<Theme, Theme> = { auto: "light", light: "dark", dark: "auto" };

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${theme}. Switch to ${NEXT_THEME[theme]}.`}
      onClick={() => setTheme(NEXT_THEME[theme])}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  const progress = useProgress();
  const location = useLocation();
  const lang = progress.settings.language;

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * (progress.settings.fontScale || 1)}px`;
  }, [progress.settings.fontScale]);

  return (
    <div className="min-h-full md:grid md:grid-cols-[15rem_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-line bg-surface p-4 transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-serif text-2xl font-bold">Stufe</span>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="mt-6 flex flex-col gap-4">
          {NAV.map((section) => (
            <div key={section.key}>
              <div className="px-3 pb-1 text-xs uppercase tracking-wide text-muted">{t(lang, section.key)}</div>
              <div className="flex flex-col gap-1">
                {section.items.map(({ to, key, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                        isActive ? "bg-soft font-medium" : "hover:bg-soft",
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {t(lang, key)}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-full flex-col">
        <header className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-serif text-lg font-bold md:hidden">Stufe</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-8">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<p className="text-muted">Loading…</p>}>
              <Routes>
                <Route path="/" element={<Today />} />
                <Route path="/study" element={<Study />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/grammar" element={<Grammar />} />
                <Route path="/grammar/:level/:group" element={<Grammar />} />
                <Route path="/reading" element={<Reading />} />
                <Route path="/reading/:id" element={<Reading />} />
                <Route path="/listening" element={<Listening />} />
                <Route path="/pronunciation" element={<Pronunciation />} />
                <Route path="/speaking" element={<Speaking />} />
                <Route path="/writing" element={<Writing />} />
                <Route path="/dictation" element={<Dictation />} />
                <Route path="/translate" element={<Translate />} />
                <Route path="/search" element={<Search />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/help" element={<Help />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
    </div>
  );
}
