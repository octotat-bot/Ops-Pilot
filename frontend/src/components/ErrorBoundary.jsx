import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-[#f4f6f5]">
                    <div className="bg-white rounded-xl shadow-sm border border-[#eef2f1] p-10 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={28} />
                        </div>
                        <h1 className="text-xl font-bold text-[#1c2b2d] mb-2">Something went wrong</h1>
                        <p className="text-sm text-[#6f8487] mb-1">An unexpected error occurred in the application.</p>
                        <pre className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 text-left overflow-auto mb-6 max-h-32">
                            {this.state.error?.toString()}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1f6f78] text-white text-sm font-medium rounded-lg hover:bg-[#16555c] transition-colors"
                        >
                            <RefreshCw size={16} />
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
