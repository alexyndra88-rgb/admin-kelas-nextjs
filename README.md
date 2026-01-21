# Administrasi Wali Kelas - SDN 2 Nangerang

Aplikasi web untuk administrasi wali kelas (Kelas 1-6) dengan fitur lengkap.

## Fitur

- ✅ **Multi-Kelas** - Kelola kelas 1-6
- ✅ **Data Siswa** - CRUD + Import Excel
- ✅ **Daftar Hadir** - Absensi harian H/S/I/A
- ✅ **Daftar Nilai** - Input nilai per mapel
- ✅ **Jurnal Harian** - Catatan pembelajaran
- ✅ **Pengaturan** - Info sekolah & wali kelas
- ✅ **Authentication** - Login admin/guru

## Tech Stack

- **Frontend**: Next.js 14 + TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js

## Setup Development

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment

Copy `.env.example` ke `.env` dan isi:

```env
DATABASE_URL="postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="random-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Push database schema

```bash
npm run db:push
```

### 4. Seed initial data

```bash
npm run db:seed
```

### 5. Run development server

```bash
npm run dev
```

Buka http://localhost:3000

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Guru Kelas 1 | guru1 | guru123 |
| Guru Kelas 2 | guru2 | guru123 |
| ... | ... | ... |

## Deploy ke Vercel

1. Push ke GitHub
2. Connect repo ke Vercel
3. Add environment variables di Vercel
4. Deploy!

## License

MIT
