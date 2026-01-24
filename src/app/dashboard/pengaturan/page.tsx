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

interface SpecialAccount {
    id: string
    name: string
    username: string
    password?: string
    role: string
    mapelDiampu?: string // For guru_mapel
    nip?: string
}

interface MapelItem {
    code: string
    name: string
    isCustom: boolean
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
    const [specialAccounts, setSpecialAccounts] = useState<SpecialAccount[]>([])
    const [mapelKelas, setMapelKelas] = useState<number>(1)
    const [mapelList, setMapelList] = useState<MapelItem[]>([])
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
                const [schoolRes, waliRes, specialRes] = await Promise.all([
                    fetch("/api/settings/school"),
                    fetch("/api/settings/wali-kelas"),
                    fetch("/api/settings/special-accounts")
                ])
                if (schoolRes.ok) {
                    const data = await schoolRes.json()
                    if (data) setSchool(data)
                }
                if (waliRes.ok) {
                    const data = await waliRes.json()
                    setWaliKelas(data)
                }
                if (specialRes.ok) {
                    const data = await specialRes.json()
                    // Maintain existing logic for Kepsek/Pengawas defaults
                    const defaultRoles = [
                        { role: "kepsek", name: "", username: "" },
                        { role: "pengawas", name: "", username: "" }
                    ]

                    const existing = data || []

                    // Merge defaults for kepsek/pengawas
                    const mergedDefaults = defaultRoles.map(def => {
                        const found = existing.find((e: SpecialAccount) => e.role === def.role)
                        return found ? { ...found, password: "" } : { ...def, id: "", password: "", role: def.role }
                    })

                    // Add existing guru_mapel accounts
                    const guruMapelAccounts = existing.filter((e: SpecialAccount) => e.role === "guru_mapel").map((acc: SpecialAccount) => ({ ...acc, password: "" }))

                    setSpecialAccounts([...mergedDefaults, ...guruMapelAccounts])
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

    const updateSpecialAccount = (idOrRole: string, field: keyof SpecialAccount, value: string) => {
        // Update logic: identify by ID if exists (for guru_mapel often multiple), or role (for unique kepsek/pengawas)
        setSpecialAccounts(prev => prev.map(a => {
            if (a.id && a.id === idOrRole) return { ...a, [field]: value } // Match by ID
            if (!a.id && a.role === idOrRole) return { ...a, [field]: value } // Match by Role (for new/singleton)
            return a
        }))
    }

    const handleSaveSpecial = async () => {
        if (!isAdmin) return
        setSaving(true)
        try {
            const res = await fetch("/api/settings/special-accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accounts: specialAccounts }),
            })
            if (res.ok) toast.success("Akun Kepala Sekolah & Pengawas berhasil disimpan!")
            else toast.error("Gagal menyimpan")
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setSaving(false)
        }
    }

    // Fetch mapel for selected class
    const fetchMapelKelas = async (kelas: number) => {
        try {
            const res = await fetch(`/api/settings/mapel?kelas=${kelas}`)
            if (res.ok) {
                const data = await res.json()
                setMapelList(data)
            }
        } catch {
            console.error("Failed to fetch mapel")
        }
    }

    useEffect(() => {
        if (isAdmin) fetchMapelKelas(mapelKelas)
    }, [isAdmin, mapelKelas])

    const updateMapelName = (code: string, newName: string) => {
        setMapelList(prev => prev.map(m => m.code === code ? { ...m, name: newName } : m))
    }

    const handleSaveMapel = async () => {
        if (!isAdmin) return
        setSaving(true)
        try {
            const res = await fetch("/api/settings/mapel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kelas: mapelKelas, mapelList }),
            })
            if (res.ok) toast.success(`Nama mapel Kelas ${mapelKelas} berhasil disimpan!`)
            else toast.error("Gagal menyimpan")
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setSaving(false)
        }
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

