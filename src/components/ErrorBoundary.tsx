import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env?.DEV;
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="text-6xl">😵</div>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            Aduh, ada yang error nih!
          </h2>
          {isDev && this.state.error?.message && (
            <p className="mt-3 break-words rounded-md bg-muted p-2 text-xs text-muted-foreground">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
