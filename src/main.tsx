import React, { ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[App ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0C10] p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-lg space-y-4">
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              Something went wrong on this view
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tap below to reload HUTA.lk and return to the marketplace cleanly.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-sm font-bold cursor-pointer transition-colors"
            >
              Return to Marketplace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Intercept and gracefully route benign Firestore idle stream timeout notices
if (typeof window !== 'undefined' && window.console) {
  const originalConsoleError = window.console.error;
  window.console.error = (...args: any[]) => {
    const fullText = args
      .map((a) => (typeof a === 'string' ? a : a?.message || String(a)))
      .join(' ');

    if (
      fullText.includes('Disconnecting idle stream') ||
      fullText.includes('Timed out waiting for new targets') ||
      (fullText.includes('@firebase/firestore') && fullText.includes('CANCELLED')) ||
      (fullText.includes('GrpcConnection') && fullText.includes('CANCELLED')) ||
      fullText.includes('cancelling stream')
    ) {
      console.debug('[Firestore Stream Lifecycle Notice]', ...args);
      return;
    }
    originalConsoleError.apply(window.console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