            {/* Kepala Sekolah & Pengawas Accounts */}
            <div className="turbo-card p-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border)]">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-100">
                        👑
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Akun Kepala Sekolah, Pengawas & Guru Mapel</h2>
                        <p className="text-sm text-[var(--accents-5)]">Kelola akun login untuk peran khusus</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {specialAccounts.filter(a => ["kepsek", "pengawas"].includes(a.role)).map((account) => (
                        <div key={account.role} className="border border-[var(--border)] rounded-xl p-6 bg-[var(--accents-1)]/30">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${account.role === "kepsek" ? "bg-emerald-100 text-emerald-600" : "bg-purple-100 text-purple-600"}`}>
                                    {account.role === "kepsek" ? "🏫" : "👁️"}
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-[var(--foreground)]">
                                        {account.role === "kepsek" ? "Kepala Sekolah" : "Pengawas"}
                                    </h3>
                                    <p className="text-xs text-[var(--accents-5)]">Akses dashboard monitoring</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <MiniField
                                    label="Nama Lengkap"
                                    placeholder="Nama Lengkap"
                                    value={account.name}
                                    onChange={(v) => updateSpecialAccount(account.id || account.role, "name", v)}
                                />
                                <MiniField
                                    label="Username"
                                    placeholder="username"
                                    value={account.username}
                                    onChange={(v) => updateSpecialAccount(account.id || account.role, "username", v)}
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                                />
                                <MiniField
                                    label="Password Baru"
                                    placeholder="Kosongkan jika tidak diubah..."
                                    type="password"
                                    value={account.password || ""}
                                    onChange={(v) => updateSpecialAccount(account.id || account.role, "password", v)}
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Guru Mapel List */}
                    {specialAccounts.filter(a => a.role === "guru_mapel").map((account, idx) => (
                        <div key={account.id || `gm-${idx}`} className="border border-[var(--border)] rounded-xl p-6 bg-[var(--accents-1)]/30">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-lg">
                                    🎓
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-[var(--foreground)]">
                                        Guru Mapel
                                    </h3>
                                    <p className="text-xs text-[var(--accents-5)]">Akses absensi & nilai semua kelas</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <MiniField
                                    label="Nama Lengkap"
                                    placeholder="Nama Lengkap"
                                    value={account.name}
                                    onChange={(v) => updateSpecialAccount(account.id, "name", v)}
                                />
                                <MiniField
                                    label="NIP"
                                    placeholder="NIP / NUPTK"
                                    value={account.nip || ""}
                                    onChange={(v) => updateSpecialAccount(account.id, "nip", v)}
                                />
                                <MiniField
                                    label="Username"
                                    placeholder="username"
                                    value={account.username}
                                    onChange={(v) => updateSpecialAccount(account.id, "username", v)}
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                                />
                                <MiniField
                                    label="Password Baru"
                                    placeholder="Kosongkan jika tidak diubah..."
                                    type="password"
                                    value={account.password || ""}
                                    onChange={(v) => updateSpecialAccount(account.id, "password", v)}
                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button onClick={handleSaveSpecial} disabled={saving} className="h-10 px-6 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {saving ? "Menyimpan..." : "Simpan Akun Khusus"}
                    </button>
                </div>
            </div>

            {/* Mapel Configuration per Class */}
            <div className="turbo-card p-8">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-[var(--border)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xl border border-amber-100">
                            📚
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--foreground)]">Nama Mata Pelajaran per Kelas</h2>
                            <p className="text-sm text-[var(--accents-5)]">Edit nama mapel untuk setiap kelas</p>
                        </div>
                    </div>
                    <div className="relative">
                        <select
                            value={mapelKelas}
                            onChange={(e) => setMapelKelas(Number(e.target.value))}
                            className="h-10 pl-4 pr-10 bg-white border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none"
                        >
                            {[1, 2, 3, 4, 5, 6].map((k) => (
                                <option key={k} value={k}>Kelas {k}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accents-5)]">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mapelList.map((mapel) => (
                        <div key={mapel.code} className={`border rounded-lg p-4 ${mapel.isCustom ? 'border-amber-300 bg-amber-50/50' : 'border-[var(--border)]'}`}>
                            <label className="block text-xs font-semibold text-[var(--accents-5)] mb-1.5 uppercase tracking-wider">
                                {mapel.code}
                            </label>
                            <input
                                type="text"
                                value={mapel.name}
                                onChange={(e) => updateMapelName(mapel.code, e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                placeholder={mapel.code}
                            />
                            {mapel.isCustom && (
                                <span className="text-xs text-amber-600 mt-1 block">✏️ Custom</span>
                            )}
                        </div>
                    ))}
                </div>

                {mapelList.length === 0 && (
                    <div className="text-center text-[var(--accents-5)] py-8">
                        Tidak ada mata pelajaran untuk kelas ini
                    </div>
                )}

                <div className="mt-8 flex justify-end">
                    <button onClick={handleSaveMapel} disabled={saving} className="h-10 px-6 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {saving ? "Menyimpan..." : `Simpan Mapel Kelas ${mapelKelas}`}
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
