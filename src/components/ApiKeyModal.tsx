import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Key,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Cloud,
  Layers,
  X,
  RefreshCw,
  Zap,
  CheckCircle2,
  HelpCircle,
  FileCode2
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import {
  getStoredCustomApiKey,
  setStoredCustomApiKey,
  validateApiKeyOnline,
  checkServerKeyStatus,
  KeyValidationResult,
  ServerKeyStatus,
  getMaskedApiKey
} from '../lib/geminiFinancialService';
import { GlassSettings } from '../types';
import { GlassButton } from './GlassButton';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlassSettings;
  onKeyChanged?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onKeyChanged
}) => {
  const isDark = settings.themeMode !== 'light' && settings.themeMode !== 'beige';

  const [inputKey, setInputKey] = useState<string>('');
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<KeyValidationResult | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerKeyStatus | null>(null);
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'vercel' | 'about'>('manage');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCustomApiKey();
      setInputKey(stored);
      setValidationResult(null);
      setSaveSuccessNotice('');

      checkServerKeyStatus().then((st) => {
        setServerStatus(st);
      });

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStoredKey = getStoredCustomApiKey();

  const handleValidateKey = async () => {
    triggerHaptic('medium');
    setIsValidating(true);
    setValidationResult(null);
    setSaveSuccessNotice('');

    try {
      const res = await validateApiKeyOnline(inputKey);
      setValidationResult(res);
      if (res.valid) {
        triggerHaptic('success');
      } else {
        triggerHaptic('warning');
      }
    } catch {
      setValidationResult({
        valid: false,
        message: 'Gagal melakukan tes koneksi ke Google Gemini.'
      });
      triggerHaptic('warning');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveKey = () => {
    triggerHaptic('medium');
    const trimmed = inputKey.trim();
    setStoredCustomApiKey(trimmed);
    setSaveSuccessNotice(
      trimmed
        ? '✓ API Key berhasil disimpan! AI akan otomatis menggunakan key ini.'
        : '✓ API Key dikosongkan. Sistem beralih ke key server default.'
    );
    onKeyChanged?.();
    setTimeout(() => setSaveSuccessNotice(''), 4000);
  };

  const handleClearKey = () => {
    triggerHaptic('light');
    setInputKey('');
    setStoredCustomApiKey('');
    setValidationResult(null);
    setSaveSuccessNotice('✓ API Key dihapus. Sekarang menggunakan key server default.');
    onKeyChanged?.();
    setTimeout(() => setSaveSuccessNotice(''), 4000);
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        triggerHaptic('selection');
        setInputKey(text.trim());
      }
    } catch {
      // clipboard access denied
    }
  };

  const vercelEnvSnippet = `# Variabel Environment untuk Vercel (Dashboard > Settings > Environment Variables)
GEMINI_API_KEY=${inputKey || 'your_google_gemini_api_key_here'}
VITE_GEMINI_API_KEY=${inputKey || 'your_google_gemini_api_key_here'}`;

  const vercelJsonSnippet = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`;

  const handleCopyEnv = async () => {
    try {
      await navigator.clipboard.writeText(vercelEnvSnippet);
      triggerHaptic('light');
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2500);
    } catch {}
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(vercelJsonSnippet);
      triggerHaptic('light');
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2500);
    } catch {}
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all duration-300 ${
          isDark
            ? 'bg-slate-900/95 text-slate-100 border-white/15 shadow-black/80'
            : 'bg-white/95 text-slate-900 border-slate-200 shadow-slate-900/20'
        }`}
        style={{
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)'
        }}
      >
        {/* Top Rim Highlight */}
        <div
          className="absolute top-0 inset-x-0 h-[2px] pointer-events-none"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(147, 197, 253, 0.7) 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.8) 50%, transparent 100%)'
          }}
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                  Kelola API Key (3-in-1)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-500 border border-blue-400/30 shrink-0">
                  Universal AI
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Import API Key Google Gemini, Server AI Studio & Siap Deploy Vercel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95 shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 pt-3 border-b border-white/10 dark:border-white/10 text-xs font-bold overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('manage');
            }}
            className={`pb-2.5 px-2.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'manage'
                ? 'border-blue-500 text-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Input API Key (BYOK)</span>
            {currentStoredKey && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('vercel');
            }}
            className={`pb-2.5 px-2.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vercel'
                ? 'border-blue-500 text-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Fungsi & Deploy Vercel</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-400 font-bold border border-purple-400/30">
              Ready
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('about');
            }}
            className={`pb-2.5 px-2.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'about'
                ? 'border-blue-500 text-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Arsitektur 3-in-1</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* TAB 1: MANAGE / BYOK */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {/* 3-in-1 Active Status Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  currentStoredKey
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : serverStatus?.hasServerKey
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {currentStoredKey
                          ? 'Prioritas: Custom Key Pengguna'
                          : serverStatus?.hasServerKey
                          ? 'Prioritas: Key Bawaan Server'
                          : 'Status: Belum Terkonfigurasi'}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[11px] opacity-80 truncate">
                      {currentStoredKey
                        ? `Key aktif tersimpan di browser: ${getMaskedApiKey(currentStoredKey)}`
                        : serverStatus?.hasServerKey
                        ? `Menggunakan server env (${serverStatus.serverKeyMasked || 'Terkonfigurasi'})`
                        : 'Masukkan API Key Anda di bawah untuk mengaktifkan AI'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleValidateKey}
                  disabled={isValidating}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                  <span>{isValidating ? 'Menguji...' : 'Tes Koneksi'}</span>
                </button>
              </div>

              {/* Save notification */}
              {saveSuccessNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessNotice}</span>
                </div>
              )}

              {/* Input Form */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    <span>Google Gemini API Key</span>
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold underline underline-offset-2"
                  >
                    <span>Dapatkan Key Gratis di Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Contoh: AIzaSyD..."
                    className={`w-full py-2.5 pl-3.5 pr-24 rounded-2xl border text-xs font-mono outline-none transition-all ${
                      isDark
                        ? 'bg-black/30 border-white/15 text-white focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 transition"
                      title={showKeyText ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteKey}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-300 transition"
                      title="Paste dari Clipboard"
                    >
                      Paste
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Key ini disimpan secara lokal di browser Anda (Local Storage) dan otomatis dikirimkan via header request aman ke endpoint AI analysis. Anda dapat mengganti atau menghapusnya sewaktu-waktu.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleSaveKey}
                  className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan & Aktifkan Key</span>
                </button>

                <button
                  onClick={handleValidateKey}
                  disabled={isValidating || !inputKey.trim()}
                  className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                  <span>Uji Validitas Key</span>
                </button>

                {currentStoredKey && (
                  <button
                    onClick={handleClearKey}
                    className="px-3 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ml-auto cursor-pointer"
                    title="Hapus Key dan Kembali ke Default Server"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus & Reset</span>
                  </button>
                )}
              </div>

              {/* Validation Result Box */}
              {validationResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 animate-fade-in ${
                    validationResult.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : validationResult.isQuota
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {validationResult.valid
                        ? 'Koneksi Berhasil & Key Siap Digunakan!'
                        : validationResult.isQuota
                        ? 'Batas Kuota Tercapai (429 Quota Exceeded)'
                        : 'Validasi Key Gagal'}
                    </span>
                    {validationResult.elapsedMs && (
                      <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20">
                        {validationResult.elapsedMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {validationResult.message}
                  </p>
                  {validationResult.keyMasked && (
                    <div className="font-mono text-[10px] opacity-75">
                      Key Teruji: {validationResult.keyMasked}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VERCEL DEPLOYMENT READY */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-3">
                <Cloud className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-purple-300">
                    Fungsi API Key untuk Vercel (3-in-1 Siap Pakai)
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Aplikasi ini telah dilengkapi adapter serverless <code className="px-1 py-0.5 rounded bg-black/30 text-purple-300 font-mono">api/index.ts</code> dan konfigurasi <code className="px-1 py-0.5 rounded bg-black/30 text-purple-300 font-mono">vercel.json</code>. Saat Anda push / import repo ke Vercel, fitur AI dapat langsung berjalan mulus!
                  </p>
                </div>
              </div>

              {/* Step by step for Vercel */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                  Cara Pasang API Key di Dashboard Vercel:
                </h3>

                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                      1
                    </span>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-slate-200">
                        Buka Dashboard Proyek Vercel Anda
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Masuk ke menu <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                      2
                    </span>
                    <div className="text-xs space-y-1.5 flex-1">
                      <p className="font-semibold text-slate-200">
                        Tambahkan Variabel Lingkungan
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Salin format berikut dan paste ke form Environment Variables Vercel:
                      </p>

                      <div className="relative">
                        <pre className="p-2.5 rounded-xl bg-black/40 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-white/10">
                          {vercelEnvSnippet}
                        </pre>
                        <button
                          onClick={handleCopyEnv}
                          className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
                        >
                          {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEnv ? 'Tersalin!' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                      3
                    </span>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-slate-200">
                        Opsi Alternatif: Direct Browser Mode di Vercel
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Jika Anda men-deploy website di Vercel secara murni Static Hosting, Anda bahkan tidak perlu repot setup backend serverless! Cukup buka website Anda di Vercel, masuk ke menu <strong>Input API Key</strong> di web UI ini, dan masukkan key Anda. Fitur AI langsung aktif 100% dari browser!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vercel JSON Config */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>File vercel.json (Sudah Disediakan Otomatis)</span>
                  </span>
                  <button
                    onClick={handleCopyJson}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedJson ? 'Tersalin' : 'Salin JSON'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-xl bg-black/40 text-[10px] font-mono text-slate-300 border border-white/10 overflow-x-auto">
                  {vercelJsonSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: 3-IN-1 ARCHITECTURE */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="text-xs space-y-1 text-slate-300 leading-relaxed">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Sistem AI 3-in-1: Fleksibel, Aman & Portabel</span>
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Sistem AI Finansial Kelvin kini mendukung 3 mode sumber API Key secara otomatis tanpa saling bertabrakan:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pillar 1 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div className="font-bold text-xs text-white">
                    AI Studio Server
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Default zero-config di lingkungan Google AI Studio Build & Cloud Run menggunakan <code className="text-blue-300">process.env.GEMINI_API_KEY</code>.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Aktif Otomatis</span>
                  </span>
                </div>

                {/* Pillar 2 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div className="font-bold text-xs text-white">
                    Web UI Import (BYOK)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pengguna dapat menginput / mengimpor API Key pribadi langsung di Web UI, disimpan di browser & diprioritaskan saat analisis.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Siap Digunakan</span>
                  </span>
                </div>

                {/* Pillar 3 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div className="font-bold text-xs text-white">
                    Vercel & Multi-Cloud
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Mendukung Vercel Serverless Function (<code className="text-emerald-300">api/index.ts</code>), Vercel Envs, serta Direct Browser Fallback jika di-host statis.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Kompatibel 100%</span>
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5 text-blue-200">
                <div className="font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Logika Prioritas Otomatis</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Jika Anda memasukkan <strong>Custom Key</strong> di Web UI, sistem akan memprioritaskan key tersebut. Jika custom key dikosongkan atau dihapus, sistem otomatis kembali menggunakan <strong>Key Server</strong> bawaan AI Studio atau Vercel Envs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Google AI Studio • Universal 3-in-1 Engine</span>
          </div>

          <GlassButton size="sm" variant="primary" onClick={onClose}>
            Selesai & Tutup
          </GlassButton>
        </div>
      </div>
    </div>,
    document.body
  );
};
