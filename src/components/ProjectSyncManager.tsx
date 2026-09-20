import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { GlassSettings, PersistedUser } from '../types';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Copy,
  Plus,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  extractSpreadsheetId,
  getSpreadsheetDetails,
  createNewProjectSpreadsheet,
  listUserSpreadsheets
} from '../lib/sheetsApi';
import { getAccessToken } from '../lib/firebase';

interface ProjectSyncManagerProps {
  user: User | PersistedUser | null;
  currentSpreadsheetId: string;
  currentSheetName: string;
  onSaveProjectConfig: (spreadsheetId: string, sheetName: string, detectedSheets?: string[]) => void;
  onLogin: () => Promise<void>;
  onSyncNow: (targetId?: string, targetSheet?: string) => Promise<void>;
  isSyncing: boolean;
  settings?: GlassSettings;
  onClose?: () => void;
}

export const ProjectSyncManager: React.FC<ProjectSyncManagerProps> = ({
  user,
  currentSpreadsheetId,
  currentSheetName,
  onSaveProjectConfig,
  onLogin,
  onSyncNow,
  isSyncing,
  settings,
  onClose
}) => {
  const isLight = settings?.themeMode === 'light';
  const isBeige = settings?.themeMode === 'beige';
  const isBright = isLight || isBeige;

  const [activeTab, setActiveTab] = useState<'picker' | 'manual' | 'create' | 'guide'>('picker');
  const [inputUrlOrId, setInputUrlOrId] = useState(currentSpreadsheetId);
  const [inputSheetName, setInputSheetName] = useState(currentSheetName);

  // Drive Spreadsheet list
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; modifiedTime?: string; webViewLink?: string }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Create new project state
  const [newFileTitle, setNewFileTitle] = useState('My Liquid Financial 2026');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  // Validation/Testing state
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    title?: string;
    sheets?: string[];
    error?: string;
  } | null>(null);

  // Copy helper feedback
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Load drive files when authenticated and picker tab active
  const loadDriveFiles = async () => {
    if (!user) return;
    try {
      setIsLoadingFiles(true);
      setDriveError(null);
      const token = await getAccessToken();
      if (!token) {
        setDriveError('Token akses Google tidak tersedia. Silakan masuk kembali.');
        return;
      }
      const files = await listUserSpreadsheets(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error fetching drive spreadsheets:', err);
      setDriveError(err?.message || 'Gagal memuat daftar file spreadsheet Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'picker') {
      loadDriveFiles();
    }
  }, [user, activeTab]);

  // Test access to entered spreadsheet
  const handleTestConnection = async (targetId: string) => {
    const cleanId = extractSpreadsheetId(targetId);
    if (!cleanId) {
      setValidationResult({ success: false, error: 'Masukkan ID atau URL Google Spreadsheet yang valid.' });
      return;
    }
    try {
      setValidating(true);
      setValidationResult(null);
      let token = await getAccessToken();
      if (!token) {
        // Attempt to request / refresh permission
        try {
          await onLogin();
          token = await getAccessToken();
        } catch (e) {}
      }
      if (!token) {
        setValidationResult({
          success: false,
          error: user
            ? `Izin akses Google Sheets perlu diperbarui untuk akun ${user.email}. Silakan klik tombol "Sign in with Google" di atas terlebih dahulu.`
            : 'Belum login ke Google Akun. Silakan klik "Sign in with Google" terlebih dahulu.'
        });
        return;
      }
      const details = await getSpreadsheetDetails(cleanId, token);
      const sheetNames = details.sheets?.map((s: any) => s.properties?.title) || [];
      setValidationResult({
        success: true,
        title: details.properties?.title || 'Spreadsheet Valid',
        sheets: sheetNames
      });
      if (sheetNames.length > 0 && !sheetNames.includes(inputSheetName)) {
        setInputSheetName(sheetNames[0]);
      }
    } catch (err: any) {
      const errMsg = err?.message || '';
      let friendlyError = errMsg;
      if (
        errMsg.includes('403') ||
        errMsg.toLowerCase().includes('permission') ||
        errMsg.toLowerCase().includes('not authorized')
      ) {
        friendlyError = `Akses Ditolak (403): Akun Google yang Anda gunakan (${user?.email || 'saat ini'}) tidak memiliki izin akses ke Google Sheet ini. Jika file ini milik Akun Google lain (misal Akun B), buka file tersebut di akun pemiliknya, klik tombol "Bagikan" (Share) di pojok kanan atas, lalu tambahkan email ${user?.email || 'Anda'} sebagai Editor (atau pilih "Siapa saja yang memiliki link: Editor").`;
      } else if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) {
        friendlyError = `File Tidak Ditemukan (404): ID/Link spreadsheet salah atau file belum dibagikan ke akun ${user?.email || 'Anda'}.`;
      }
      setValidationResult({
        success: false,
        error: friendlyError
      });
    } finally {
      setValidating(false);
    }
  };

  // Create new project with matching template structure
  const handleCreateNewProject = async () => {
    try {
      setIsCreatingNew(true);
      setValidationResult(null);
      const token = await getAccessToken();
      if (!token) {
        alert('Silakan login ke Google terlebih dahulu.');
        return;
      }
      const newSheet = await createNewProjectSpreadsheet(newFileTitle, token);
      setInputUrlOrId(newSheet.spreadsheetId);
      setInputSheetName('Sheet1');
      setCreatedUrl(newSheet.spreadsheetUrl);
      onSaveProjectConfig(newSheet.spreadsheetId, 'Sheet1');
      setValidationResult({
        success: true,
        title: newFileTitle,
        sheets: ['Sheet1']
      });
      // Refresh list
      loadDriveFiles();
    } catch (err: any) {
      console.error('Create error:', err);
      alert(`Gagal membuat project baru: ${err?.message}`);
    } finally {
      setIsCreatingNew(false);
    }
  };

  // Save manual/picker selection
  const handleSaveAndSync = async (targetId?: string, targetSheet?: string) => {
    const rawTarget = targetId || inputUrlOrId;
    const idToSave = extractSpreadsheetId(rawTarget);

    if (!idToSave) {
      alert('Masukkan link atau ID Google Spreadsheet terlebih dahulu.');
      return;
    }

    let detectedSheets =
      validationResult?.sheets && validationResult.sheets.length > 0
        ? validationResult.sheets
        : undefined;

    let sheetToSave = targetSheet || inputSheetName || 'Sheet1';

    // If sheets not detected yet or targetId was clicked directly from Drive list, fetch real titles now
    try {
      const token = await getAccessToken();
      if (token) {
        const details = await getSpreadsheetDetails(idToSave, token);
        const fetchedSheets = details.sheets?.map((s: any) => s.properties?.title) || [];
        if (fetchedSheets.length > 0) {
          detectedSheets = fetchedSheets;
          if (!targetSheet || !fetchedSheets.includes(targetSheet)) {
            sheetToSave = fetchedSheets[0];
          }
        }
      }
    } catch (e) {
      console.warn('Could not auto-fetch sheet tabs on selection:', e);
    }

    onSaveProjectConfig(idToSave, sheetToSave, detectedSheets);
    await onSyncNow(idToSave, sheetToSave);
    if (onClose) onClose();
  };

  const copyHeaderSample = () => {
    const headerText = 'Bulan\tKategori\tAkun\tTipe\tJumlah\tCatatan\nSeptember\tSalary\tBank BCA\tIncome\tRp 5.916.058\tGaji Pokok';
    navigator.clipboard.writeText(headerText);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* User Status Bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-colors ${
          isLight
            ? 'bg-slate-50/90 border-slate-200/90 shadow-sm'
            : isBeige
            ? 'bg-[#f4efe4] border-[#dfd5c6] shadow-sm'
            : 'bg-white/[0.04] border-white/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              isBright
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4
                className={`text-xs font-bold tracking-tight ${
                  isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
                }`}
              >
                Akun Google Aktif
              </h4>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  user
                    ? isBright
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isBright
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {user ? 'Terautentikasi' : 'Belum Login'}
              </span>
            </div>
            <p
              className={`text-[11px] mt-0.5 ${
                isLight ? 'text-slate-600' : isBeige ? 'text-[#554a3d]' : 'text-slate-300'
              }`}
            >
              {user ? (
                <span>
                  Login sebagai:{' '}
                  <strong className={isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'}>
                    {user.email}
                  </strong>
                </span>
              ) : (
                'Masuk dengan akun Google yang memiliki file spreadsheet target'
              )}
            </p>
          </div>
        </div>

        {!user ? (
          <button
            onClick={() => onLogin()}
            disabled={isSyncing}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-xs shadow-md active:scale-95 transition disabled:opacity-60 cursor-pointer ${
              isBright
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-900'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            )}
            <span>{isSyncing ? 'Membuka Login...' : 'Sign in with Google'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isBright
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Siap Sinkron</span>
            </div>
            <button
              onClick={() => onLogin()}
              disabled={isSyncing}
              className={`text-[11px] font-medium underline px-2 py-1 transition disabled:opacity-50 cursor-pointer ${
                isLight
                  ? 'text-blue-600 hover:text-blue-800'
                  : isBeige
                  ? 'text-amber-800 hover:text-amber-950'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Pilih akun Google lain atau perbarui sesi izin"
            >
              Ganti Akun
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tabs: Pilih File, Masukkan Link, Buat Baru, Panduan Setting */}
      <div
        className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto no-scrollbar ${
          isLight
            ? 'bg-slate-100/90 border-slate-200/90'
            : isBeige
            ? 'bg-[#ece5d7] border-[#dfd5c6]'
            : 'bg-black/30 border-white/10'
        }`}
      >
        <button
          onClick={() => setActiveTab('picker')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'picker'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : isBeige
              ? 'text-[#554a3d] hover:text-[#29231c] hover:bg-[#dfd5c6]/60'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>1. Pilih dari Google Drive</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : isBeige
              ? 'text-[#554a3d] hover:text-[#29231c] hover:bg-[#dfd5c6]/60'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2. Paste Link / ID URL</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : isBeige
              ? 'text-[#554a3d] hover:text-[#29231c] hover:bg-[#dfd5c6]/60'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>3. Buat Sheet Otomatis</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'guide'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : isBeige
              ? 'text-[#554a3d] hover:text-[#29231c] hover:bg-[#dfd5c6]/60'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HelpCircle className={`w-3.5 h-3.5 ${isBright ? 'text-amber-600' : 'text-amber-300'}`} />
          <span>Panduan Template</span>
        </button>
      </div>

      {/* TAB 1: PICKER FROM GOOGLE DRIVE */}
      {activeTab === 'picker' && (
        <div
          className={`p-4 rounded-2xl border space-y-3 ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-sm'
              : isBeige
              ? 'bg-[#fcfaf6] border-[#dfd5c6] shadow-sm'
              : 'bg-white/[0.02] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h5
                className={`text-xs font-bold ${
                  isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
                }`}
              >
                Daftar Spreadsheet di Google Drive Anda
              </h5>
              <p
                className={`text-[11px] mt-0.5 ${
                  isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'
                }`}
              >
                Pilih project sheet yang ingin disinkronkan ke aplikasi (1-klik langsung tersambung)
              </p>
            </div>
            {user && (
              <button
                onClick={loadDriveFiles}
                disabled={isLoadingFiles}
                className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : isBeige
                    ? 'bg-[#ede5d7] hover:bg-[#dfd5c6] text-[#29231c] border border-[#dfd5c6]'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
                }`}
                title="Muat ulang daftar file"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-semibold">Refresh</span>
              </button>
            )}
          </div>

          {!user ? (
            <div
              className={`text-center py-6 px-4 rounded-xl border border-dashed ${
                isLight
                  ? 'bg-slate-50/50 border-slate-300'
                  : isBeige
                  ? 'bg-[#f5f0e4]/50 border-[#dfd5c6]'
                  : 'bg-white/[0.02] border-white/10'
              }`}
            >
              <FolderOpen
                className={`w-8 h-8 mx-auto mb-2 ${
                  isBright ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <p
                className={`text-xs font-semibold mb-1 ${
                  isLight ? 'text-slate-800' : isBeige ? 'text-[#29231c]' : 'text-slate-300'
                }`}
              >
                Silakan login dengan akun Google terlebih dahulu
              </p>
              <p
                className={`text-[11px] max-w-sm mx-auto mb-3 ${
                  isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'
                }`}
              >
                Aplikasi akan mendeteksi seluruh file Google Spreadsheet di Drive akun tersebut agar Anda dapat langsung memilihnya tanpa mengetik ID.
              </p>
              <button
                onClick={() => onLogin()}
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                Sign in with Google
              </button>
            </div>
          ) : isLoadingFiles ? (
            <div
              className={`flex items-center justify-center gap-2 py-8 text-xs ${
                isBright ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>Memindai Google Drive Anda...</span>
            </div>
          ) : driveError ? (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                isBright
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold">Pemberitahuan Akses Drive:</p>
                <p className="text-[11px] opacity-90 mt-0.5">{driveError}</p>
                <p className={`text-[10px] mt-1 ${isBright ? 'text-slate-600' : 'text-slate-400'}`}>
                  Anda tetap bisa menggunakan tab <strong>"2. Paste Link / ID URL"</strong> untuk menautkan spreadsheet secara langsung.
                </p>
              </div>
            </div>
          ) : driveFiles.length === 0 ? (
            <div
              className={`text-center py-6 text-xs ${
                isLight ? 'text-slate-600' : isBeige ? 'text-[#554a3d]' : 'text-slate-400'
              }`}
            >
              <p>Tidak ada Google Spreadsheet yang ditemukan di akun Google ini.</p>
              <button
                onClick={() => setActiveTab('create')}
                className={`mt-2 inline-flex items-center gap-1 font-semibold hover:underline cursor-pointer ${
                  isLight ? 'text-blue-600' : isBeige ? 'text-amber-800' : 'text-sky-400'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Buat spreadsheet template otomatis sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar pr-1">
              {driveFiles.map((file) => {
                const isCurrent = extractSpreadsheetId(currentSpreadsheetId) === file.id;
                return (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      isCurrent
                        ? isBright
                          ? 'bg-blue-50/90 border-blue-300 shadow-sm'
                          : 'bg-blue-600/20 border-blue-500/50'
                        : isLight
                        ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/90'
                        : isBeige
                        ? 'bg-[#f5f0e4] border-[#dfd5c6] hover:bg-[#ece5d7]'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                          isBright
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <h6
                          className={`text-xs font-semibold truncate ${
                            isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
                          }`}
                        >
                          {file.name}
                        </h6>
                        <span
                          className={`text-[10px] font-mono ${
                            isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'
                          }`}
                        >
                          ID: {file.id.slice(0, 14)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className={`p-1 rounded-lg transition ${
                            isLight
                              ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                              : isBeige
                              ? 'hover:bg-[#dfd5c6] text-[#6e6355] hover:text-[#29231c]'
                              : 'hover:bg-white/10 text-slate-400 hover:text-white'
                          }`}
                          title="Buka di tab baru"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => handleSaveAndSync(file.id, 'Sheet1')}
                        disabled={isSyncing}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                          isCurrent
                            ? isBright
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                        }`}
                      >
                        {isCurrent ? 'Aktif Terhubung' : 'Pilih & Hubungkan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL URL / SPREADSHEET ID INPUT */}
      {activeTab === 'manual' && (
        <div
          className={`p-4 rounded-2xl border space-y-3 ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-sm'
              : isBeige
              ? 'bg-[#fcfaf6] border-[#dfd5c6] shadow-sm'
              : 'bg-white/[0.02] border-white/10'
          }`}
        >
          {/* Multi-Account Tip Notice */}
          <div
            className={`p-3 rounded-xl border text-[11px] ${
              isLight
                ? 'bg-blue-50/90 border-blue-200 text-blue-900'
                : isBeige
                ? 'bg-amber-50/90 border-amber-200 text-[#29231c]'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-200'
            }`}
          >
            <p
              className={`font-semibold flex items-center gap-1.5 mb-1 ${
                isLight ? 'text-blue-950' : isBeige ? 'text-[#29231c]' : 'text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Ingin Menghubungkan Google Sheet dari Akun Google Lain?
            </p>
            <p className={isLight ? 'text-slate-700' : isBeige ? 'text-[#4f4437]' : 'text-slate-300'}>
              Jika file Google Sheet Anda ada di <strong>Akun Google B</strong> sedangkan Anda login dengan <strong>{user?.email || 'Akun Google A'}</strong>, Anda cukup membuka spreadsheet tersebut di Akun B, klik tombol <strong>Bagikan (Share)</strong> di kanan atas, lalu tambahkan email <strong>{user?.email || 'akun aktif Anda'}</strong> sebagai <strong>Editor</strong>.
            </p>
          </div>

          <div>
            <label
              className={`text-xs font-bold block mb-1 ${
                isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
              }`}
            >
              Link URL atau ID Google Spreadsheet:
            </label>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/1abcXYZ123.../edit atau cukup salin ID-nya"
              value={inputUrlOrId}
              onChange={(e) => {
                setInputUrlOrId(e.target.value);
                setValidationResult(null);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono outline-none transition ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  : isBeige
                  ? 'bg-white border border-[#dfd5c6] text-[#29231c] placeholder:text-stone-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-100'
                  : 'bg-black/40 border border-white/20 text-white focus:border-blue-400'
              }`}
            />
            <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'}`}>
              Bisa langsung copy-paste alamat URL Google Sheet dari address bar browser Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className={`text-xs font-bold block mb-1 ${
                  isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
                }`}
              >
                Nama Tab Sheet:
              </label>
              <input
                type="text"
                placeholder="Sheet1"
                value={inputSheetName}
                onChange={(e) => setInputSheetName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    : isBeige
                    ? 'bg-white border border-[#dfd5c6] text-[#29231c] placeholder:text-stone-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-100'
                    : 'bg-black/40 border border-white/20 text-white focus:border-blue-400'
                }`}
              />
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'}`}>
                Default: <code>Sheet1</code>
              </p>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => handleTestConnection(inputUrlOrId)}
                disabled={validating || !inputUrlOrId}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                    : isBeige
                    ? 'bg-[#ede5d7] hover:bg-[#dfd5c6] border border-[#dfd5c6] text-[#29231c]'
                    : 'bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>{validating ? 'Menguji...' : 'Uji Izin Akses'}</span>
              </button>
            </div>
          </div>

          {/* Validation Result Box */}
          {validationResult && (
            <div
              className={`p-3 rounded-xl text-xs border ${
                validationResult.success
                  ? isBright
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : isBright
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {validationResult.success ? (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Koneksi Berhasil! Judul: "{validationResult.title}"
                  </p>
                  <p className={`text-[11px] ${isBright ? 'text-slate-600' : 'text-slate-300'}`}>
                    Tab yang terdeteksi: {validationResult.sheets?.join(', ')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Gagal Mengakses:
                  </p>
                  <p className="text-[11px]">{validationResult.error}</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => handleSaveAndSync()}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Sinkronkan Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: CREATE NEW TEMPLATE SPREADSHEET */}
      {activeTab === 'create' && (
        <div
          className={`p-4 rounded-2xl border space-y-3 ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-sm'
              : isBeige
              ? 'bg-[#fcfaf6] border-[#dfd5c6] shadow-sm'
              : 'bg-white/[0.02] border-white/10'
          }`}
        >
          <div>
            <h5
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              Buat File Google Spreadsheet Otomatis
            </h5>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'}`}>
              Aplikasi akan langsung membuatkan file baru di akun Google Drive Anda dengan struktur kolom (Bulan, Kategori, Akun, Tipe, Jumlah, Catatan) yang sudah siap 100%.
            </p>
          </div>

          <div>
            <label
              className={`text-xs font-bold block mb-1 ${
                isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
              }`}
            >
              Nama Dokumen Baru:
            </label>
            <input
              type="text"
              value={newFileTitle}
              onChange={(e) => setNewFileTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium outline-none transition ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  : isBeige
                  ? 'bg-white border border-[#dfd5c6] text-[#29231c] focus:border-amber-600 focus:ring-2 focus:ring-amber-100'
                  : 'bg-black/40 border border-white/20 text-white focus:border-blue-400'
              }`}
            />
          </div>

          {createdUrl && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                isBright
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                File berhasil dibuat & otomatis ditautkan!
              </span>
              <a
                href={createdUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1 text-[11px] font-bold hover:underline ${
                  isBright ? 'text-blue-600' : 'text-sky-400'
                }`}
              >
                Buka di Google Sheets <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleCreateNewProject}
              disabled={isCreatingNew || !user}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingNew ? 'Sedang Membuat File...' : 'Buat & Hubungkan Otomatis'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: PANDUAN SETTING FORMAT TEMPLATE */}
      {activeTab === 'guide' && (
        <div
          className={`p-4 rounded-2xl border space-y-4 text-xs ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-sm'
              : isBeige
              ? 'bg-[#fcfaf6] border-[#dfd5c6] shadow-sm'
              : 'bg-white/[0.02] border-white/10'
          }`}
        >
          <div>
            <h5
              className={`font-bold flex items-center gap-1.5 text-sm ${
                isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Panduan Menghubungkan Google Sheet (Akun / File Berbeda)
            </h5>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : isBeige ? 'text-[#554a3d]' : 'text-slate-300'}`}>
              Anda bebas menggunakan file Google Sheet dari akun Google mana pun tanpa perlu mengubah baris kode aplikasi sama sekali.
            </p>
          </div>

          {/* Step by step */}
          <div className="space-y-2.5">
            <div
              className={`p-3 rounded-xl border flex items-start gap-3 ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : isBeige
                  ? 'bg-[#f5f0e4] border-[#dfd5c6]'
                  : 'bg-black/30 border-white/10'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${
                  isBright ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                1
              </span>
              <div>
                <strong className={isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'}>
                  Login dengan Google Akun Anda
                </strong>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'}`}>
                  Klik tombol <em>Sign in with Google</em>. Jika Anda ingin mengganti akun, cukup klik <strong>Keluar</strong> lalu login ulang dengan akun Google lainnya.
                </p>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-start gap-3 ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : isBeige
                  ? 'bg-[#f5f0e4] border-[#dfd5c6]'
                  : 'bg-black/30 border-white/10'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${
                  isBright ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                2
              </span>
              <div>
                <strong className={isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'}>
                  Format Judul Kolom Baris Pertama (Row 1)
                </strong>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'}`}>
                  Pastikan sheet target memiliki baris header tepat di <code>A1:F1</code> dengan nama kolom berikut:
                </p>
                <div
                  className={`mt-2 p-2 rounded-lg font-mono text-[11px] flex items-center justify-between overflow-x-auto ${
                    isBright
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                      : 'bg-black/60 text-emerald-300'
                  }`}
                >
                  <span>A: Bulan | B: Kategori | C: Akun | D: Tipe | E: Jumlah | F: Catatan</span>
                  <button
                    onClick={copyHeaderSample}
                    className="ml-2 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedTemplate ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTemplate ? 'Tersalin' : 'Copy Header'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-start gap-3 ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : isBeige
                  ? 'bg-[#f5f0e4] border-[#dfd5c6]'
                  : 'bg-black/30 border-white/10'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${
                  isBright ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                3
              </span>
              <div>
                <strong className={isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'}>
                  Pilih File atau Salin Link Spreadsheet
                </strong>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'}`}>
                  Pilih file secara langsung dari tab <strong>"1. Pilih dari Google Drive"</strong> ATAU salin link dari address bar browser lalu paste di tab <strong>"2. Paste Link / ID URL"</strong>.
                </p>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-start gap-3 ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : isBeige
                  ? 'bg-[#f5f0e4] border-[#dfd5c6]'
                  : 'bg-black/30 border-white/10'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${
                  isBright ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                4
              </span>
              <div>
                <strong className={isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'}>
                  Sinkronisasi 2-Arah Berjalan Otomatis
                </strong>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'}`}>
                  Setiap kali Anda menambah transaksi di tab <em>Input Cashflow</em>, data akan otomatis terkirim ke Google Sheets. Tekan tombol <em>Tarik</em> kapan saja untuk mengambil update terbaru.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
