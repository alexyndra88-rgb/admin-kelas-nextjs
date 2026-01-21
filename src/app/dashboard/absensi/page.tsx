"use client"

import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"

interface Siswa {
    id: string
    nis: string
    nama: string
}

interface AbsensiData {
    [studentId: string]: string
}

export default function AbsensiPage() {
    const [siswa, setSiswa] = useState<Siswa[]>([])
    const [absensi, setAbsensi] = useState<AbsensiData>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [kelas, setKelas] = useState(5)
    const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [siswaRes, absensiRes] = await Promise.all([
                fetch(`/api/siswa?kelas=${kelas}`),
                fetch(`/api/absensi?kelas=${kelas}&tanggal=${tanggal}`)
            ])
            const siswaData = await siswaRes.json()
            const absensiData = await absensiRes.json()
            setSiswa(siswaData)
            setAbsensi(absensiData.reduce((acc: AbsensiData, a: { siswaId: string; status: string }) => {
                acc[a.siswaId] = a.status
                return acc
            }, {}))
        } catch {
            toast.error("Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }, [kelas, tanggal])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleStatusChange = (studentId: string, status: string) => {
        setAbsensi((prev) => ({ ...prev, [studentId]: status }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const entries = Object.entries(absensi).map(([siswaId, status]) => ({
                siswaId,
                status,
                tanggal,
            }))
            const res = await fetch("/api/absensi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entries, kelas }),
            })
            if (res.ok) {
                toast.success("Absensi berhasil disimpan!")
            } else {
                toast.error("Gagal menyimpan")
            }
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setSaving(false)
        }
    }

    const statusOptions = [
        { value: "H", label: "H", color: "bg-emerald-600" },
        { value: "S", label: "S", color: "bg-amber-600" },
        { value: "I", label: "I", color: "bg-blue-600" },
        { value: "A", label: "A", color: "bg-red-600" },
    ]

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">📋 Daftar Hadir Kelas {kelas}</h1>
                    <p className="text-[#a0a0b0]">Isi absensi harian siswa</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select value={kelas} onChange={(e) => setKelas(Number(e.target.value))} className="px-4 py-2 bg-[#16213e] border border-white/10 rounded-lg">
                        {[1, 2, 3, 4, 5, 6].map((k) => (<option key={k} value={k}>Kelas {k}</option>))}
                    </select>
                    <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="px-4 py-2 bg-[#16213e] border border-white/10 rounded-lg" />
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg font-semibold disabled:opacity-50">
                        {saving ? "Menyimpan..." : "💾 Simpan"}
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-4 text-sm">
                {statusOptions.map((s) => (
                    <div key={s.value} className="flex items-center gap-2">
                        <span className={`w-6 h-6 ${s.color} rounded flex items-center justify-center font-bold text-xs`}>{s.label}</span>
                        <span className="text-[#a0a0b0]">{s.value === "H" ? "Hadir" : s.value === "S" ? "Sakit" : s.value === "I" ? "Izin" : "Alpha"}</span>
                    </div>
                ))}
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
                                <th className="px-4 py-3 text-center">H</th>
                                <th className="px-4 py-3 text-center">S</th>
                                <th className="px-4 py-3 text-center">I</th>
                                <th className="px-4 py-3 text-center">A</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#a0a0b0]">Memuat data...</td></tr>
                            ) : siswa.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#a0a0b0]">Belum ada data siswa</td></tr>
                            ) : (
                                siswa.map((s, i) => (
                                    <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                                        <td className="px-4 py-3">{i + 1}</td>
                                        <td className="px-4 py-3">{s.nis}</td>
                                        <td className="px-4 py-3 font-medium">{s.nama}</td>
                                        {statusOptions.map((opt) => (
                                            <td key={opt.value} className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleStatusChange(s.id, opt.value)}
                                                    className={`w-10 h-10 rounded-lg font-bold transition-all ${absensi[s.id] === opt.value
                                                            ? `${opt.color} text-white shadow-lg scale-110`
                                                            : "bg-[#1a1a2e] text-[#a0a0b0] hover:bg-white/10"
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
