import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldCheck } from 'lucide-react';

interface LiquidOtpInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  onComplete?: (code: string) => void;
  isLightMode?: boolean;
  disabled?: boolean;
  error?: string | null;
}

export const LiquidOtpInput: React.FC<LiquidOtpInputProps> = ({
  length = 4,
  value,
  onChange,
  onComplete,
  isLightMode = true,
  disabled = false,
  error = null,
}) => {
  const [digits, setDigits] = useState<string[]>(() => {
    const arr = Array(length).fill('');
    for (let i = 0; i < Math.min(value.length, length); i++) {
      arr[i] = value[i];
    }
    return arr;
  });

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync with value prop
  useEffect(() => {
    const arr = Array(length).fill('');
    for (let i = 0; i < Math.min(value.length, length); i++) {
      arr[i] = value[i];
    }
    setDigits(arr);
  }, [value, length]);

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const char = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    const fullCode = newDigits.join('');
    onChange(fullCode);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    if (newDigits.every((d) => d !== '')) {
      setIsSuccess(true);
      if (onComplete) {
        onComplete(fullCode);
      }
    } else {
      setIsSuccess(false);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
        setIsSuccess(false);
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
        setIsSuccess(false);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);
    const fullCode = newDigits.join('');
    onChange(fullCode);

    const nextFocus = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
    setActiveIndex(nextFocus);

    if (newDigits.every((d) => d !== '')) {
      setIsSuccess(true);
      if (onComplete) {
        onComplete(fullCode);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 4 Digit Capsules with Liquid Water Animation */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 my-2">
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index];
          const isFilled = Boolean(digit);
          const isCurrentActive = activeIndex === index;

          return (
            <div
              key={index}
              onClick={() => {
                inputRefs.current[index]?.focus();
                setActiveIndex(index);
              }}
              className={`relative w-14 sm:w-16 h-18 sm:h-20 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 select-none flex items-center justify-center ${
                isLightMode
                  ? 'bg-slate-100/80 border-2 shadow-sm'
                  : 'bg-slate-900/60 border-2 shadow-inner'
              } ${
                isCurrentActive
                  ? isLightMode
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-105'
                    : 'border-blue-400 shadow-lg shadow-blue-500/30 scale-105'
                  : isFilled
                  ? isLightMode
                    ? 'border-blue-400/80'
                    : 'border-blue-500/70'
                  : isLightMode
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Hidden Actual Input */}
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                id={`liquid-otp-input-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={disabled}
                onChange={(e) => handleInputChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => setActiveIndex(index)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-30"
                autoComplete="one-time-code"
              />

              {/* Water Liquid Fill Layer */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 w-full bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 z-10 pointer-events-none"
                initial={{ height: 0 }}
                animate={{
                  height: isFilled ? '100%' : '0%',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 180,
                  damping: 18,
                  mass: 0.8,
                }}
              >
                {/* Wavy surface on top of water */}
                {isFilled && (
                  <div className="absolute -top-2 left-0 right-0 h-4 overflow-hidden pointer-events-none opacity-80">
                    <svg
                      viewBox="0 0 100 20"
                      preserveAspectRatio="none"
                      className="w-full h-full text-sky-400 fill-current animate-pulse"
                    >
                      <path d="M0 10 Q 25 0 50 10 T 100 10 L 100 20 L 0 20 Z" />
                    </svg>
                  </div>
                )}

                {/* Animated Rising Bubbles */}
                {isFilled && (
                  <>
                    <span className="absolute bottom-2 left-[25%] w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce [animation-duration:1.4s]" />
                    <span className="absolute bottom-4 left-[65%] w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-duration:1.8s] [animation-delay:0.3s]" />
                    <span className="absolute bottom-1 left-[45%] w-1 h-1 rounded-full bg-white/80 animate-bounce [animation-duration:2.1s] [animation-delay:0.5s]" />
                  </>
                )}
              </motion.div>

              {/* Center Content: Digit or Placeholder */}
              <div className="relative z-20 flex items-center justify-center w-full h-full">
                <AnimatePresence mode="wait">
                  {isFilled ? (
                    <motion.span
                      key={`digit-${digit}`}
                      initial={{ y: 15, scale: 0.5, opacity: 0 }}
                      animate={{
                        y: [0, -2, 0],
                        scale: 1,
                        opacity: 1,
                      }}
                      exit={{ y: -10, scale: 0.5, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 15,
                        y: {
                          repeat: Infinity,
                          repeatType: 'reverse',
                          duration: 2,
                          ease: 'easeInOut',
                        },
                      }}
                      className="text-2xl sm:text-3xl font-black text-white drop-shadow-md select-none tracking-normal"
                    >
                      {digit}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-lg font-bold select-none ${
                        isCurrentActive
                          ? isLightMode
                            ? 'text-blue-500 animate-pulse'
                            : 'text-blue-400 animate-pulse'
                          : isLightMode
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {isCurrentActive ? '|' : '•'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Success Badge Ripple */}
              {isSuccess && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="absolute inset-0 rounded-2xl bg-sky-300/30 pointer-events-none z-20"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error state if any */}
      {error && (
        <p className="text-xs text-rose-500 font-medium mt-2 animate-shake">
          {error}
        </p>
      )}

      {/* Verified feedback indicator */}
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Kode Keamanan Terverifikasi</span>
        </motion.div>
      )}
    </div>
  );
};
