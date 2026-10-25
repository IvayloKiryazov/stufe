import { Component, type ErrorInfo, type ReactNode } from "react";
import { t } from "../lib/i18n";
import { store } from "../lib/store";
import { Button } from "./ui/button";
import { Card, CardTitle } from "./ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors in the wrapped route and shows a friendly fallback
 * instead of a blank screen. Re-rendering is retried with "Try again".
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const lang = store.state.settings.language;
      return (
        <Card>
          <CardTitle>{t(lang, "error.title")}</CardTitle>
          <p className="text-base text-muted">{t(lang, "error.body")}</p>
          <p className="mt-1 text-sm text-muted" lang="en">
            {this.state.error.message}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => this.setState({ error: null })}>{t(lang, "error.retry")}</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {t(lang, "error.reload")}
            </Button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
