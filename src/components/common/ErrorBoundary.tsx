import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Component Tree:', error, errorInfo);
  }

  private handleHardReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (e) {}
    window.location.reload();
  };

  private handleResetAll = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await this.handleHardReload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-charcoal-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-700/80 flex items-center justify-center text-red-400 mb-4 shadow-xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-xs text-charcoal-400 max-w-md mb-4 font-mono bg-charcoal-900 border border-charcoal-800 p-3 rounded-xl text-red-300">
            {this.state.error?.message || 'Unknown Application Error'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleHardReload}
              className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-2 shadow"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Cache & Reload App</span>
            </button>

            <button
              onClick={this.handleResetAll}
              className="bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 border border-charcoal-700 px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset & Fresh Start</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
