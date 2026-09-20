# Dokumentasi Teknis Integrasi API Google Sheets & Sistem Pemetaan (API Mapping)

Dokumen ini disusun sebagai panduan teknis dan arsitektur komprehensif untuk project **Financial Tracker & Money Management Dashboard**. Dokumen ini dirancang untuk memfasilitasi pemeliharaan, pengembangan bersama (*double development* menggunakan 2 akun Google AI Studio), serta roadmap migrasi lintas platform (Web, Android, dan iOS).

---

## 1. Arsitektur Repositori & Tech Stack

### 1.1 Struktur Direktori Utama
```
money-management/
├── .env.example                     # Definisi variabel lingkungan (GEMINI_API_KEY, APP_URL)
├── firebase-applet-config.json      # Konfigurasi autentikasi Firebase & OAuth Client ID
├── metadata.json                    # Metadata aplikasi AI Studio
├── package.json                     # Konfigurasi dependensi Node.js & Vite
├── vite.config.ts                   # Konfigurasi Vite & Tailwind CSS v4
├── tsconfig.json                    # Konfigurasi compiler TypeScript
├── index.html                       # Entry point HTML aplikasi
└── src/
    ├── main.tsx                     # Entry point React 19 (StrictMode & Mount root)
    ├── App.tsx                      # Root component, state manager utama, routing view
    ├── index.css                    # Tailwind CSS v4 entry point & utility styles
    ├── types.ts                     # Definisi tipe data TypeScript global
    ├── data/
    │   └── initialData.ts           # Nilai awal (mock fallback & preset kategori/akun)
    ├── lib/
    │   ├── firebase.ts              # Firebase Auth singleton, Google OAuth & token cache
    │   ├── sheetsApi.ts             # REST Client Google Sheets API v4 & Google Drive API v3
    │   ├── sheetStyles.ts           # Utility format bulan (Title Case) & styling
    │   ├── haptics.ts               # Haptic feedback simulation (Vibration API)
    │   └── useSwipeScroll.ts        # Custom hook gesture swipe untuk tab/tabel
    └── components/
        ├── ExecutiveSummary.tsx     # KPI Net Worth, Cashflow overview, Charts Recharts
        ├── CashflowInputPage.tsx    # Formulir input transaksi pemasukan & pengeluaran
        ├── BudgetingTracker.tsx     # Alokasi budgeting amplop & sinking fund
        ├── InvestmentPortfolio.tsx  # Tracking valuasi aset investasi & Dana Darurat
        ├── AccountsPage.tsx         # Manajemen saldo rekening/dompet & transfer saldo
        ├── TransactionManager.tsx   # Rekap tabel mutasi (Jurnal), filter, edit & delete
        ├── ProjectSyncManager.tsx   # Modal & panel manajemen spreadsheet Google Sheets
        ├── ProjectSyncManagerModal.tsx
        ├── GoogleSheetMonthTabBar.tsx # Bar seleksi tab bulan Google Sheets
        ├── GoogleSheetsSyncBar.tsx  # Banner status koneksi sinkronisasi
        ├── SyncStatusHeaderBadge.tsx# Badge realtime status sync di header
        ├── LiquidHeader.tsx         # Top bar navigasi & quick actions
        ├── LiquidSidebar.tsx        # Sidebar navigasi desktop & mobile drawer
        ├── LoginPage.tsx            # Halaman login Google & bypass Dev Mode (0000)
        ├── SmartAnalysisModal.tsx   # Modal analitik cerdas kesehatan keuangan
        ├── AutomatedReportModal.tsx # Generator laporan otomatis bulanan
        ├── RetirementInvestmentCalculator.tsx # Kalkulator investasi & target pensiun
        ├── ConfirmationModal.tsx    # Modal dialog konfirmasi operasi destruktif
        ├── GlassSettingsModal.tsx   # Pengaturan efek Glassmorphism & tema
        ├── GlassMenuPopup.tsx       # Menu pop-up aksi cepat
        ├── GlassButton.tsx          # Komponen tombol glass terstandarisasi
        ├── GlassContainer.tsx       # Container kartu kaca (backdrop-filter blur)
        └── LiquidOtpInput.tsx       # Komponen input OTP numerik
```

