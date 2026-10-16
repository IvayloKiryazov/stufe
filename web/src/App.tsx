import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Home,
  Library,
  Menu,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { cn } from "./lib/cn";
import Today from "./routes/Today";
import Placeholder from "./routes/Placeholder";

const NAV = [
  { to: "/", label: "Today", icon: Home, end: true },
  { to: "/study", label: "Study", icon: GraduationCap },
  { to: "/browse", label: "Browse", icon: Library },
  { to: "/grammar", label: "Grammar", icon: BookOpen },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

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
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
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
        </nav>
      </aside>

      <div className="flex min-h-full flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-serif text-lg font-bold">Stufe</span>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/study" element={<Placeholder title="Study" />} />
            <Route path="/browse" element={<Placeholder title="Browse" />} />
            <Route path="/grammar" element={<Placeholder title="Grammar" />} />
            <Route path="/stats" element={<Placeholder title="Stats" />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
          </Routes>
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
    </div>
  );
}
