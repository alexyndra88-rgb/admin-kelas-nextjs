"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"

interface RekapSiswa {
    id: string
    nis: string
    nama: string
    hadir: number
    sakit: number
    izin: number
    alpha: number
    totalRecorded: number
    totalSchoolDays: number
    percentage: number
}

interface RekapMeta {
    startDate: string
    endDate: string
    totalSchoolDays: number
    holidaysInPeriod?: string[]
    type: string
    month?: number
    semester?: number
    year: number
    kelas: number
}

const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export default function RekapAbsensiPage() {
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === "admin"
    const userKelas = session?.user?.kelas

    const [recap, setRecap] = useState<RekapSiswa[]>([])
    const [meta, setMeta] = useState<RekapMeta | null>(null)
    const [loading, setLoading] = useState(false)
    const [kelas, setKelas] = useState(userKelas || 5)
    const [type, setType] = useState<"month" | "semester">("month")
    const [month, setMonth] = useState(new Date().getMonth())
    const [year, setYear] = useState(new Date().getFullYear())
    const [semester, setSemester] = useState(2) // Semester 2 mulai 12 Jan 2026

    useEffect(() => {
        if (!isAdmin && userKelas) {
            setKelas(userKelas)
        }
    }, [isAdmin, userKelas])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                kelas: kelas.toString(),
                type,
                month: month.toString(),
                year: year.toString(),
                semester: semester.toString(),
            })
            const res = await fetch(`/api/rekap/absensi?${params}`, { cache: "no-store" })
            const data = await res.json()
            setRecap(data.recap)
            setMeta(data.meta)
        } catch {
            toast.error("Gagal memuat data rekap")
        } finally {
            setLoading(false)
        }
    }, [kelas, type, month, year, semester])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleExport = () => {
        if (recap.length === 0) {
            toast.error("Tidak ada data untuk diexport")
            return
        }

        const periodLabel = type === "month"
            ? `${monthNames[month]} ${year}`
            : `Semester ${semester} ${semester === 1 ? year : year - 1}/${year}`

        const data = recap.map((s, i) => ({
            No: i + 1,
            NIS: s.nis,
            "Nama Siswa": s.nama,
            Hadir: s.hadir,
            Sakit: s.sakit,
            Izin: s.izin,
            Alpha: s.alpha,
            "Total Hari Efektif": s.totalSchoolDays,
            "Persentase Kehadiran (%)": s.percentage,
        }))

        const ws = XLSX.utils.json_to_sheet(data)

        // Set column widths
        ws["!cols"] = [
            { wch: 5 },  // No
            { wch: 12 }, // NIS
            { wch: 30 }, // Nama
            { wch: 8 },  // Hadir
            { wch: 8 },  // Sakit
            { wch: 8 },  // Izin
            { wch: 8 },  // Alpha
            { wch: 18 }, // Total Hari
            { wch: 22 }, // Persentase
        ]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi")
        XLSX.writeFile(wb, `Rekap_Absensi_Kelas${kelas}_${periodLabel.replace(/\s/g, "_")}.xlsx`)
        toast.success("Data berhasil diexport!")
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Rekapitulasi Kehadiran</h1>
                    <p className="text-sm text-[var(--accents-5)] mt-1">Berdasarkan Kalender Pendidikan Kab. Purwakarta 2025/2026</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Class selector */}
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

                    {/* Type selector */}
                    <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
                        <button
                            onClick={() => setType("month")}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${type === "month" ? "bg-black text-white" : "bg-white text-[var(--foreground)] hover:bg-[var(--accents-1)]"}`}
                        >
                            Bulanan
                        </button>
                        <button
                            onClick={() => setType("semester")}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${type === "semester" ? "bg-black text-white" : "bg-white text-[var(--foreground)] hover:bg-[var(--accents-1)]"}`}
                        >
                            Semester
                        </button>
                    </div>

                    {/* Period selector */}
                    {type === "month" ? (
                        <>
                            <div className="relative">
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="h-9 pl-3 pr-8 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none"
                                >
                                    {monthNames.map((m, i) => (<option key={i} value={i}>{m}</option>))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accents-5)]">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>
                            <div className="relative">
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="h-9 pl-3 pr-8 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none"
                                >
                                    {[2024, 2025, 2026, 2027].map((y) => (<option key={y} value={y}>{y}</option>))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accents-5)]">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <select
                                    value={semester}
                                    onChange={(e) => setSemester(Number(e.target.value))}
                                    className="h-9 pl-3 pr-8 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none"
                                >
                                    <option value={1}>Semester 1</option>
                                    <option value={2}>Semester 2</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accents-5)]">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>
                            <div className="relative">
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="h-9 pl-3 pr-8 bg-white border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-black cursor-pointer appearance-none"
                                >
                                    <option value={2026}>2025/2026</option>
                                    <option value={2027}>2026/2027</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accents-5)]">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Export button */}
                    <button
                        onClick={handleExport}
                        className="h-9 px-4 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Info Card */}
            {meta && (
                <div className="turbo-card p-4">
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div>
                            <span className="text-[var(--accents-5)]">Periode:</span>{" "}
                            <span className="font-medium text-[var(--foreground)]">
                                {formatDate(meta.startDate)} - {formatDate(meta.endDate)}
                            </span>
                        </div>
                        <div>
                            <span className="text-[var(--accents-5)]">Hari Efektif:</span>{" "}
                            <span className="font-bold text-emerald-600">{meta.totalSchoolDays} hari</span>
                        </div>
                        {meta.holidaysInPeriod && meta.holidaysInPeriod.length > 0 && (
                            <div>
                                <span className="text-[var(--accents-5)]">Hari Libur:</span>{" "}
                                <span className="font-bold text-red-600">{meta.holidaysInPeriod.length} hari</span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-[var(--accents-4)] mt-2">
                        * Tidak termasuk Sabtu, Minggu, dan hari libur nasional/sekolah
                    </p>
                </div>
            )}

            {/* Table */}
            <div className="turbo-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--accents-1)]">
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] w-12">No</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] w-24">NIS</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)]">Nama Siswa</th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] text-center w-16">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />H
                                    </span>
                                </th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] text-center w-16">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />S
                                    </span>
                                </th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] text-center w-16">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />I
                                    </span>
                                </th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] text-center w-16">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />A
                                    </span>
                                </th>
                                <th className="px-4 py-3 font-medium text-[var(--accents-5)] text-center w-24">Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--accents-5)]">Memuat data...</td></tr>
                            ) : recap.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--accents-5)]">Belum ada data siswa</td></tr>
                            ) : (
                                recap.map((s, i) => (
                                    <tr key={s.id} className="hover:bg-[var(--accents-1)] transition-colors">
                                        <td className="px-4 py-3 text-[var(--accents-5)]">{i + 1}</td>
                                        <td className="px-4 py-3 text-[var(--foreground)] font-medium tabular-nums">{s.nis}</td>
                                        <td className="px-4 py-3 text-[var(--foreground)] font-medium">{s.nama}</td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-600 tabular-nums">{s.hadir}</td>
                                        <td className="px-4 py-3 text-center font-bold text-amber-600 tabular-nums">{s.sakit}</td>
                                        <td className="px-4 py-3 text-center font-bold text-blue-600 tabular-nums">{s.izin}</td>
                                        <td className="px-4 py-3 text-center font-bold text-red-600 tabular-nums">{s.alpha}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.percentage >= 90 ? "bg-emerald-100 text-emerald-800" :
                                                s.percentage >= 75 ? "bg-amber-100 text-amber-800" :
                                                    "bg-red-100 text-red-800"
                                                }`}>
                                                {s.percentage}%
                                            </span>
                                        </td>
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
