"use client"

import { useState, useEffect, useCallback } from "react"
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
    const [siswa, setSiswa] = useState<Siswa[]>([])
    const [nilai, setNilai] = useState<NilaiData>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [kelas, setKelas] = useState(5)
    const [mapel, setMapel] = useState("")
    const [jenisNilai, setJenisNilai] = useState("")

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
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">📝 Daftar Nilai Kelas {kelas}</h1>
                    <p className="text-[#a0a0b0]">Input nilai per mata pelajaran</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select value={kelas} onChange={(e) => setKelas(Number(e.target.value))} className="px-4 py-2 bg-[#16213e] border border-white/10 rounded-lg">
                        {[1, 2, 3, 4, 5, 6].map((k) => (<option key={k} value={k}>Kelas {k}</option>))}
                    </select>
                    <select value={mapel} onChange={(e) => setMapel(e.target.value)} className="px-4 py-2 bg-[#16213e] border border-white/10 rounded-lg">
                        <option value="">-- Pilih Mapel --</option>
                        {mapelList.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                    <select value={jenisNilai} onChange={(e) => setJenisNilai(e.target.value)} className="px-4 py-2 bg-[#16213e] border border-white/10 rounded-lg">
                        <option value="">-- Jenis Nilai --</option>
                        {jenisNilaiList.map((j) => (<option key={j} value={j}>{j}</option>))}
                    </select>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg font-semibold disabled:opacity-50">
                        {saving ? "Menyimpan..." : "💾 Simpan"}
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
                                <th className="px-4 py-3 text-center">Nilai</th>
                                <th className="px-4 py-3 text-center">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!mapel || !jenisNilai ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#a0a0b0]">Pilih mata pelajaran dan jenis nilai</td></tr>
                            ) : loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#a0a0b0]">Memuat data...</td></tr>
                            ) : siswa.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#a0a0b0]">Belum ada data siswa</td></tr>
                            ) : (
                                siswa.map((s, i) => {
                                    const n = nilai[s.id]
                                    const tuntas = n !== undefined && n >= KKM
                                    return (
                                        <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                                            <td className="px-4 py-3">{i + 1}</td>
                                            <td className="px-4 py-3">{s.nis}</td>
                                            <td className="px-4 py-3 font-medium">{s.nama}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    min="0" max="100"
                                                    value={n ?? ""}
                                                    onChange={(e) => handleNilaiChange(s.id, e.target.value)}
                                                    className="w-20 px-3 py-2 bg-[#1a1a2e] border border-white/10 rounded-lg text-center font-bold"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {n !== undefined && (
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tuntas ? "bg-emerald-600/20 text-emerald-400" : "bg-red-600/20 text-red-400"}`}>
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
