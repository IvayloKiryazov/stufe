import { Link } from "react-router-dom";
import { useTheme, type Theme } from "../lib/theme";
import { Button } from "../components/ui/button";
import { Card, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted">Preferences for the app.</p>
      </header>

      <Card>
        <CardTitle>Appearance</CardTitle>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">Theme</span>
          <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <CardTitle>More</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/help">Help</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/credits">Credits &amp; licenses</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
