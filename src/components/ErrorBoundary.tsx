
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SectionCard } from './common/SectionCard';

interface Props {
  children?: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-8">
          <SectionCard className="max-w-lg w-full border-red-200 bg-red-50/30">
             <div className="text-center space-y-4">
                 <h2 className="text-xl font-bold text-red-700">Something went wrong</h2>
                 <p className="text-gray-600 text-sm">
                     The application encountered an unexpected error.
                 </p>
                 {this.state.error && (
                     <div className="bg-white p-3 rounded text-left text-xs font-mono text-red-800 overflow-auto max-h-32 border border-red-100 shadow-inner">
                         {this.state.error.toString()}
                     </div>
                 )}
                 <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-bold shadow-sm"
                 >
                     Reload Application
                 </button>
             </div>
          </SectionCard>
        </div>
      );
    }

    return this.props.children;
  }
}
