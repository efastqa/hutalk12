import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';
import './index.css';

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
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
