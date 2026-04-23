import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export default function LoginView() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loginAsGuest, redirectError } = useAuth();

  const [mode, setMode]               = useState('login');   // 'login' | 'register'
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const visibleError = error || redirectError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    const result =
      mode === 'login'
        ? await loginWithEmail(email.trim(), password)
        : await registerWithEmail(email.trim(), password, displayName.trim());
    if (!result.ok) setError(result.message);
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const result = await loginWithGoogle();
    if (result && !result.ok) setError(result.message);
    setLoading(false);
  };

  const handleGuest = async () => {
    setError('');
    setLoading(true);
    const result = await loginAsGuest();
    if (!result.ok) setError(result.message);
    setLoading(false);
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-5">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[28rem] h-[28rem] rounded-full bg-brand-600/15 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[28rem] h-[28rem] rounded-full bg-brand-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[360px] space-y-7">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-[2.75rem] font-black tracking-tighter bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 bg-clip-text text-transparent leading-none">
            AnotaGym
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta gratuita'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/70 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl shadow-black/40 space-y-4">

          {/* Error */}
          {visibleError && (
            <div className="bg-red-950/40 border border-red-800/40 rounded-2xl px-4 py-3">
              <p className="text-red-400 text-xs font-medium leading-snug">{visibleError}</p>
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-900 font-semibold text-sm py-3 px-4 rounded-2xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {loading ? <Spinner /> : <GoogleIcon />}
            {loading ? 'Conectando…' : 'Continuar con Google'}
          </button>

          {/* Guest */}
          <button
            type="button"
            onClick={handleGuest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 active:bg-zinc-600/80 text-zinc-200 font-semibold text-sm py-3 px-4 rounded-2xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 border border-zinc-700/50"
          >
            Entrar como invitado
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-[11px] font-medium tracking-wide uppercase">o</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete={mode === 'login' ? 'email' : 'new-email'}
              required
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Contraseña (mín. 6 caracteres)' : 'Contraseña'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm py-3 rounded-2xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-900/30"
            >
              {loading ? <Spinner /> : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
            </button>
          </form>

          {/* Mode toggle */}
          <p className="text-center text-xs text-zinc-600">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button"
              onClick={switchMode}
              className="text-brand-400 font-semibold hover:text-brand-300 transition-colors"
            >
              {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
