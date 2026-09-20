import React from 'react';
import { GlassSettings } from '../types';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  settings: GlassSettings;
  id?: string;
  enableTilt?: boolean;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  className = '',
  settings,
  id
}) => {
  const opacityDecimal = (settings.translucency || 65) / 100;
  const darkTintDecimal = (settings.darkTint || 45) / 100;
  const specular = (settings.specularIntensity || 85) / 100;
  const theme = settings.themeMode || 'dark';

  let bgColor = `rgba(${Math.round(14 * (1 - darkTintDecimal))}, ${Math.round(16 * (1 - darkTintDecimal))}, ${Math.round(30 * (1 - darkTintDecimal))}, ${opacityDecimal})`;
  let borderColor = `rgba(255, 255, 255, ${0.12 * specular})`;
  let boxShadow = `
    0 20px 40px -10px rgba(0, 0, 0, 0.55),
    inset 0 1.5px 0.5px rgba(255, 255, 255, ${0.45 * specular}),
    inset 0 -1px 1px rgba(0, 0, 0, 0.5)
  `;
  let highlightColor = `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, ${0.7 * specular}) 50%, transparent 100%)`;

  if (theme === 'light') {
    bgColor = `rgba(255, 255, 255, ${Math.min(0.88, 0.65 + opacityDecimal * 0.18)})`;
    borderColor = 'rgba(226, 232, 240, 0.85)';
    boxShadow = `
      0 16px 40px -12px rgba(99, 102, 241, 0.08),
      0 4px 16px -2px rgba(148, 163, 184, 0.08),
      inset 0 1.5px 1px rgba(255, 255, 255, 0.95),
      inset 0 -1px 1px rgba(241, 245, 249, 0.6)
    `;
    highlightColor = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.98) 50%, transparent 100%)';
  } else if (theme === 'beige') {
    bgColor = `rgba(255, 253, 248, ${Math.min(0.94, 0.78 + opacityDecimal * 0.2)})`;
    borderColor = 'rgba(224, 214, 200, 0.9)';
    boxShadow = `
      0 12px 32px -8px rgba(60, 45, 30, 0.07),
      0 2px 6px -1px rgba(60, 45, 30, 0.03),
      inset 0 1.5px 0.5px rgba(255, 255, 255, 0.95)
    `;
    highlightColor = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%)';
  } else if (theme === 'midnight') {
    bgColor = `rgba(0, 0, 0, ${Math.min(0.96, 0.82 + opacityDecimal * 0.15)})`;
    borderColor = 'rgba(255, 255, 255, 0.18)';
    boxShadow = `
      0 25px 50px -10px rgba(0, 0, 0, 0.95),
      inset 0 1.5px 0.5px rgba(255, 255, 255, 0.35),
      inset 0 -1px 1px rgba(0, 0, 0, 0.9)
    `;
    highlightColor = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)';
  }

  return (
    <div
      id={id}
      style={{
        backgroundColor: bgColor,
        backdropFilter: `blur(${settings.blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${settings.blur}px) saturate(180%)`,
        borderColor,
        boxShadow,
      }}
      className={`rounded-3xl border relative overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Top Rim Specular Highlight Bar */}
      <div 
        className="absolute top-0 inset-x-4 h-[1px] pointer-events-none z-10"
        style={{
          background: highlightColor
        }}
      />

      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