---

## 2. Alur Autentikasi & Otorisasi Google Workspace

### 2.1 Mekanisme Login & Akses Token
Autentikasi menggunakan **Firebase Authentication** dengan **GoogleAuthProvider**:
- **Scopes yang digunakan**:
  1. `https://www.googleapis.com/auth/spreadsheets` (Akses baca dan tulis Google Sheets)
  2. `https://www.googleapis.com/auth/drive.file` (Akses baca daftar file spreadsheet pengguna di Google Drive)
- **Token Lifecycle**:
  - `GoogleAuthProvider.credentialFromResult(result)` mengekstrak `accessToken`.
  - Token disimpan di *in-memory cache* (`cachedAccessToken`) dan di-backup ke `localStorage` (`kelvin_financial_google_access_token`) bersama timestamp kedaluwarsa (`kelvin_financial_google_token_expiry`, 3600 detik).
  - Terdapat mekanisme pembersihan otomatis (`clearAllUserSessionAndCaches`) saat user logout untuk menjamin kerahasiaan data finansial.

---

## 3. Skema Google Sheets sebagai Database Operasional

Setiap Spreadsheet diasumsikan memiliki beberapa **Sheet Tabs** berdasarkan nama bulan (misal: `SEPTEMBER`, `OKTOBER`, `AGUSTUS`).

### 3.1 Mapping Kolom Transaksi (Range `A:F`)

| Kolom | Header Cell | Tipe Data | Format / Contoh | Deskripsi |
|---|---|---|---|---|
| **A** | `Bulan` | String (Title Case) | `"September"` | Nama bulan transaksi, otomatis disesuaikan dengan tab aktif |
| **B** | `Kategori` | String | `"Makan & Minum"`, `"Gaji"` | Pos kategori pengeluaran atau pemasukan |
| **C** | `Akun` | String | `"Bank BCA"`, `"Seabank"` | Rekening/dompet yang digunakan |
| **D** | `Tipe` | Enum String | `"Expense"`, `"Income"`, `"Saldo Bulan Lalu"`, `"Transfer Keluar"`, `"Transfer Masuk"` | Tipe mutasi keuangan |
| **E** | `Jumlah` | Integer/Number | `150000` | Nilai nominal murni (angka bulat tanpa prefiks `Rp` atau titik pemisah) |
| **F** | `Catatan` | String | `"Makan siang di resto"` | Deskripsi atau memo transaksi |

### 3.2 Mapping Kolom Summary & Tabel Rekapitulasi (Range `H:N`)

Selain daftar transaksi, template sheet memiliki sel formula precalculated di sebelah kanan (kolom H hingga N):

| Label Indikator | Lokasi Pencarian | Target Nilai | Parsing Function |
|---|---|---|---|
| **Total Aset / Net Worth** | Sel dengan teks `total aset`, `total asset`, `kekayaan bersih`, `grand total` | Sel adjacent (`c+1`, `c+2`) atau 1 baris di bawahnya | `parseCurrencyToNumber()` |
| **Cash Standby + Dana Darurat** | Sel dengan teks `total cash standby`, `cash standby`, `kas cair` | Sel adjacent | `parseCurrencyToNumber()` |
| **Total Investment** | Sel dengan teks `total investment`, `total investasi`, `portofolio investasi` | Sel adjacent | `parseCurrencyToNumber()` |
| **Daftar Saldo Rekening** | Dimulai setelah header `Nama Akun` / `Rekening` / `Dompet & Rekening` | Kolom Akun & kolom saldo adjacent | `summary.accountBalances[accName]` |
| **Dana Darurat (Blu BCA)** | Sel dengan teks `dana darurat (blu bca)` | Sel adjacent | `summary.emergencyFund.current` |
| **Target Dana Darurat** | Sel dengan teks `target dana darurat` | Sel adjacent | `summary.emergencyFund.target` |

---

## 4. Pemetaan API Google Sheets (Endpoint & Metrik Operasi)

