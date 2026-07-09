import React, { useEffect, useState } from 'react';
import { Home, LineChart, UserCircle2, Settings, Dumbbell } from 'lucide-react';

/**
 * Detecta si el teclado en pantalla está abierto (móvil). En iOS los elementos
 * `fixed` flotan de forma errática sobre el teclado al hacer scroll, así que
 * la nav inferior se oculta mientras se escribe y reaparece al cerrar el teclado.
 */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const onResize = () => {
      setOpen(window.innerHeight - vv.height > 150);
    };
    vv.addEventListener('resize', onResize);
    onResize();
    return () => vv.removeEventListener('resize', onResize);
  }, []);
  return open;
}

const NAV_ITEMS = [
  { key: 'routine', label: 'Rutina', icon: Home },
  { key: 'tracker', label: 'Progreso', icon: LineChart },
  { key: 'profile', label: 'Perfil', icon: UserCircle2 },
  { key: 'settings', label: 'Ajustes', icon: Settings },
];

function Logo({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 transition-opacity hover:opacity-80 active:scale-[0.98]"
      aria-label="Ir a la página principal"
    >
      <span className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
        <Dumbbell size={15} className="text-on-brand" />
      </span>
      <h1 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">AnotaGym</h1>
    </button>
  );
}

function Avatar({ user, size = 'w-8 h-8' }) {
  return user?.photoURL ? (
    <img src={user.photoURL} alt="Avatar" className={`${size} rounded-full object-cover`} />
  ) : (
    <span className={`${size} rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center text-xs font-medium`}>
      {(user?.displayName || user?.email || 'ME').slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function MobileAppShell({ children, activeTab, onTabChange, onProfileClick, user }) {
  const keyboardOpen = useKeyboardOpen();
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">

      {/* Sidebar (escritorio / tablet apaisada) */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen border-r border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950 p-4">
        <div className="px-2 py-2 mb-6">
          <Logo onClick={() => onTabChange('routine')} />
        </div>

        <nav className="flex flex-col gap-1">
          {/* Perfil no va en esta lista: su entrada es la fila de usuario de abajo */}
          {NAV_ITEMS.filter(({ key }) => key !== 'profile').map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                  ${isActive
                    ? 'bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'}`}
              >
                <Icon size={19} />
                {label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onProfileClick}
          className={`mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left
            ${activeTab === 'profile'
              ? 'bg-brand-100 dark:bg-brand-950/60'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}`}
        >
          <Avatar user={user} />
          <div className="min-w-0">
            <p className={`text-sm truncate ${activeTab === 'profile' ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-semibold'}`}>
              {user?.displayName || 'Mi perfil'}
            </p>
            {user?.email && <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>}
          </div>
        </button>
      </aside>

      {/* Columna principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header (solo móvil) */}
        <header
          className="md:hidden sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800/80 px-4 pb-3 flex items-center justify-between transition-colors duration-300"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          {/* Solo el logo: la entrada a Perfil ya está en la nav inferior */}
          <Logo onClick={() => onTabChange('routine')} />
        </header>

        {/* Contenido centrado con ancho máximo; key = animación al cambiar de pestaña */}
        <main className="flex-1 pb-28 md:pb-10 overflow-y-auto no-scrollbar">
          <div key={activeTab} className="mx-auto w-full max-w-2xl md:pt-4 animate-view-in">
            {children}
          </div>
          {/* La nav crece con la safe area: hueco extra para que el final del contenido no quede tapado */}
          <div className="md:hidden shrink-0" style={{ height: 'env(safe-area-inset-bottom)' }} />
        </main>
      </div>

      {/* Navegación inferior (solo móvil). El padding inferior respeta la barra
          de gestos del iPhone (safe area) para que los botones no queden debajo. */}
      <nav
        className={`md:hidden fixed bottom-0 w-full backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-t border-zinc-200 dark:border-zinc-800/80 pt-2 px-4 flex justify-between items-center z-20 transition-colors duration-300 ${keyboardOpen ? 'hidden' : ''}`}
        style={{ paddingBottom: 'max(0.5rem, calc(env(safe-area-inset-bottom) + 0.25rem))' }}
      >
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <NavItem
            key={key}
            icon={<Icon size={24} />}
            label={label}
            isActive={activeTab === key}
            onClick={() => onTabChange(key)}
          />
        ))}
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-1 min-w-[4rem] transition-colors duration-200 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
    >
      <span className={`px-4 py-1 rounded-full transition-colors duration-200 ${isActive ? 'bg-brand-100 dark:bg-brand-950/60' : ''}`}>
        {icon}
      </span>
      <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}
