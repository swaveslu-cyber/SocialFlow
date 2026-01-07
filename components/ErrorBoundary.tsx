import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
      localStorage.clear(); // Clear potentially corrupt state
      window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              The application encountered an unexpected error.
            </p>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl text-left mb-6 overflow-hidden">
                <p className="font-mono text-xs text-red-500 break-words">
                    {this.state.error?.message}
                </p>
            </div>
            <div className="space-y-3">
                <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                <RefreshCw className="w-4 h-4" /> Reload Application
                </button>
                <button
                onClick={this.handleReset}
                className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                <Trash2 className="w-4 h-4" /> Clear Cache & Restart
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children || null;
  }
}