import React from 'react';
import { GlassSettings } from '../types';
import { triggerHaptic } from '../lib/haptics';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  settings?: GlassSettings;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  settings,
  icon,
  className = '',
  onClick,
  ...props
}) => {
  const specular = settings ? settings.specularIntensity / 100 : 0.9;
  const isDark = settings?.themeMode === 'dark' || settings?.themeMode === 'midnight';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'danger') {
      triggerHaptic('warning');
    } else if (variant === 'primary') {
      triggerHaptic('medium');
    } else {
      triggerHaptic('light');
    }
    onClick?.(e);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-full gap-1.5',
    md: 'px-4 py-2 text-sm rounded-full gap-2',
    lg: 'px-6 py-2.5 text-base rounded-full gap-2.5'
  };

  // Liquid glass styling classes adaptive to theme
  let variantClasses = {
    primary: isDark
      ? 'bg-blue-600/30 hover:bg-blue-600/50 text-white border-blue-400/40'
      : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-500/50 shadow-blue-500/25',
    secondary: isDark
      ? 'bg-white/[0.08] hover:bg-white/[0.16] text-slate-100 border-white/20'
      : 'bg-white/80 hover:bg-white text-slate-800 border-slate-200/90 shadow-slate-200/60',
    danger: isDark
      ? 'bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 border-rose-400/30'
      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/80',
    ghost: isDark
      ? 'bg-transparent hover:bg-white/[0.08] text-slate-300 hover:text-white border-transparent'
      : 'bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 border-transparent'
  };

  let customBoxShadow = undefined;
  if (variant !== 'ghost') {
    if (isDark) {
      customBoxShadow = `
        0 8px 20px -6px rgba(0, 0, 0, 0.5),
        inset 0 1.5px 1px 0 rgba(255, 255, 255, ${0.45 * specular}),
        inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)
      `;
    } else {
      customBoxShadow = `
        0 6px 16px -4px rgba(99, 102, 241, 0.1),
        0 2px 6px -1px rgba(100, 116, 139, 0.06),
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)
      `;
    }
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      style={{
        boxShadow: customBoxShadow,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)'
      }}
      className={`relative inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none border ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {/* Top Rim Highlight on hover/active */}
      <span
        className="absolute top-0 inset-x-3 h-[1px] pointer-events-none opacity-80"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%)'
        }}
      />
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};
