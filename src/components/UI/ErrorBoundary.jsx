import React from 'react';

/**
 * Captura cualquier error de render de React y muestra una pantalla de
 * recuperación en lugar de dejar la app en negro (crash silencioso).
 * Los datos del usuario están a salvo: viven en Firestore/IndexedDB.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[AnotaGym] Error de render capturado:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(139 92 246)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.4 14.4 9.6 9.6" /><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" /><path d="m21.5 21.5-1.4-1.4" /><path d="M3.9 3.9 2.5 2.5" /><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Algo ha salido mal</h1>
        <p className="text-sm text-zinc-400 max-w-xs">
          Ha ocurrido un error inesperado. Tus datos están a salvo en la nube.
          Recarga la app para continuar.
        </p>
        <button
          onClick={this.handleReload}
          className="mt-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
        >
          Recargar la app
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-w-full overflow-auto text-left text-xs text-red-400 bg-zinc-900 rounded-lg p-3">
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        )}
      </div>
    );
  }
}
