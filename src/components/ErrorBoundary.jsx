import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-zinc-900 text-red-500 font-mono h-screen overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <h2 className="text-xl text-white mb-2">{this.state.error?.toString()}</h2>
                    <pre className="text-sm bg-black p-4 rounded text-zinc-400 whitespace-pre-wrap">
                        {this.state.errorInfo?.componentStack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
