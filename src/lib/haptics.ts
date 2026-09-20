/**
 * Smooth iOS-style Taptic / Haptic Feedback Utility
 * Uses navigator.vibrate with gentle micro-vibrations for high-end tactile feel.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'selection':
        // Crisp, ultra-short tap for tab selection / segmented controls
        navigator.vibrate(8);
        break;
      case 'light':
        // Subtle feedback for standard button taps
        navigator.vibrate(12);
        break;
      case 'medium':
        // Solid tap for primary actions (e.g. open modal, quick amount)
        navigator.vibrate(20);
        break;
      case 'heavy':
        // Stronger feedback for key actions
        navigator.vibrate(35);
        break;
      case 'success':
        // Distinct double-pulse for successful submission / transaction recorded
        navigator.vibrate([12, 40, 18]);
        break;
      case 'warning':
        // Alert tap
        navigator.vibrate([25, 50, 25]);
        break;
      case 'error':
        // Triple sharp tap
        navigator.vibrate([30, 40, 30, 40, 30]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch (err) {
    // Gracefully ignore if device policy or browser denies vibration
  }
}

export const haptic = {
  selection: () => triggerHaptic('selection'),
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
};
