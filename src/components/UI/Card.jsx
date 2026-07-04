import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-none hover:shadow-md transition-shadow rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 ${className}`}>
      {children}
    </h3>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input 
      className={`w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all ${className}`}
      {...props}
    />
  );
}

export function Label({ children, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ${className}`}>
      {children}
    </label>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyles = "w-full rounded-xl font-medium py-3 px-4 flex items-center justify-center transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-sm",
    secondary: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700",
    ghost: "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
