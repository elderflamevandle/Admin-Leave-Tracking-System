"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production wire this to your logger / error tracking (Sentry, etc.)
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center h-full p-8 text-center"
          >
            <p className="text-destructive font-medium text-lg">Something went wrong.</p>
            <p className="text-muted-foreground text-sm mt-1">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
