import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = '', glow = false }: CardProps) {
  return (
    <div
      className={`relative rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 text-slate-100 shadow-xl transition-all duration-300 ${
        glow ? 'border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]' : 'hover:border-slate-700'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold tracking-tight text-white flex items-center gap-2 ${className}`}>{children}</h3>;
}
