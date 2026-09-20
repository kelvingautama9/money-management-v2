import React, { useRef, useState, useEffect } from 'react';

interface InteractiveGlossyCardProps {
  children: React.ReactNode;
  accentColor?: 'emerald' | 'rose' | 'sky';
  className?: string;
  contentClassName?: string;
  onClick?: () => void;
  isDark?: boolean;
}

export const InteractiveGlossyCard: React.FC<InteractiveGlossyCardProps> = ({
  children,
  accentColor = 'emerald',
  className = '',
  contentClassName = '',
  onClick,
  isDark = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchOrCoarse, setIsTouchOrCoarse] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const coarseQuery = window.matchMedia('(pointer: coarse)');
      const checkPointer = () => {
        setIsTouchOrCoarse(coarseQuery.matches || 'ontouchstart' in window);
      };
      checkPointer();
      coarseQuery.addEventListener('change', checkPointer);
      return () => coarseQuery.removeEventListener('change', checkPointer);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isTouchOrCoarse) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Soft atmospheric glass tint colors
  const glassTint = {
    emerald: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
    rose: isDark ? 'rgba(244, 63, 94, 0.08)' : 'rgba(244, 63, 94, 0.04)',
    sky: isDark ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.04)'
  }[accentColor];

  // Clockwise rotating border highlight gradient: (grey -> light grey -> grey) in ALL themes, NO GLOW
  const beamGradient = isDark
    ? 'conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(148, 163, 184, 0) 255deg, rgba(148, 163, 184, 0.40) 280deg, rgba(203, 213, 225, 0.85) 310deg, rgba(241, 245, 249, 0.98) 325deg, #f8fafc 330deg, rgba(241, 245, 249, 0.98) 335deg, rgba(203, 213, 225, 0.85) 345deg, rgba(148, 163, 184, 0.40) 355deg, rgba(148, 163, 184, 0) 360deg)'
    : 'conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(100, 116, 139, 0) 255deg, rgba(100, 116, 139, 0.40) 280deg, rgba(148, 163, 184, 0.80) 310deg, rgba(203, 213, 225, 0.98) 325deg, #cbd5e1 330deg, rgba(203, 213, 225, 0.98) 335deg, rgba(148, 163, 184, 0.80) 345deg, rgba(100, 116, 139, 0.40) 355deg, rgba(100, 116, 139, 0) 360deg)';

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => {
        if (!isTouchOrCoarse) setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
      onMouseMove={handleMouseMove}
      className={`relative rounded-2xl sm:rounded-3xl overflow-hidden group transition-all duration-300 ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
      style={
        isDark
          ? {
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.015) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderTop: '1px solid rgba(255, 255, 255, 0.26)',
              boxShadow:
                '0 12px 32px -8px rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25), inset 0 0 20px 0 rgba(255, 255, 255, 0.02)'
            }
          : {
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.75) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow:
                '0 12px 30px -10px rgba(15, 23, 42, 0.08), 0 4px 12px -3px rgba(15, 23, 42, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)'
            }
      }
    >
      {/* 0. Clockwise Moving Border Stroke Highlight (Pure Crisp Stroke, NO GLOW) */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-[5] overflow-hidden"
        style={{
          boxSizing: 'border-box',
          padding: '1.5px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 animate-border-beam-clockwise pointer-events-none"
          style={{
            width: '350%',
            aspectRatio: '1 / 1',
            background: beamGradient,
          }}
        />
      </div>

      {/* 1. Subtle Atmospheric Glass Corner Tint (Refractive depth) */}
      <div
        className="absolute -top-10 -left-10 w-44 h-44 rounded-full pointer-events-none blur-2xl transition-opacity duration-300"
        style={{ background: glassTint }}
      />

      {/* 2. 3D Diagonal Glass Sheen Reflection */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.015) 35%, transparent 65%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 65%)'
        }}
      />

      {/* 3. Top Specular Rim Highlight Bar */}
      <div
        className="absolute top-0 inset-x-5 h-[1px] pointer-events-none"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%)'
        }}
      />

      {/* 4. Soft Liquid Refraction Light on Hover (Desktop) */}
      {isHovering && !isTouchOrCoarse && (
        <div
          className="absolute pointer-events-none transition-opacity duration-200"
          style={{
            left: mousePos.x - 100,
            top: mousePos.y - 100,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, transparent 70%)',
            filter: 'blur(8px)'
          }}
        />
      )}

      {/* 5. Card Content Wrapper */}
      <div className={`relative z-10 w-full h-full flex flex-col justify-between ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};
