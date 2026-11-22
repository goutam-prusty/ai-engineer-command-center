import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error?.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(readable);
      if (parsed && typeof parsed.error === 'string') {
        readable = `Sync/Data error (${parsed.operationType || 'operation'}): ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[var(--color-surface)] border border-[var(--color-line)] p-6 shadow-none">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[var(--color-sunken)] border border-[var(--color-line)] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[var(--color-ink)]" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-serif font-bold text-[var(--color-ink)]">
                  Something went wrong
                </h2>
                <p className="text-xs font-mono text-[var(--color-secondary)] mt-1 leading-relaxed break-words">
                  {this.state.message}
                </p>
                <p className="text-xs text-[var(--color-secondary)] mt-3">
                  Your local study progress remains safely stored in your browser. You can try
                  recovering the view or reloading the page.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={this.handleReset}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] text-xs font-mono font-bold hover:brightness-95 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recover View
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] text-xs font-mono font-bold hover:bg-[var(--color-sunken)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Reload App
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
