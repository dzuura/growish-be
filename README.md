# Growish API

## 📘 Deskripsi Proyek

Growish adalah sistem backend untuk mengelola data nutrisi bahan pangan dan resep makanan. Aplikasi ini mendukung dua jenis pengguna: **Peneliti Pangan (researcher)** dan **Ahli Gizi (nutritionist)**. Sistem dibangun menggunakan **Node.js**, **Express**, dan **Supabase**, dengan **JWT (JSON Web Token)** untuk autentikasi.

- **Peneliti Pangan** dapat mengelola data bahan pangan dan kategori.
- **Ahli Gizi** dapat membuat dan mengelola resep dari bahan-bahan yang tersedia.

---

## 🚀 Fitur Utama

- **Autentikasi Pengguna:** Registrasi, login, dan logout menggunakan JWT (berlaku 1 jam).
- **Manajemen Bahan Pangan (Labora):** Peneliti pangan dapat menambah, mengedit, menghapus, dan melihat statistik bahan pangan.
- **Manajemen Kategori:** Peneliti pangan dapat mengelola kategori bahan pangan secara dinamis.
- **Manajemen Resep (LabGizi):** Ahli gizi dapat membuat, mengedit, dan menghapus resep dengan bahan pangan yang tersedia.
- **Akses Role-based:** Setiap endpoint dibatasi sesuai role (researcher/nutritionist).
---

## ✅ Prasyarat

- Node.js (v14 atau lebih tinggi)
- npm
- Akun Supabase
- Git

---

## ⚙️ Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd growish-be
```
### 2. Instal Dependensi
```bash
npm install
```
### 3. Konfigurasi Environment Variables
Buat file .env di root proyek:
```ini
# Server
PORT=3000

# Supabase (researcher)
SUPABASE_RESEARCHER_URL=your-researcher-supabase-url
SUPABASE_RESEARCHER_KEY=your-researcher-supabase-key

# Supabase (nutritionist)
SUPABASE_NUTRITIONIST_URL=your-nutritionist-supabase-url
SUPABASE_NUTRITIONIST_KEY=your-nutritionist-supabase-key

# JWT
JWT_SECRET=your_jwt_secret
```
### 4. Jalankan Server
```bash
npm run dev
```

---

## 🗂️ Struktur Proyek

```lua
growish-be/
├── src/
│   ├── config/
│   │   ├── supabase-researcher.js
│   │   └── supabase-nutritionist.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── materialController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── materials.js
│   ├── services/
│   │   └── materialService.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

---

## 📘 Dokumentasi API
Lihat Dokumentasi API Interaktif (Postman) [di sini](https://documenter.getpostman.com/view/39730752/2sB2qfBfS2).

---

## 🔐 Catatan

### 1. Autentikasi: Semua endpoint (kecuali register/login) memerlukan header:
```makefile
Authorization: Bearer <token>
```
### 2. Role Akses:
- Endpoint Labora & Categories hanya untuk researcher.
- Endpoint LabGizi hanya untuk nutritionist.
