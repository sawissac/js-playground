"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              {/* Error Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                Something went wrong
              </h1>
              <p className="text-slate-600 text-center mb-6">
                The application encountered an unexpected error. Don't worry, your work is auto-saved.
              </p>

              {/* Error Details (Collapsible) */}
              <details className="mb-6">
                <summary className="text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900 mb-2">
                  Technical Details
                </summary>
                <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-64">
                  <div className="text-xs font-mono text-slate-100">
                    <div className="text-red-400 font-semibold mb-2">
                      {this.state.error?.name}: {this.state.error?.message}
                    </div>
                    {this.state.error?.stack && (
                      <pre className="text-slate-300 whitespace-pre-wrap break-words">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-slate-400 mb-2">Component Stack:</div>
                        <pre className="text-slate-300 whitespace-pre-wrap break-words">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1 gap-2"
                >
                  <RefreshCw size={16} />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <RefreshCw size={16} />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleHome}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Home size={16} />
                  Go Home
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                  If this problem persists, try clearing your browser cache or contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundary for feature modules
export function FeatureErrorBoundary({ children, featureName }: { children: ReactNode; featureName: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-red-900 mb-1">
              {featureName} Error
            </h3>
            <p className="text-xs text-red-700">
              This component encountered an error. Other features should still work.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
