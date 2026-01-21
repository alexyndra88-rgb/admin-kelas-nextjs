"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"

interface SchoolSettings {
    namaSekolah: string
    kepalaSekolah: string
    nipKepsek: string
    tahunAjaran: string
}

interface WaliKelas {
    kelas: number
    nama: string
    nip: string
}

export default function PengaturanPage() {
    const [school, setSchool] = useState<SchoolSettings>({
        namaSekolah: "SDN 2 Nangerang",
        kepalaSekolah: "",
        nipKepsek: "",
        tahunAjaran: "2025/2026",
    })
    const [waliKelas, setWaliKelas] = useState<WaliKelas[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [schoolRes, waliRes] = await Promise.all([
                    fetch("/api/settings/school"),
                    fetch("/api/settings/wali-kelas")
                ])
                if (schoolRes.ok) {
                    const data = await schoolRes.json()
                    if (data) setSchool(data)
                }
                if (waliRes.ok) {
                    const data = await waliRes.json()
                    if (data.length > 0) setWaliKelas(data)
                    else setWaliKelas([1, 2, 3, 4, 5, 6].map(k => ({ kelas: k, nama: "", nip: "" })))
                }
            } catch {
                console.error("Failed to fetch settings")
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSaveSchool = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/settings/school", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(school),
            })
            if (res.ok) toast.success("Pengaturan sekolah disimpan!")
            else toast.error("Gagal menyimpan")
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveWali = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/settings/wali-kelas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waliKelas }),
            })
            if (res.ok) toast.success("Data wali kelas disimpan!")
            else toast.error("Gagal menyimpan")
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setSaving(false)
        }
    }

    const updateWali = (kelas: number, field: "nama" | "nip", value: string) => {
        setWaliKelas(prev => prev.map(w => w.kelas === kelas ? { ...w, [field]: value } : w))
    }

    if (loading) {
        return <div className="text-center text-[#a0a0b0] py-8">Memuat pengaturan...</div>
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">⚙️ Pengaturan</h1>
                <p className="text-[#a0a0b0]">Kelola informasi sekolah dan wali kelas</p>
            </div>

            {/* School Settings */}
            <div className="bg-[#16213e] border border-white/10 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-[#667eea]">🏫</span> Informasi Sekolah
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Nama Sekolah</label>
                        <input type="text" value={school.namaSekolah} onChange={(e) => setSchool({ ...school, namaSekolah: e.target.value })} className="w-full px-3 py-2 bg-[#1a1a2e] border border-white/10 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Tahun Ajaran</label>
                        <input type="text" value={school.tahunAjaran} onChange={(e) => setSchool({ ...school, tahunAjaran: e.target.value })} className="w-full px-3 py-2 bg-[#1a1a2e] border border-white/10 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Nama Kepala Sekolah</label>
                        <input type="text" value={school.kepalaSekolah} onChange={(e) => setSchool({ ...school, kepalaSekolah: e.target.value })} className="w-full px-3 py-2 bg-[#1a1a2e] border border-white/10 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">NIP Kepala Sekolah</label>
                        <input type="text" value={school.nipKepsek} onChange={(e) => setSchool({ ...school, nipKepsek: e.target.value })} className="w-full px-3 py-2 bg-[#1a1a2e] border border-white/10 rounded-lg" />
                    </div>
                </div>
                <button onClick={handleSaveSchool} disabled={saving} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg font-semibold disabled:opacity-50">
                    💾 Simpan Pengaturan Sekolah
                </button>
            </div>

            {/* Wali Kelas Settings */}
            <div className="bg-[#16213e] border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-[#667eea]">👩‍🏫</span> Data Wali Kelas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {waliKelas.map((w) => (
                        <div key={w.kelas} className="bg-[#1a1a2e] border border-white/10 rounded-lg p-4">
                            <h3 className="font-semibold text-[#667eea] mb-3">Wali Kelas {w.kelas}</h3>
                            <input
                                type="text"
                                placeholder="Nama wali kelas"
                                value={w.nama}
                                onChange={(e) => updateWali(w.kelas, "nama", e.target.value)}
                                className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg mb-2"
                            />
                            <input
                                type="text"
                                placeholder="NIP"
                                value={w.nip}
                                onChange={(e) => updateWali(w.kelas, "nip", e.target.value)}
                                className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={handleSaveWali} disabled={saving} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg font-semibold disabled:opacity-50">
                    💾 Simpan Data Wali Kelas
                </button>
            </div>
        </div>
    )
}
