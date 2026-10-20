import { Component, type ErrorInfo, type ReactNode } from "react";
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
      return (
        <Card>
          <CardTitle>Something went wrong</CardTitle>
          <p className="text-base text-muted">This screen could not be displayed.</p>
          <p className="mt-1 text-sm text-muted" lang="en">
            {this.state.error.message}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => this.setState({ error: null })}>Try again</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload the app
            </Button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