Semua pemanggilan API dilakukan via HTTP REST langsung menggunakan Google REST API v4:

### 4.1 Mendapatkan Metadata Spreadsheet (Sheet Tabs)
- **Endpoint**: `GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}?includeGridData=false`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Fungsi**: `getSpreadsheetDetails()`, `getSpreadsheetSheetTitles()`
- **Output**: Array daftar nama sheet tab (`['JANUARI', 'FEBRUARI', ..., 'SEPTEMBER']`).

### 4.2 Membaca Data Transaksi & Summary (Read Sync)
- **Endpoint**: `GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{encodedRange}`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Fungsi**: `fetchSheetValues(spreadsheetId, range, accessToken)`
- **Range Utama**:
  - Transaksi: `'SEPTEMBER'!A1:F200`
  - Rekap Side Grid: `'SEPTEMBER'!H1:N50`
- **Parser**: `parseSheetGridData(rows, sheetName)`
  - Membersihkan baris header.
  - Mengabaikan baris pembatas hitam (*blank separator rows*).
  - Mengonversi format uang teks Rupiah (misal `"Rp 1.125.940"`) ke angka integer murni `1125940`.

### 4.3 Menambah Baris Transaksi (Append / Smart Row Detection)
- **Fungsi**: `appendRowToSheet(spreadsheetId, sheetName, tx, accessToken)`
- **Strategi Deteksi Baris (Anti-Overwriting)**:
  1. Pertama, aplikasi melakukan pemindaian terhadap `A1:F200` untuk menemukan baris terakhir yang memiliki data riil (`lastPopulatedRow`).
  2. Mencegah penulisan yang melompati atau menimpa baris divider kosong.
  3. Menulis baris baru pada baris target `targetRow = lastPopulatedRow + 1` menggunakan endpoint `PUT values/{sheetName}!A{targetRow}:F{targetRow}?valueInputOption=USER_ENTERED`.
  4. Jika deteksi baris gagal, secara otomatis fallback ke Google Sheets append endpoint:
     `POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`

### 4.4 Mengubah Baris Transaksi (Update Row)
- **Endpoint**: `PUT https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}?valueInputOption=USER_ENTERED`
- **Headers**: `Authorization: Bearer {accessToken}`, `Content-Type: application/json`
- **Range**: `'{sheetName}'!A{rowIndex}:F{rowIndex}`
- **Payload**:
  ```json
  {
    "values": [
      ["September", "Makan & Minum", "Bank BCA", "Expense", 85000, "Dinner"]
    ]
  }
  ```
- **Fungsi**: `updateRowInSheet(spreadsheetId, sheetName, rowIndex, tx, accessToken)`

### 4.5 Menghapus Baris Transaksi (Clear Row)
- **Endpoint**: `POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:clear`
- **Headers**: `Authorization: Bearer {accessToken}`, `Content-Type: application/json`
- **Range**: `'{sheetName}'!A{rowIndex}:F{rowIndex}`
- **Fungsi**: `clearRowInSheet(spreadsheetId, sheetName, rowIndex, accessToken)`

### 4.6 Pembaruan Nilai Sel Spesifik (Update Cell)
- **Endpoint**: `PUT https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}?valueInputOption=USER_ENTERED`
- **Range**: `'{sheetName}'!{cellA1}` (misal `'SEPTEMBER'!C15`)
- **Fungsi**: `updateCellInSheet(spreadsheetId, sheetName, cellA1, value, accessToken)`

### 4.7 Sinkronisasi Ubah Nama Akun (Rename Account Sync)
- **Fungsi**: `syncRenameAccountInSheet(spreadsheetId, sheetName, oldName, newName, accessToken)`
- **Alur**:
  1. Memindai range transaksi `A1:F200` pada kolom C (`Akun`). Jika bernilai `oldName`, perbarui sel menjadi `newName`.
  2. Memindai range rekapitulasi `H1:N50`. Jika ditemukan sel dengan nilai `oldName`, perbarui sel tersebut ke `newName`.

