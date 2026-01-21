"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface Siswa {
    id: string
    nis: string
    nama: string
}

interface NilaiData {
    [studentId: string]: number
}

const mapelList = ["Bahasa Indonesia", "Matematika", "IPA", "IPS", "PKn", "Agama", "Penjas", "SBdP", "Bahasa Sunda"]
const jenisNilaiList = ["UH1", "UH2", "UH3", "UTS", "UAS"]
const KKM = 70

export default function NilaiPage() {
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === "admin"
    const userKelas = session?.user?.kelas

    const [siswa, setSiswa] = useState<Siswa[]>([])
    const [nilai, setNilai] = useState<NilaiData>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [kelas, setKelas] = useState(userKelas || 5)
    const [mapel, setMapel] = useState("")
    const [jenisNilai, setJenisNilai] = useState("")

    // Lock kelas untuk guru
    useEffect(() => {
        if (!isAdmin && userKelas) {
            setKelas(userKelas)
        }
    }, [isAdmin, userKelas])

    const fetchData = useCallback(async () => {
        if (!mapel || !jenisNilai) return
        try {
            setLoading(true)
            const [siswaRes, nilaiRes] = await Promise.all([
                fetch(`/api/siswa?kelas=${kelas}`),
                fetch(`/api/nilai?kelas=${kelas}&mapel=${encodeURIComponent(mapel)}&jenisNilai=${jenisNilai}`)
            ])
            const siswaData = await siswaRes.json()
            const nilaiData = await nilaiRes.json()
            setSiswa(siswaData)
            setNilai(nilaiData.reduce((acc: NilaiData, n: { siswaId: string; nilai: number }) => {
                acc[n.siswaId] = n.nilai
                return acc
            }, {}))
        } catch {
            toast.error("Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }, [kelas, mapel, jenisNilai])

    useEffect(() => {
        if (mapel && jenisNilai) fetchData()
    }, [fetchData, mapel, jenisNilai])

    const handleNilaiChange = (studentId: string, value: string) => {
        const num = parseInt(value)
        if (value === "" || (num >= 0 && num <= 100)) {
            setNilai((prev) => ({ ...prev, [studentId]: num }))
        }
    }

    const handleSave = async () => {
        if (!mapel || !jenisNilai) { toast.error("Pilih mapel dan jenis nilai"); return }
        setSaving(true)
        try {
            const entries = Object.entries(nilai).filter(([, v]) => !isNaN(v)).map(([siswaId, nilaiValue]) => ({
                siswaId, mapel, jenisNilai, nilai: nilaiValue
            }))
            const res = await fetch("/api/nilai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entries }),
            })
            if (res.ok) toast.success("Nilai berhasil disimpan!")
            else toast.error("Gagal menyimpan")
        } catch { toast.error("Terjadi kesalahan") }
        finally { setSaving(false) }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Daftar Nilai Kelas {kelas}</h1>
                    <p className="text-sm text-[var(--accents-5)] mt-1">Input penilaian siswa per mata pelajaran</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Class Selector hanya untuk admin */}
                    {isAdmin ? (
                        <div className="relative">
                            <select
                                value={kelas}
                                onChange={(e) => setKelas(Number(e.target.value))}
                                className="h-9 pl-3 pr-8 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none"
                            >
                                {[1, 2, 3, 4, 5, 6].map((k) => (<option key={k} value={k}>Kelas {k}</option>))}
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

                    <div className="relative">
                        <select
                            value={mapel}
                            onChange={(e) => setMapel(e.target.value)}
                            className="h-9 pl-3 pr-8 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none min-w-[150px]"
                        >
                            <option value="">-- Pilih Mapel --</option>
                            {mapelList.map((m) => (<option key={m} value={m}>{m}</option>))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accents-5)]">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={jenisNilai}
                            onChange={(e) => setJenisNilai(e.target.value)}
                            className="h-9 pl-3 pr-8 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none"
                        >
                            <option value="">-- Jenis Nilai --</option>
                            {jenisNilaiList.map((j) => (<option key={j} value={j}>{j}</option>))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accents-5)]">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-9 px-4 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        {saving ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            "Simpan"
                        )}
                    </button>
                </div>
            </div>

            {/* Table - Turbo Card */}
            <div className="turbo-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--accents-1)]">
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] w-16">No</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] w-32">NIS</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)]">Nama Siswa</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] text-center w-32">Nilai (0-100)</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] text-center w-40">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {!mapel || !jenisNilai ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--accents-5)]">Silakan pilih Mata Pelajaran dan Jenis Nilai terlebih dahulu</td></tr>
                            ) : loading ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--accents-5)]">Memuat data...</td></tr>
                            ) : siswa.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--accents-5)]">Belum ada data siswa</td></tr>
                            ) : (
                                siswa.map((s, i) => {
                                    const n = nilai[s.id]
                                    const tuntas = n !== undefined && n >= KKM
                                    return (
                                        <tr key={s.id} className="hover:bg-[var(--accents-1)] transition-colors group">
                                            <td className="px-4 py-3 text-[var(--accents-5)]">{i + 1}</td>
                                            <td className="px-4 py-3 text-[var(--foreground)] font-mono text-xs">{s.nis}</td>
                                            <td className="px-4 py-3 text-[var(--foreground)] font-medium">{s.nama}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    min="0" max="100"
                                                    value={n ?? ""}
                                                    onChange={(e) => handleNilaiChange(s.id, e.target.value)}
                                                    className="w-20 px-3 py-1.5 bg-white border border-[var(--border)] rounded text-center font-bold text-sm text-[var(--foreground)] focus:ring-1 focus:ring-black focus:border-black outline-none transition-all placeholder:text-[var(--accents-3)]"
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {n !== undefined && (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tuntas
                                                            ? "bg-green-100 text-green-800 border border-green-200"
                                                            : "bg-red-100 text-red-800 border border-red-200"
                                                        }`}>
                                                        {tuntas ? "Tuntas" : "Belum Tuntas"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
