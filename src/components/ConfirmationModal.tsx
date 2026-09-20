import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, CheckCircle, X } from 'lucide-react';
import { GlassButton } from './GlassButton';
import { GlassSettings } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  settings?: GlassSettings;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  settings,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div
        style={{
          background: 'rgba(22, 26, 48, 0.95)',
          backdropFilter: 'blur(32px) saturate(190%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1.5px 1px rgba(255, 255, 255, 0.35)'
        }}
        className="w-full max-w-md rounded-3xl border border-white/20 p-6 text-slate-100 shadow-2xl relative my-auto"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              variant === 'danger'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-6 h-6 text-rose-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <GlassButton size="sm" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </GlassButton>
          <GlassButton
            size="sm"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            settings={settings}
          >
            {confirmLabel}
          </GlassButton>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};
