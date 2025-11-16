import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Fix: Remove 'public' modifiers which can sometimes cause type resolution issues.
export class ErrorBoundary extends Component<Props, State> {
  // Fix: Replaced constructor with a state class property for cleaner state initialization. This resolves the type errors related to 'state' and 'props'.
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100 p-8">
            <div className="text-center bg-white p-10 rounded-lg shadow-lg max-w-lg">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Something Went Wrong</h1>
                <p className="text-gray-700 mb-6">We've encountered an unexpected error. Please try refreshing the page.</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md shadow-sm hover:bg-primary-700"
                >
                    Refresh Page
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
