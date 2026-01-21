"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface SchoolSettings {
    namaSekolah: string
    kepalaSekolah: string
    nipKepsek: string
    tahunAjaran: string
}

interface WaliKelasWithAccount {
    kelas: number
    nama: string
    nip: string
    username: string
    password?: string
}

export default function PengaturanPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const isAdmin = session?.user?.role === "admin"

    const [school, setSchool] = useState<SchoolSettings>({
        namaSekolah: "SDN 2 Nangerang",
        kepalaSekolah: "",
        nipKepsek: "",
        tahunAjaran: "2025/2026",
    })
    const [waliKelas, setWaliKelas] = useState<WaliKelasWithAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Redirect non-admin
    useEffect(() => {
        if (session && !isAdmin) {
            toast.error("Akses ditolak. Hanya admin yang bisa mengakses halaman ini.")
            router.push("/dashboard")
        }
    }, [session, isAdmin, router])

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
                    setWaliKelas(data)
                }
            } catch {
                console.error("Failed to fetch settings")
            } finally {
                setLoading(false)
            }
        }
        if (isAdmin) fetchSettings()
    }, [isAdmin])

    const handleSaveSchool = async () => {
        if (!isAdmin) return
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
        if (!isAdmin) return
        setSaving(true)
        try {
            const res = await fetch("/api/settings/wali-kelas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waliKelasData: waliKelas }),
            })
            if (res.ok) toast.success("Data wali kelas & akun berhasil disimpan!")
            else toast.error("Gagal menyimpan")
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setSaving(false)
        }
    }

    const updateWali = (kelas: number, field: keyof WaliKelasWithAccount, value: string) => {
        setWaliKelas(prev => prev.map(w => w.kelas === kelas ? { ...w, [field]: value } : w))
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <span className="text-6xl">🔒</span>
                    <h2 className="text-xl font-bold mt-4">Akses Ditolak</h2>
                    <p className="text-[#a0a0b0] mt-2">Hanya admin yang bisa mengakses halaman ini</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return <div className="text-center text-[var(--accents-5)] py-12">Memuat pengaturan...</div>
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Pengaturan Sistem</h1>
                <p className="text-base text-[var(--accents-5)]">Kelola informasi sekolah dan akun wali kelas</p>
            </div>

            {/* School Settings */}
            <div className="turbo-card p-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border)]">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-100">
                        🏫
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Informasi Sekolah</h2>
                        <p className="text-sm text-[var(--accents-5)]">Data utama identitas sekolah</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Nama Sekolah" value={school.namaSekolah} onChange={(v) => setSchool({ ...school, namaSekolah: v })} />
                    <Field label="Tahun Ajaran" value={school.tahunAjaran} onChange={(v) => setSchool({ ...school, tahunAjaran: v })} />
                    <Field label="Nama Kepala Sekolah" value={school.kepalaSekolah} onChange={(v) => setSchool({ ...school, kepalaSekolah: v })} />
                    <Field label="NIP Kepala Sekolah" value={school.nipKepsek} onChange={(v) => setSchool({ ...school, nipKepsek: v })} />
                </div>

                <div className="mt-8 flex justify-end">
                    <button onClick={handleSaveSchool} disabled={saving} className="h-10 px-6 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </div>

            {/* Wali Kelas & User Settings */}
            <div className="turbo-card p-8">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-[var(--border)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xl border border-purple-100">
                            🔐
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--foreground)]">Manajemen Akun Guru</h2>
                            <p className="text-sm text-[var(--accents-5)]">Akses login wali kelas</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-[var(--accents-2)] text-[var(--foreground)] text-sm font-medium rounded-full border border-[var(--border)]">
                        6 Kelas
                    </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {waliKelas.map((w) => (
                        <div key={w.kelas} className="border border-[var(--border)] rounded-xl p-6 hover:border-[var(--accents-4)] transition-all bg-[var(--accents-1)]/30">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-full bg-white border border-[var(--border)] flex items-center justify-center font-bold text-[var(--foreground)] shadow-sm">
                                    {w.kelas}
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-[var(--foreground)]">Wali Kelas {w.kelas}</h3>
                                    <p className="text-xs text-[var(--accents-5)]">Edit kredensial login</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <MiniField label="Nama Pengajar" placeholder="Nama Lengkap" value={w.nama} onChange={(v) => updateWali(w.kelas, "nama", v)} />
                                    <MiniField label="NIP Guru" placeholder="NIP (opsional)" value={w.nip} onChange={(v) => updateWali(w.kelas, "nip", v)} />
                                </div>

                                <div className="pt-4 border-t border-[var(--border)] mt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <MiniField
                                            label="Username"
                                            placeholder="username"
                                            value={w.username}
                                            onChange={(v) => updateWali(w.kelas, "username", v)}
                                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                                        />
                                        <MiniField
                                            label="Password Baru"
                                            placeholder="Ganti password..."
                                            type="password"
                                            value={w.password || ""}
                                            onChange={(v) => updateWali(w.kelas, "password", v)}
                                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-6 mt-10 flex justify-center">
                    <button
                        onClick={handleSaveWali}
                        disabled={saving}
                        className="h-12 px-8 bg-black text-white rounded-full font-medium shadow-lg hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 text-base ring-1 ring-white/20"
                    >
                        {saving ? "Memproses..." : "Simpan Semua Data Guru"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">{label}</label>
            <input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
        </div>
    )
}

function MiniField({ label, placeholder, value, onChange, type = "text", icon }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string; icon?: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-[var(--accents-5)] mb-1.5 uppercase tracking-wider">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accents-4)]">{icon}</span>}
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full ${icon ? 'pl-9' : 'px-3'} py-2 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder:text-[var(--accents-3)]`}
                />
            </div>
        </div>
    )
}
