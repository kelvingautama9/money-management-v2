import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidOtpInput } from './LiquidOtpInput';
import {
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Info,
  Code
} from 'lucide-react';
import { GlassSettings, ThemeMode } from '../types';

interface LoginPageProps {
  onLoginWithGoogle: () => Promise<void>;
  onVerifyPin?: (pin: string) => Promise<boolean | void>;
  isLoggingIn: boolean;
  loginError?: string | null;
  spreadsheetId: string;
  sheetName: string;
  onUpdateSpreadsheetConfig: (id: string, name: string) => void;
  settings: GlassSettings;
  onSelectTheme: (mode: ThemeMode) => void;
  onSuccessfulAuthTransition: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginWithGoogle,
  onVerifyPin,
  isLoggingIn,
  loginError,
  spreadsheetId,
  sheetName,
  onUpdateSpreadsheetConfig,
  settings,
  onSelectTheme,
  onSuccessfulAuthTransition
}) => {
  const [authMode, setAuthMode] = useState<'google' | 'pin'>('google');
  const [pinCode, setPinCode] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [tempSpreadsheetId, setTempSpreadsheetId] = useState<string>(spreadsheetId);
  const [tempSheetName, setTempSheetName] = useState<string>(sheetName);
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>('dark');

  // Set default theme to Dark with Apple ultra liquid glass
  useEffect(() => {
    if (themePreference === 'dark') {
      onSelectTheme('dark');
    } else if (themePreference === 'light') {
      onSelectTheme('light');
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      onSelectTheme(mediaQuery.matches ? 'dark' : 'light');
    }
  }, [themePreference, onSelectTheme]);

  const isLight = settings.themeMode === 'light' || settings.themeMode === 'beige';

  const handleSaveSpreadsheetConfig = () => {
    onUpdateSpreadsheetConfig(tempSpreadsheetId, tempSheetName);
    setShowConfig(false);
  };

  const handlePinComplete = async (code: string) => {
    setIsVerifyingPin(true);
    setPinError(null);
    try {
      if (code !== '0000') {
        setPinError('Kode Dev Mode salah. Gunakan kode 0000 untuk masuk ke mode pengembangan.');
        setIsVerifyingPin(false);
        return;
      }
      if (onVerifyPin) {
        const res = await onVerifyPin('0000');
        if (res !== false) {
          onSuccessfulAuthTransition();
        } else {
          setPinError('Gagal memverifikasi Dev Mode.');
        }
      } else {
        onSuccessfulAuthTransition();
      }
    } catch (err: any) {
      setPinError(err?.message || 'Verifikasi gagal');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden transition-colors duration-500 ${
        isLight
          ? 'bg-slate-100 text-slate-900'
          : 'bg-[#060713] text-slate-100'
      }`}
    >
      {/* Dynamic Ambient Fluid Light Orbs */}
      <div
        className={`ambient-glow-1 -top-32 -left-32 ${
          isLight ? 'opacity-30' : 'opacity-70'
        }`}
      />
      <div
        className={`ambient-glow-2 top-1/2 -right-32 ${
          isLight ? 'opacity-25' : 'opacity-60'
        }`}
      />
      <div
        className={`ambient-glow-3 -bottom-32 left-1/3 ${
          isLight ? 'opacity-25' : 'opacity-60'
        }`}
      />

      {/* Top Header Controls: Theme Mode Picker with Crisp Liquid Glass Contrast */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-8 z-30 flex items-center gap-1.5 p-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/20 shadow-lg shadow-black/10 dark:shadow-black/40">
        <button
          onClick={() => setThemePreference('system')}
          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            themePreference === 'system'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
          title="Ikuti Tema Sistem / Browser"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Sistem</span>
        </button>

        <button
          onClick={() => setThemePreference('light')}
          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            themePreference === 'light'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
          title="Tema Light iOS"
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Light</span>
        </button>

        <button
          onClick={() => setThemePreference('dark')}
          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            themePreference === 'dark'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
          title="Tema Dark Liquid Glass"
        >
          <Moon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Dark</span>
        </button>
      </div>

      {/* Main Liquid Glass Portal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-20"
      >
        <div
          className={`relative rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 shadow-2xl ${
            isLight
              ? 'bg-white/85 border border-white/90 shadow-slate-300/60 text-slate-900'
              : 'bg-slate-900/60 border border-white/15 shadow-black/80 text-white'
          }`}
          style={
            isLight
              ? {
                  background: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(32px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(32px) saturate(190%)',
                  boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.12), inset 0 1.5px 1px rgba(255, 255, 255, 0.95)'
                }
              : undefined
          }
        >
          {/* Specular Glare Effect on Top Border */}
          <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-sky-400/50 to-transparent" />

          {/* App Branding & Logo */}
          <div className="text-center space-y-2 mb-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-lg shadow-blue-500/30 mb-1"
            >
              <FileSpreadsheet className="w-7 h-7 text-white" />
            </motion.div>

            <h1
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isLight ? '!text-slate-950 text-slate-950 font-black' : 'text-white'
              }`}
            >
              Financial Tracker
            </h1>

            <p
              className={`text-xs sm:text-sm font-medium ${
                isLight ? '!text-slate-700 text-slate-700' : 'text-slate-400'
              }`}
            >
              Autentikasi & Sinkronisasi Aman Google Sheets
            </p>
          </div>

          {/* Mode Switcher: Google Fast Login vs PIN Verification */}
          <div
            className={`flex items-center p-1 rounded-2xl mb-6 border ${
              isLight
                ? 'bg-slate-200/80 border-slate-300/80'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <button
              onClick={() => setAuthMode('google')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                authMode === 'google'
                  ? isLight
                    ? 'bg-white !text-slate-950 text-slate-950 shadow-sm border border-slate-200/90'
                    : 'bg-blue-600/30 text-white border border-blue-400/40 shadow-sm'
                  : isLight
                  ? '!text-slate-700 text-slate-700 hover:text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span className={isLight ? '!text-slate-950 text-slate-950 font-bold' : ''}>Login Google</span>
            </button>

            <button
              onClick={() => {
                setAuthMode('pin');
                setPinError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                authMode === 'pin'
                  ? isLight
                    ? 'bg-white !text-slate-950 text-slate-950 shadow-sm border border-slate-200/90'
                    : 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm'
                  : isLight
                  ? '!text-slate-700 text-slate-700 hover:text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span className={isLight ? '!text-slate-950 text-slate-950 font-bold' : ''}>Dev Mode (0000)</span>
            </button>
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {authMode === 'google' ? (
              <motion.div
                key="google-mode"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    isLight
                      ? 'bg-blue-50/90 border-blue-200/90 text-slate-900'
                      : 'bg-blue-500/10 border-blue-400/20 text-blue-200'
                  }`}
                >
                  <div className={`flex items-center gap-2 font-bold mb-1 ${isLight ? '!text-blue-900 text-blue-900' : ''}`}>
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className={isLight ? '!text-blue-900 text-blue-900 font-bold' : ''}>Perlindungan Privasi Keuangan</span>
                  </div>
                  <p className={isLight ? '!text-slate-700 text-slate-700 leading-relaxed' : 'opacity-90'}>
                    Ketika Anda logout, seluruh angka, saldo rekening, dan rekapan pengeluaran otomatis dinolkan (
                    <span className={`font-semibold ${isLight ? '!text-slate-950 text-slate-950 font-bold' : ''}`}>Rp 0 / -</span>) untuk menjamin kerahasiaan data pribadi Anda.
                  </p>
                </div>

                {/* Primary Google Sign-In Ultra Liquid Glass Button */}
                <button
                  onClick={onLoginWithGoogle}
                  disabled={isLoggingIn}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 shadow-xl active:scale-[0.98] disabled:opacity-60 relative overflow-hidden group cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 !text-slate-950 text-slate-950 border border-slate-300 shadow-slate-300/50'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-indigo-500 text-white border border-white/20 shadow-blue-500/25'
                  }`}
                >
                  {/* Apple Liquid Glass Specular Reflection */}
                  <span className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
                  
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className={`w-5 h-5 animate-spin ${isLight ? 'text-slate-900' : 'text-white'}`} />
                      <span className={isLight ? '!text-slate-950 text-slate-950 font-bold' : ''}>Menghubungkan Akun Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span className={isLight ? '!text-slate-950 text-slate-950 font-bold' : ''}>Masuk Cepat dengan Google</span>
                      <ArrowRight className={`w-4 h-4 ml-auto ${isLight ? 'text-slate-700' : 'opacity-70'}`} />
                    </>
                  )}
                </button>

                {loginError && (
                  <div className="text-xs text-rose-400 font-medium bg-rose-500/10 p-3 rounded-2xl border border-rose-500/25 space-y-2">
                    <p className="text-center">{loginError}</p>
                    {loginError.includes('unauthorized-domain') && (
                      <div className="text-[11px] text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-white/10 text-left space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Solusi Cepat (Firebase Console):</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          Domain cloud ini belum didaftarkan di Firebase Authentication. Tambahkan domain <strong>run.app</strong> di Firebase Console agar berlaku otomatis untuk semua akun Google AI Studio tanpa bentrok.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('run.app');
                              alert('Teks "run.app" berhasil disalin! Masukkan ke Firebase Console > Authentication > Settings > Authorized domains');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] transition active:scale-95 cursor-pointer shadow"
                          >
                            Salin "run.app" (Rekomendasi)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.hostname);
                              alert(`Domain "${window.location.hostname}" berhasil disalin!`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-[10px] transition active:scale-95 cursor-pointer"
                          >
                            Salin Hostname Saat Ini
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Buka: <em>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains &gt; Add domain</em>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="pin-mode"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/30 text-[11px] font-bold mb-1">
                    <Code className="w-3 h-3" />
                    <span>Mode Pengembangan (UI Inspection)</span>
                  </div>
                  <h3
                    className={`text-sm font-bold ${
                      isLight ? '!text-slate-950 text-slate-950' : 'text-slate-200'
                    }`}
                  >
                    Masukkan Kode Dev: 0000
                  </h3>
                  <p
                    className={`text-xs ${
                      isLight ? '!text-slate-700 text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    Digunakan untuk memantau tampilan antarmuka. Seluruh angka diset <strong>Rp 0</strong> tanpa memuat data pribadi.
                  </p>
                </div>

                {/* The Water Fill Liquid OTP Component */}
                <LiquidOtpInput
                  length={4}
                  value={pinCode}
                  onChange={setPinCode}
                  onComplete={handlePinComplete}
                  isLightMode={isLight}
                  disabled={isVerifyingPin}
                  error={pinError}
                />

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPinCode('0000');
                      handlePinComplete('0000');
                    }}
                    className={`text-[11px] font-semibold underline underline-offset-4 ${
                      isLight ? '!text-amber-700 text-amber-700 hover:text-amber-800' : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    Klik di sini untuk otomatis isi 0000
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => handlePinComplete(pinCode || '0000')}
                    disabled={isVerifyingPin}
                    className="w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-xl active:scale-[0.98] relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 !text-slate-950 text-slate-950 border border-amber-300/40 shadow-amber-500/20 cursor-pointer"
                  >
                    <span className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
                    {isVerifyingPin ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span className="!text-slate-950 text-slate-950 font-bold">Memverifikasi Dev Mode...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span className="!text-slate-950 text-slate-950 font-bold">Masuk Dev Mode (Kode: 0000)</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spreadsheet Project Settings Toggle */}
          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                isLight
                  ? 'hover:bg-slate-100 !text-slate-900 text-slate-900 font-bold'
                  : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span className={isLight ? '!text-slate-900 text-slate-900 font-bold' : ''}>Pengaturan Spreadsheet Target</span>
              </span>
              <span className="text-[11px] font-mono text-blue-600 font-bold">
                {sheetName || 'SEPTEMBER'} ▾
              </span>
            </button>

            {showConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-3 space-y-3 p-3.5 rounded-2xl border text-xs ${
                  isLight
                    ? 'bg-slate-50/90 border-slate-200 text-slate-900'
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-white'
                }`}
              >
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isLight ? '!text-slate-800 text-slate-800' : 'text-slate-400'}`}>
                    Google Spreadsheet Link atau ID:
                  </label>
                  <input
                    type="text"
                    value={tempSpreadsheetId}
                    onChange={(e) => setTempSpreadsheetId(e.target.value)}
                    placeholder="1x_SheetsID_KelvinGautama..."
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                      isLight
                        ? 'bg-white !text-slate-900 text-slate-900 border-slate-300 focus:border-blue-500'
                        : 'liquid-glass-input'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isLight ? '!text-slate-800 text-slate-800' : 'text-slate-400'}`}>
                    Nama Tab Sheet:
                  </label>
                  <input
                    type="text"
                    value={tempSheetName}
                    onChange={(e) => setTempSheetName(e.target.value)}
                    placeholder="SEPTEMBER"
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isLight
                        ? 'bg-white !text-slate-900 text-slate-900 border-slate-300 focus:border-blue-500'
                        : 'liquid-glass-input'
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={handleSaveSpreadsheetConfig}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition active:scale-95 cursor-pointer"
                  >
                    Terapkan Target
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-4 text-center">
            <p className={`text-[11px] flex items-center justify-center gap-1 ${isLight ? '!text-slate-700 text-slate-700 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span className={isLight ? '!text-slate-700 text-slate-700 font-medium' : ''}>Sesi login akan tersimpan otomatis sampai Anda memilih Logout</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
