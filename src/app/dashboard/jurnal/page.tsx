"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { getMapelByKelas } from "@/lib/mapelConfig"

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

export default function JurnalPage() {
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === "admin"
    const userKelas = session?.user?.kelas

    const [jurnal, setJurnal] = useState<Jurnal[]>([])
    const [loading, setLoading] = useState(true)
    const [kelas, setKelas] = useState(userKelas || 5)
    const [showModal, setShowModal] = useState(false)
    const [editingJurnal, setEditingJurnal] = useState<Jurnal | null>(null)

    // Get subjects for current class
    const mapelList = getMapelByKelas(kelas)

    // Lock kelas untuk guru
    useEffect(() => {
        if (!isAdmin && userKelas) {
            setKelas(userKelas)
        }
    }, [isAdmin, userKelas])

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Jurnal Kelas {kelas}</h1>
                    <p className="text-sm text-[var(--accents-5)] mt-1">Catatan kegiatan pembelajaran harian</p>
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

                    <button onClick={() => { setEditingJurnal(null); setShowModal(true) }} className="h-9 px-4 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Tambah Jurnal
                    </button>
                </div>
            </div>

            {/* Jurnal List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center text-[var(--accents-5)] py-12">Memuat data...</div>
                ) : jurnal.length === 0 ? (
                    <div className="turbo-card p-12 text-center text-[var(--accents-5)] flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-[var(--accents-2)] rounded-full flex items-center justify-center text-xl mb-3">
                            📖
                        </div>
                        <p>Belum ada jurnal pembelajaran</p>
                    </div>
                ) : (
                    jurnal.map((j) => (
                        <div key={j.id} className="turbo-card p-5 hover:border-[var(--accents-4)] transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-semibold text-[var(--foreground)]">
                                            {formatDate(j.tanggal)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-[var(--accents-2)] text-xs font-medium text-[var(--accents-6)]">
                                            Jam ke-{j.jamKe}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-blue-600">{j.mapel}</div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingJurnal(j); setShowModal(true) }} className="px-3 py-1 text-sm font-medium text-[var(--accents-6)] hover:text-black hover:bg-[var(--accents-2)] rounded-md transition-colors">Edit</button>
                                    <button onClick={() => handleDelete(j.id)} className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">Hapus</button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-[var(--accents-6)] mt-4 pt-4 border-t border-[var(--border)]">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="text-[var(--accents-4)]">Materi</span>
                                    <span className="text-[var(--foreground)]">{j.materi}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="text-[var(--accents-4)]">Metode</span>
                                    <span className="text-[var(--foreground)]">{j.metode}</span>
                                </div>
                                {j.catatan && (
                                    <div className="grid grid-cols-[80px_1fr] gap-2">
                                        <span className="text-[var(--accents-4)]">Catatan</span>
                                        <span className="text-[var(--foreground)]">{j.catatan}</span>
                                    </div>
                                )}
                                {j.siswaAbsen && (
                                    <div className="grid grid-cols-[80px_1fr] gap-2">
                                        <span className="text-[var(--accents-4)]">Absen</span>
                                        <span className="text-red-600 font-medium">{j.siswaAbsen}</span>
                                    </div>
                                )}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--accents-1)]">
                    <h2 className="text-lg font-semibold">{jurnal ? "Edit Jurnal" : "Tambah Jurnal"}</h2>
                    <button onClick={onClose} className="text-[var(--accents-5)] hover:text-black">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Tanggal</label>
                            <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Jam Ke</label>
                            <input type="text" value={form.jamKe} onChange={(e) => setForm({ ...form, jamKe: e.target.value })} placeholder="1-2" className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Mata Pelajaran</label>
                        <select value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" required>
                            <option value="">-- Pilih --</option>
                            {mapelList.map((m) => (<option key={m} value={m}>{m}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Materi</label>
                        <textarea value={form.materi} onChange={(e) => setForm({ ...form, materi: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" rows={3} required></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Metode Pembelajaran</label>
                        <input type="text" value={form.metode} onChange={(e) => setForm({ ...form, metode: e.target.value })} placeholder="Ceramah, Diskusi, dll" className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Catatan (opsional)</label>
                        <textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" rows={2}></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--accents-5)] mb-1">Siswa Tidak Hadir (opsional)</label>
                        <textarea value={form.siswaAbsen} onChange={(e) => setForm({ ...form, siswaAbsen: e.target.value })} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-black" rows={2}></textarea>
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
