import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#7f1d1d', background: '#fff1f2', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>⚠ Error de Aplicación</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', background: '#fee2e2', padding: '1rem', borderRadius: '4px' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#991b1b' }}>
            Comparte este mensaje con el desarrollador para diagnosticar el problema.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
