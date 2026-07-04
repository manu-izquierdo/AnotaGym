import React from 'react';
import { Home, LineChart, UserCircle2, Settings, Dumbbell } from 'lucide-react';

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
        <Dumbbell size={15} className="text-white" />
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
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">

      {/* Sidebar (escritorio / tablet apaisada) */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen border-r border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-[#09090b] p-4">
        <div className="px-2 py-2 mb-6">
          <Logo onClick={() => onTabChange('routine')} />
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
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
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors text-left"
        >
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.displayName || 'Mi perfil'}</p>
            {user?.email && <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>}
          </div>
        </button>
      </aside>

      {/* Columna principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header (solo móvil) */}
        <header
          className="md:hidden sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-[#09090b]/70 border-b border-zinc-200 dark:border-zinc-800/80 px-4 pb-3 flex items-center justify-between transition-colors duration-300"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <Logo onClick={() => onTabChange('routine')} />
          <button
            type="button"
            onClick={onProfileClick}
            className="rounded-full overflow-hidden transition-all active:scale-95"
            aria-label="Abrir perfil"
          >
            <Avatar user={user} />
          </button>
        </header>

        {/* Contenido centrado con ancho máximo */}
        <main className="flex-1 pb-28 md:pb-10 overflow-y-auto no-scrollbar">
          <div className="mx-auto w-full max-w-2xl md:pt-4">
            {children}
          </div>
        </main>
      </div>

      {/* Navegación inferior (solo móvil) */}
      <nav className="md:hidden fixed bottom-0 w-full backdrop-blur-xl bg-white/80 dark:bg-[#09090b]/80 border-t border-zinc-200 dark:border-zinc-800/80 pb-safe pt-2 px-4 flex justify-between items-center z-20 transition-colors duration-300">
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

      {/* Env padding for iOS bottom bar */}
      <div className="md:hidden h-6 w-full fixed bottom-0 z-10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
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
