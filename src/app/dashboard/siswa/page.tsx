"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"

interface Siswa {
    id: string
    nis: string
    nama: string
    jenisKelamin: string
    alamat?: string
    namaOrtu?: string
    noHp?: string
}

export default function SiswaPage() {
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === "admin"
    const userKelas = session?.user?.kelas

    const [siswa, setSiswa] = useState<Siswa[]>([])
    const [loading, setLoading] = useState(true)
    const [kelas, setKelas] = useState(userKelas || 5)
    const [showModal, setShowModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null)
    const [importData, setImportData] = useState<Siswa[]>([])

    // Guru hanya bisa akses kelasnya sendiri
    useEffect(() => {
        if (!isAdmin && userKelas) {
            setKelas(userKelas)
        }
    }, [isAdmin, userKelas])

    const fetchSiswa = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/siswa?kelas=${kelas}`, { cache: "no-store" })
            const data = await res.json()
            setSiswa(data)
        } catch {
            toast.error("Gagal memuat data siswa")
        } finally {
            setLoading(false)
        }
    }, [kelas])

    useEffect(() => {
        fetchSiswa()
    }, [fetchSiswa])

    const handleDelete = async (id: string) => {
        if (!isAdmin) {
            toast.error("Hanya admin yang bisa menghapus siswa")
            return
        }
        if (!confirm("Hapus siswa ini?")) return
        try {
            const res = await fetch(`/api/siswa/${id}`, { method: "DELETE" })
            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Gagal menghapus siswa")
            }
            toast.success("Siswa berhasil dihapus")
            fetchSiswa()
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus siswa")
        }
    }

    const handleExport = () => {
        if (siswa.length === 0) {
            toast.error("Tidak ada data untuk diexport")
            return
        }
        const data = siswa.map((s, i) => ({
            No: i + 1,
            NIS: s.nis,
            Nama: s.nama,
            "L/P": s.jenisKelamin,
            Alamat: s.alamat || "-",
            "Nama Ortu": s.namaOrtu || "-",
            "No HP": s.noHp || "-",
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Data Siswa")
        XLSX.writeFile(wb, `Data_Siswa_Kelas${kelas}.xlsx`)
        toast.success("Data berhasil diexport!")
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) {
            toast.error("Hanya admin yang bisa import data")
            return
        }
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: "array" })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]

            if (jsonData.length < 2) {
                toast.error("File tidak memiliki data")
                return
            }

            const headers = jsonData[0].map((h) => String(h).toLowerCase().trim())
            const findCol = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)))

            const colMap = {
                nis: findCol(["nis", "nisn", "no induk"]),
                nama: findCol(["nama"]),
                jk: findCol(["l/p", "jk", "jenis kelamin"]),
                alamat: findCol(["alamat"]),
                ortu: findCol(["ortu", "orang tua", "wali"]),
                hp: findCol(["hp", "telepon"]),
            }

            if (colMap.nis === -1 || colMap.nama === -1) {
                toast.error("Kolom NIS dan Nama harus ada!")
                return
            }

            const imported: Siswa[] = []
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i]
                if (!row[colMap.nama]) continue

                let jk = colMap.jk !== -1 ? String(row[colMap.jk] || "").toUpperCase() : ""
                if (jk.includes("LAKI")) jk = "L"
                if (jk.includes("PEREMPUAN")) jk = "P"

                imported.push({
                    id: "",
                    nis: String(row[colMap.nis] || "").trim(),
                    nama: String(row[colMap.nama] || "").trim(),
                    jenisKelamin: jk || "L",
                    alamat: colMap.alamat !== -1 ? String(row[colMap.alamat] || "") : "",
                    namaOrtu: colMap.ortu !== -1 ? String(row[colMap.ortu] || "") : "",
                    noHp: colMap.hp !== -1 ? String(row[colMap.hp] || "") : "",
                })
            }

            setImportData(imported)
            setShowImportModal(true)
        }
        reader.readAsArrayBuffer(file)
    }

    const handleImport = async (replace: boolean) => {
        try {
            const res = await fetch("/api/siswa/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ students: importData, kelas, replace }),
            })
            const result = await res.json()
            if (res.ok) {
                toast.success(result.message)
                setShowImportModal(false)
                setImportData([])
                fetchSiswa()
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Gagal import data")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Data Siswa Kelas {kelas}</h1>
                    <p className="text-sm text-[var(--accents-5)] mt-1">
                        {isAdmin ? "Kelola data siswa" : "Lihat data siswa (hanya baca)"}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Dropdown kelas hanya untuk admin */}
                    {isAdmin ? (
                        <div className="relative">
                            <select
                                value={kelas}
                                onChange={(e) => setKelas(Number(e.target.value))}
                                className="h-9 pl-3 pr-8 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none"
                            >
                                {[1, 2, 3, 4, 5, 6].map((k) => (
                                    <option key={k} value={k}>Kelas {k}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accents-5)]">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </div>
                    ) : (
                        <span className="h-9 px-3 flex items-center bg-[var(--accents-2)] border border-[var(--border)] rounded-md text-sm font-medium text-[var(--foreground)]">
                            Kelas {kelas}
                        </span>
                    )}

                    {/* Tombol tambah, import hanya untuk admin */}
                    {isAdmin && (
                        <>
                            <button onClick={() => { setEditingSiswa(null); setShowModal(true) }} className="h-9 px-3 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                                + Tambah
                            </button>
                            <label className="h-9 px-3 bg-white border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm font-medium hover:bg-[var(--accents-1)] transition-colors cursor-pointer flex items-center gap-2">
                                <span>Import Excel</span>
                                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </>
                    )}

                    {/* Export bisa untuk semua */}
                    <button onClick={handleExport} className="h-9 px-3 bg-white border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm font-medium hover:bg-[var(--accents-1)] transition-colors">
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="turbo-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--accents-1)]">
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] w-12">No</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] w-24">NIS</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)]">Nama Siswa</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] w-16">L/P</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)]">Alamat</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)]">Nama Ortu</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)]">No. HP</th>
                                {isAdmin && <th className="px-4 py-3 font-medium text-[var(--accents-5)] text-right">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-[var(--accents-5)]">Memuat data...</td></tr>
                            ) : siswa.length === 0 ? (
                                <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-[var(--accents-5)]">Belum ada data siswa</td></tr>
                            ) : (
                                siswa.map((s, i) => (
                                    <tr key={s.id} className="hover:bg-[var(--accents-1)] transition-colors group">
                                        <td className="px-4 py-3 text-[var(--accents-5)]">{i + 1}</td>
                                        <td className="px-4 py-3 text-[var(--foreground)] font-medium tabular-nums">{s.nis}</td>
                                        <td className="px-4 py-3 text-[var(--foreground)] font-medium">{s.nama}</td>
                                        <td className="px-4 py-3 text-[var(--accents-6)]">{s.jenisKelamin}</td>
                                        <td className="px-4 py-3 text-[var(--accents-5)] truncate max-w-[150px]">{s.alamat || "-"}</td>
                                        <td className="px-4 py-3 text-[var(--accents-5)] truncate max-w-[150px]">{s.namaOrtu || "-"}</td>
                                        <td className="px-4 py-3 text-[var(--accents-5)] font-medium tabular-nums">{s.noHp || "-"}</td>
                                        {isAdmin && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingSiswa(s); setShowModal(true) }} className="text-[var(--accents-5)] hover:text-black">Edit</button>
                                                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700">Hapus</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal - hanya untuk admin */}
            {showModal && isAdmin && (
                <SiswaModal
                    siswa={editingSiswa}
                    kelas={kelas}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchSiswa() }}
                />
            )}

            {/* Import Preview Modal */}
            {showImportModal && isAdmin && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--accents-1)]">
                            <h2 className="text-lg font-semibold">Preview Import ({importData.length} siswa)</h2>
                            <button onClick={() => setShowImportModal(false)} className="text-[var(--accents-5)] hover:text-black">✕</button>
                        </div>
                        <div className="p-0 overflow-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--accents-1)] sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 font-medium text-[var(--accents-5)]">No</th>
                                        <th className="px-4 py-2 font-medium text-[var(--accents-5)]">NIS</th>
                                        <th className="px-4 py-2 font-medium text-[var(--accents-5)]">Nama</th>
                                        <th className="px-4 py-2 font-medium text-[var(--accents-5)]">L/P</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {importData.map((s, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2 text-[var(--accents-5)]">{i + 1}</td>
                                            <td className="px-4 py-2 font-mono text-xs">{s.nis}</td>
                                            <td className="px-4 py-2">{s.nama}</td>
                                            <td className="px-4 py-2">{s.jenisKelamin}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--accents-1)]">
                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-[var(--accents-6)] hover:text-black">Batal</button>
                            <button onClick={() => handleImport(false)} className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800">Tambahkan</button>
                            <button onClick={() => handleImport(true)} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">Ganti Semua</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SiswaModal({ siswa, kelas, onClose, onSave }: { siswa: Siswa | null; kelas: number; onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({
        nis: siswa?.nis || "",
        nama: siswa?.nama || "",
        jenisKelamin: siswa?.jenisKelamin || "L",
        alamat: siswa?.alamat || "",
        namaOrtu: siswa?.namaOrtu || "",
        noHp: siswa?.noHp || "",
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const url = siswa ? `/api/siswa/${siswa.id}` : "/api/siswa"
            const method = siswa ? "PUT" : "POST"
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, kelas }),
            })
            if (res.ok) {
                toast.success(siswa ? "Data diperbarui!" : "Siswa ditambahkan!")
                onSave()
            } else {
                const error = await res.json()
                toast.error(error.error || "Gagal menyimpan")
            }
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--accents-1)]">
                    <h2 className="text-lg font-semibold">{siswa ? "Edit Siswa" : "Tambah Siswa"}</h2>
                    <button onClick={onClose} className="text-[var(--accents-5)] hover:text-black">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">NIS</label>
                        <input type="text" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Nama Lengkap</label>
                        <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Jenis Kelamin</label>
                        <select value={form.jenisKelamin} onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black">
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Alamat</label>
                        <textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" rows={2}></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Nama Orang Tua</label>
                        <input type="text" value={form.namaOrtu} onChange={(e) => setForm({ ...form, namaOrtu: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">No. HP</label>
                        <input type="text" value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" />
                    </div>
                    <div className="flex gap-3 pt-2 border-t border-[var(--border)] mt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-[var(--accents-6)] hover:text-black">Batal</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                            {loading ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