### 4.8 Membuat Spreadsheet Proyek Baru (Create Template)
- **Endpoint**: `POST https://sheets.googleapis.com/v4/spreadsheets`
- **Fungsi**: `createNewProjectSpreadsheet(title, accessToken)`
- **Fitur**: Otomatis membuat sheet dengan baris header terbekukan (*frozen row*): `Bulan`, `Kategori`, `Akun`, `Tipe`, `Jumlah`, `Catatan`.

### 4.9 Menampilkan Daftar File Spreadsheet dari Google Drive
- **Endpoint**: `GET https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&orderBy=modifiedTime desc&pageSize=20&fields=files(id, name, modifiedTime, webViewLink)`
- **Fungsi**: `listUserSpreadsheets(accessToken)`

---

## 5. Analisis Masalah, Edge Cases & Rekomendasi Solusi

| Area | Temuan Potensi Masalah | Dampak | Rekomendasi & Solusi |
|---|---|---|---|
| **OAuth Token Expiry** | Google OAuth access token memiliki TTL 3600s (1 jam). Saat kedaluwarsa, panggilan REST menghasilkan HTTP 401. | Sinkronisasi gagal mendadak saat user lama membuka tab dashboard. | Implementasikan *auto token re-acquisition* via `GoogleAuthProvider` atau silent refresh sebelum token habis. |
| **Double Development Race Condition** | Dua instance AI Studio menulis ke spreadsheet yang sama tanpa locking mechanism. | Baris transaksi berpotensi saling menimpa jika `lastPopulatedRow` dihitung bersamaan. | Gunakan batch append atau identifikasi ID transaksi unik pada kolom Catatan/Hidden column. |
| **Number Format Inconsistency** | Format angka di Google Sheets (titik vs koma) bergantung pada *locale setting* spreadsheet (US vs Indonesia). | Nilai nominal dapat terpotong atau salah dibaca jika formula sheet menghasilkan format mata uang string. | Fungsi `parseCurrencyToNumber()` sudah memiliki pemisahan koma/titik cerdas, namun selalu kirim nilai integer murni saat `PUT/POST`. |
| **Desinkronisasi `rowIndex`** | Jika pengguna menghapus baris langsung di web Google Sheets, index baris pada state web lokal menjadi tidak sinkron. | Edit/Delete transaksi via web bisa mengenai baris yang salah. | Setelah setiap operasi mutasi (tambah/hapus/edit), jalankan refetch data terbaru secara otomatis. |
| **Penamaan Tab Bulan** | Format nama tab sheet bisa berupa huruf kapital (`SEPTEMBER`), kecil (`september`), atau judul (`September`). | Tab bulan tidak terdeteksi atau summary tidak cocok. | Gunakan normalisasi case-insensitive dan Title Case `normalizeMonthTitleCase()` untuk seluruh lookup. |

---

## 6. Rencana Kerja (Roadmap) Selanjutnya

1. **Fase 1: Optimalisasi Sinkronisasi Google Sheets & Fix Bugs**
   - Tingkatkan auto-refresh token OAuth.
   - Sempurnakan sinkronisasi real-time multi-arah (Web Dashboard <-> Google Sheets).
   - Validasi ketat input transaksi (saldo, akun, transfer antar rekening).

2. **Fase 2: Optimalisasi UI/UX Responsif**
   - Penyempurnaan Glassmorphism di resolusi layar smartphone & tablet.
   - Haptic feedback & navigasi swipe antar tab bulan yang lebih intuitif.

3. **Fase 3: Integrasi AI Chatbot (Gemini SDK)**
   - Pemanfaatan `@google/genai` untuk menganalisis data keuangan bulanan.
   - Fitur tanya-jawab: *"Berapa pengeluaran makanku bulan ini?"*, *"Pos mana yang overbudget?"*, *"Rekomendasi alokasi investasi"*.

4. **Fase 4: Arsitektur Multi-Platform (PWA, Android & iOS)**
   - Integrasi PWA (Progressive Web App) dengan manifest & service worker untuk instalasi langsung.
   - Persiapan packaging ke Capacitor / React Native / Native WebView untuk deployment App Store & Google Play Store.
