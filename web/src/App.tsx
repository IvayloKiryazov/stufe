import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Headphones,
  Home,
  Languages,
  Library,
  Menu,
  Monitor,
  Moon,
  Settings as SettingsIcon,
  Sun,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { cn } from "./lib/cn";
import { useTheme, type Theme } from "./lib/theme";
import Today from "./routes/Today";
import Study from "./routes/Study";
import Browse from "./routes/Browse";
import Grammar from "./routes/Grammar";
import Reading from "./routes/Reading";
import Dictation from "./routes/Dictation";
import Translate from "./routes/Translate";
import Settings from "./routes/Settings";
import Placeholder from "./routes/Placeholder";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Learn",
    items: [
      { to: "/", label: "Today", icon: Home, end: true },
      { to: "/study", label: "Study", icon: GraduationCap },
      { to: "/browse", label: "Browse", icon: Library },
      { to: "/grammar", label: "Grammar", icon: BookOpen },
    ],
  },
  {
    label: "Practice",
    items: [
      { to: "/reading", label: "Reading", icon: BookOpen },
      { to: "/dictation", label: "Dictation", icon: Headphones },
      { to: "/translate", label: "Translate", icon: Languages },
    ],
  },
  {
    label: "You",
    items: [
      { to: "/stats", label: "Stats", icon: BarChart3 },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
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
            <div key={section.label}>
              <div className="px-3 pb-1 text-xs uppercase tracking-wide text-muted">{section.label}</div>
              <div className="flex flex-col gap-1">
                {section.items.map(({ to, label, icon: Icon, end }) => (
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
                    {label}
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
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/study" element={<Study />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/grammar" element={<Grammar />} />
            <Route path="/grammar/:level/:group" element={<Grammar />} />
            <Route path="/reading" element={<Reading />} />
            <Route path="/reading/:id" element={<Reading />} />
            <Route path="/dictation" element={<Dictation />} />
            <Route path="/translate" element={<Translate />} />
            <Route path="/stats" element={<Placeholder title="Stats" />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
    </div>
  );
}
