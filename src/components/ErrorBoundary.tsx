import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Class component because error boundaries have no hook equivalent. Catches
// render/runtime throws (e.g. WebGL context loss) and shows a recoverable
// panel instead of a blank screen.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('WorldGen render error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-card glass-panel">
            <h2>{this.props.fallbackTitle ?? 'Something went wrong'}</h2>
            <p>The 3D scene hit an unexpected error. Your seed is safe in the URL.</p>
            <pre className="error-boundary-detail">{this.state.error.message}</pre>
            <div className="error-boundary-actions">
              <button className="btn btn-primary" type="button" onClick={this.handleReset}>
                Try again
              </button>
              <button className="btn" type="button" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
