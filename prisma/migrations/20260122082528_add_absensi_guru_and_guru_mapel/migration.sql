-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'guru',
    "kelas" INTEGER,
    "mapelDiampu" TEXT,
    "fotoProfilUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "namaSekolah" TEXT NOT NULL DEFAULT 'SDN 2 Nangerang',
    "kepalaSekolah" TEXT,
    "nipKepsek" TEXT,
    "tahunAjaran" TEXT NOT NULL DEFAULT '2025/2026',

    CONSTRAINT "SchoolSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaliKelas" (
    "kelas" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "nip" TEXT,

    CONSTRAINT "WaliKelas_pkey" PRIMARY KEY ("kelas")
);

-- CreateTable
CREATE TABLE "Siswa" (
    "id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "kelas" INTEGER NOT NULL,
    "alamat" TEXT,
    "namaOrtu" TEXT,
    "noHp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nilai" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "mapel" TEXT NOT NULL,
    "jenisNilai" TEXT NOT NULL,
    "nilai" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurnal" (
    "id" TEXT NOT NULL,
    "kelas" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL,
    "jamKe" TEXT NOT NULL,
    "mapel" TEXT NOT NULL,
    "materi" TEXT NOT NULL,
    "metode" TEXT NOT NULL,
    "catatan" TEXT,
    "siswaAbsen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jurnal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapelKelas" (
    "id" TEXT NOT NULL,
    "kelas" INTEGER NOT NULL,
    "mapelCode" TEXT NOT NULL,
    "namaMapel" TEXT NOT NULL,

    CONSTRAINT "MapelKelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsensiGuru" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "waktuDatang" TEXT,
    "ttdDatang" TEXT,
    "waktuPulang" TEXT,
    "ttdPulang" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsensiGuru_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Siswa_nis_key" ON "Siswa"("nis");

-- CreateIndex
CREATE INDEX "Absensi_tanggal_idx" ON "Absensi"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "Absensi_siswaId_tanggal_key" ON "Absensi"("siswaId", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "Nilai_siswaId_mapel_jenisNilai_key" ON "Nilai"("siswaId", "mapel", "jenisNilai");

-- CreateIndex
CREATE INDEX "Jurnal_kelas_tanggal_idx" ON "Jurnal"("kelas", "tanggal");

-- CreateIndex
CREATE INDEX "MapelKelas_kelas_idx" ON "MapelKelas"("kelas");

-- CreateIndex
CREATE UNIQUE INDEX "MapelKelas_kelas_mapelCode_key" ON "MapelKelas"("kelas", "mapelCode");

-- CreateIndex
CREATE INDEX "AbsensiGuru_tanggal_idx" ON "AbsensiGuru"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "AbsensiGuru_userId_tanggal_key" ON "AbsensiGuru"("userId", "tanggal");

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
