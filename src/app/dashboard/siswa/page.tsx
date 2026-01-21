"use client"

import { useState, useEffect, useCallback } from "react"
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
    const [siswa, setSiswa] = useState<Siswa[]>([])
    const [loading, setLoading] = useState(true)
    const [kelas, setKelas] = useState(5)
    const [showModal, setShowModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null)
    const [importData, setImportData] = useState<Siswa[]>([])

    const fetchSiswa = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/siswa?kelas=${kelas}`)
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
        if (!confirm("Hapus siswa ini?")) return
        try {
            await fetch(`/api/siswa/${id}`, { method: "DELETE" })
            toast.success("Siswa berhasil dihapus")
            fetchSiswa()
        } catch {
            toast.error("Gagal menghapus siswa")
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
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">👨‍🎓 Data Siswa Kelas {kelas}</h1>
                    <p className="text-[#a0a0b0]">Kelola data siswa</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select
                        value={kelas}
                        onChange={(e) => setKelas(Number(e.target.value))}
                        className="px-4 py-2 bg-[#16213e] border border-white/10 rounded-lg"
                    >
                        {[1, 2, 3, 4, 5, 6].map((k) => (
                            <option key={k} value={k}>Kelas {k}</option>
                        ))}
                    </select>
                    <button onClick={() => { setEditingSiswa(null); setShowModal(true) }} className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg font-semibold">
                        + Tambah Siswa
                    </button>
                    <label className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold cursor-pointer">
                        📥 Import Excel
                        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={handleExport} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-semibold">
                        📤 Export Excel
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#16213e] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#667eea]/10 text-[#667eea]">
                                <th className="px-4 py-3 text-left">No</th>
                                <th className="px-4 py-3 text-left">NIS</th>
                                <th className="px-4 py-3 text-left">Nama Siswa</th>
                                <th className="px-4 py-3 text-left">L/P</th>
                                <th className="px-4 py-3 text-left">Alamat</th>
                                <th className="px-4 py-3 text-left">Nama Ortu</th>
                                <th className="px-4 py-3 text-left">No. HP</th>
                                <th className="px-4 py-3 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#a0a0b0]">Memuat data...</td></tr>
                            ) : siswa.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#a0a0b0]">Belum ada data siswa</td></tr>
                            ) : (
                                siswa.map((s, i) => (
                                    <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                                        <td className="px-4 py-3">{i + 1}</td>
                                        <td className="px-4 py-3">{s.nis}</td>
                                        <td className="px-4 py-3 font-medium">{s.nama}</td>
                                        <td className="px-4 py-3">{s.jenisKelamin}</td>
                                        <td className="px-4 py-3 text-[#a0a0b0]">{s.alamat || "-"}</td>
                                        <td className="px-4 py-3 text-[#a0a0b0]">{s.namaOrtu || "-"}</td>
                                        <td className="px-4 py-3 text-[#a0a0b0]">{s.noHp || "-"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingSiswa(s); setShowModal(true) }} className="px-3 py-1 bg-[#667eea] rounded text-sm">Edit</button>
                                                <button onClick={() => handleDelete(s.id)} className="px-3 py-1 bg-red-500 rounded text-sm">Hapus</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <SiswaModal
                    siswa={editingSiswa}
                    kelas={kelas}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchSiswa() }}
                />
            )}

            {/* Import Preview Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Preview Import ({importData.length} siswa)</h2>
                            <button onClick={() => setShowImportModal(false)} className="text-2xl">×</button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[#667eea]">
                                        <th className="px-2 py-1 text-left">No</th>
                                        <th className="px-2 py-1 text-left">NIS</th>
                                        <th className="px-2 py-1 text-left">Nama</th>
                                        <th className="px-2 py-1 text-left">L/P</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importData.slice(0, 10).map((s, i) => (
                                        <tr key={i} className="border-t border-white/5">
                                            <td className="px-2 py-1">{i + 1}</td>
                                            <td className="px-2 py-1">{s.nis}</td>
                                            <td className="px-2 py-1">{s.nama}</td>
                                            <td className="px-2 py-1">{s.jenisKelamin}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {importData.length > 10 && <p className="text-center text-[#a0a0b0] mt-2">...dan {importData.length - 10} data lainnya</p>}
                        </div>
                        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 bg-[#16213e] rounded-lg">Batal</button>
                            <button onClick={() => handleImport(false)} className="px-4 py-2 bg-emerald-600 rounded-lg font-semibold">Tambahkan ke Data</button>
                            <button onClick={() => handleImport(true)} className="px-4 py-2 bg-orange-600 rounded-lg font-semibold">Ganti Semua Data</button>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-md">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{siswa ? "Edit Siswa" : "Tambah Siswa"}</h2>
                    <button onClick={onClose} className="text-2xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">NIS</label>
                        <input type="text" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Nama Lengkap</label>
                        <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Jenis Kelamin</label>
                        <select value={form.jenisKelamin} onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg">
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Alamat</label>
                        <textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" rows={2}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Nama Orang Tua</label>
                        <input type="text" value={form.namaOrtu} onChange={(e) => setForm({ ...form, namaOrtu: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">No. HP</label>
                        <input type="text" value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-[#16213e] rounded-lg">Batal</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg font-semibold disabled:opacity-50">
                            {loading ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
