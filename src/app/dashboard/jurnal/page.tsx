"use client"

import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"

interface Jurnal {
    id: string
    tanggal: string
    jamKe: string
    mapel: string
    materi: string
    metode: string
    catatan?: string
    siswaAbsen?: string
}

const mapelList = ["Bahasa Indonesia", "Matematika", "IPA", "IPS", "PKn", "Agama", "Penjas", "SBdP", "Bahasa Sunda"]

export default function JurnalPage() {
    const [jurnal, setJurnal] = useState<Jurnal[]>([])
    const [loading, setLoading] = useState(true)
    const [kelas, setKelas] = useState(5)
    const [showModal, setShowModal] = useState(false)
    const [editingJurnal, setEditingJurnal] = useState<Jurnal | null>(null)

    const fetchJurnal = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/jurnal?kelas=${kelas}`)
            const data = await res.json()
            setJurnal(data)
        } catch {
            toast.error("Gagal memuat jurnal")
        } finally {
            setLoading(false)
        }
    }, [kelas])

    useEffect(() => {
        fetchJurnal()
    }, [fetchJurnal])

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus jurnal ini?")) return
        try {
            await fetch(`/api/jurnal/${id}`, { method: "DELETE" })
            toast.success("Jurnal berhasil dihapus")
            fetchJurnal()
        } catch {
            toast.error("Gagal menghapus")
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">📖 Jurnal Kelas {kelas}</h1>
                    <p className="text-[#a0a0b0]">Catatan kegiatan pembelajaran harian</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select value={kelas} onChange={(e) => setKelas(Number(e.target.value))} className="px-4 py-2 bg-[#16213e] border border-white/10 rounded-lg">
                        {[1, 2, 3, 4, 5, 6].map((k) => (<option key={k} value={k}>Kelas {k}</option>))}
                    </select>
                    <button onClick={() => { setEditingJurnal(null); setShowModal(true) }} className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg font-semibold">
                        + Tambah Jurnal
                    </button>
                </div>
            </div>

            {/* Jurnal List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-[#a0a0b0] py-8">Memuat data...</div>
                ) : jurnal.length === 0 ? (
                    <div className="bg-[#16213e] border border-white/10 rounded-xl p-8 text-center text-[#a0a0b0]">
                        <span className="text-4xl block mb-2">📖</span>
                        Belum ada jurnal
                    </div>
                ) : (
                    jurnal.map((j) => (
                        <div key={j.id} className="bg-[#16213e] border border-white/10 rounded-xl p-6 hover:border-[#667eea] transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 text-[#667eea] font-semibold">
                                        <span>📅 {formatDate(j.tanggal)}</span>
                                        <span className="text-[#a0a0b0]">| Jam ke-{j.jamKe}</span>
                                    </div>
                                    <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-sm font-semibold">{j.mapel}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingJurnal(j); setShowModal(true) }} className="px-3 py-1 bg-[#667eea] rounded text-sm">Edit</button>
                                    <button onClick={() => handleDelete(j.id)} className="px-3 py-1 bg-red-500 rounded text-sm">Hapus</button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex gap-3"><span className="text-[#a0a0b0] w-24">Materi:</span><span>{j.materi}</span></div>
                                <div className="flex gap-3"><span className="text-[#a0a0b0] w-24">Metode:</span><span>{j.metode}</span></div>
                                {j.catatan && <div className="flex gap-3"><span className="text-[#a0a0b0] w-24">Catatan:</span><span>{j.catatan}</span></div>}
                                {j.siswaAbsen && <div className="flex gap-3"><span className="text-[#a0a0b0] w-24">Tidak Hadir:</span><span>{j.siswaAbsen}</span></div>}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <JurnalModal
                    jurnal={editingJurnal}
                    kelas={kelas}
                    mapelList={mapelList}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchJurnal() }}
                />
            )}
        </div>
    )
}

function JurnalModal({ jurnal, kelas, mapelList, onClose, onSave }: { jurnal: Jurnal | null; kelas: number; mapelList: string[]; onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({
        tanggal: jurnal?.tanggal?.split("T")[0] || new Date().toISOString().split("T")[0],
        jamKe: jurnal?.jamKe || "",
        mapel: jurnal?.mapel || "",
        materi: jurnal?.materi || "",
        metode: jurnal?.metode || "",
        catatan: jurnal?.catatan || "",
        siswaAbsen: jurnal?.siswaAbsen || "",
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const url = jurnal ? `/api/jurnal/${jurnal.id}` : "/api/jurnal"
            const method = jurnal ? "PUT" : "POST"
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, kelas }),
            })
            if (res.ok) {
                toast.success(jurnal ? "Jurnal diperbarui!" : "Jurnal ditambahkan!")
                onSave()
            } else {
                toast.error("Gagal menyimpan")
            }
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{jurnal ? "Edit Jurnal" : "Tambah Jurnal"}</h2>
                    <button onClick={onClose} className="text-2xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[#a0a0b0] mb-1">Tanggal</label>
                            <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm text-[#a0a0b0] mb-1">Jam Ke</label>
                            <input type="text" value={form.jamKe} onChange={(e) => setForm({ ...form, jamKe: e.target.value })} placeholder="1-2" className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Mata Pelajaran</label>
                        <select value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" required>
                            <option value="">-- Pilih --</option>
                            {mapelList.map((m) => (<option key={m} value={m}>{m}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Materi</label>
                        <textarea value={form.materi} onChange={(e) => setForm({ ...form, materi: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" rows={3} required></textarea>
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Metode Pembelajaran</label>
                        <input type="text" value={form.metode} onChange={(e) => setForm({ ...form, metode: e.target.value })} placeholder="Ceramah, Diskusi, dll" className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Catatan (opsional)</label>
                        <textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" rows={2}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm text-[#a0a0b0] mb-1">Siswa Tidak Hadir (opsional)</label>
                        <textarea value={form.siswaAbsen} onChange={(e) => setForm({ ...form, siswaAbsen: e.target.value })} className="w-full px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg" rows={2}></textarea>
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
