import React from 'react';
import { Home, LineChart, UserCircle2, Settings } from 'lucide-react';

export default function MobileAppShell({ children, activeTab, onTabChange, onProfileClick, user }) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Top Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-[#09090b]/70 border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-4 flex items-center justify-between transition-colors duration-300">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-500 to-brand-700 dark:from-brand-400 dark:to-brand-600 bg-clip-text text-transparent">AnotoGym</h1>
        <button
          type="button"
          onClick={onProfileClick}
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all active:scale-95"
          aria-label="Abrir perfil"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-medium">
              {(user?.displayName || user?.email || 'ME').slice(0, 2).toUpperCase()}
            </span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-28 overflow-y-auto no-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full backdrop-blur-xl bg-white/80 dark:bg-[#09090b]/80 border-t border-zinc-200 dark:border-zinc-800/80 pb-safe pt-2 px-4 flex justify-between items-center z-20 transition-colors duration-300">
        <NavItem 
          icon={<Home size={24} />} 
          label="Rutina" 
          isActive={activeTab === 'routine'} 
          onClick={() => onTabChange('routine')} 
        />
        <NavItem 
          icon={<LineChart size={24} />} 
          label="Progreso" 
          isActive={activeTab === 'tracker'} 
          onClick={() => onTabChange('tracker')} 
        />
        <NavItem 
          icon={<UserCircle2 size={24} />} 
          label="Perfil" 
          isActive={activeTab === 'profile'} 
          onClick={() => onTabChange('profile')} 
        />
        <NavItem 
          icon={<Settings size={24} />} 
          label="Ajustes" 
          isActive={activeTab === 'settings'} 
          onClick={() => onTabChange('settings')} 
        />
      </nav>
      
      {/* Env padding for iOS bottom bar */}
      <div className="h-6 w-full fixed bottom-0 z-10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center p-2 min-w-[4rem] transition-all duration-200 ${isActive ? 'text-brand-600 dark:text-brand-400 scale-110' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:scale-105'}`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
