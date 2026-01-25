"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface ActivityLog {
    id: string
    action: string
    details: string
    metadata: string | null
    ipAddress: string | null
    createdAt: string
    user: {
        name: string
        username: string
        role: string
    }
}

interface Pagination {
    total: number
    page: number
    limit: number
    totalPages: number
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    LOGIN: { label: "Login", color: "bg-blue-100 text-blue-700", icon: "🔑" },
    LOGOUT: { label: "Logout", color: "bg-gray-100 text-gray-700", icon: "🚪" },
    CREATE: { label: "Tambah", color: "bg-emerald-100 text-emerald-700", icon: "➕" },
    UPDATE: { label: "Update", color: "bg-amber-100 text-amber-700", icon: "✏️" },
    DELETE: { label: "Hapus", color: "bg-red-100 text-red-700", icon: "🗑️" },
    EXPORT: { label: "Export", color: "bg-purple-100 text-purple-700", icon: "📤" },
    IMPORT: { label: "Import", color: "bg-cyan-100 text-cyan-700", icon: "📥" },
    RESET: { label: "Reset", color: "bg-red-100 text-red-700", icon: "⚠️" },
    BACKUP: { label: "Backup", color: "bg-indigo-100 text-indigo-700", icon: "💾" },
}

export default function ActivityLogPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const isAdmin = session?.user?.role === "admin"

    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [filterAction, setFilterAction] = useState("")

    useEffect(() => {
        if (session && !isAdmin) {
            toast.error("Akses ditolak. Hanya admin.")
            router.push("/dashboard")
        }
    }, [session, isAdmin, router])

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "30" })
            if (filterAction) params.set("action", filterAction)

            const res = await fetch(`/api/activity-log?${params}`)
            if (res.ok) {
                const data = await res.json()
                setLogs(data.logs)
                setPagination(data.pagination)
            }
        } catch {
            toast.error("Gagal memuat log aktivitas")
        } finally {
            setLoading(false)
        }
    }, [page, filterAction])

    useEffect(() => {
        if (isAdmin) fetchLogs()
    }, [isAdmin, fetchLogs])

    const handleClearOldLogs = async (days: number) => {
        if (!confirm(`Hapus semua log yang lebih dari ${days} hari?\n\nAksi ini tidak dapat dibatalkan.`)) return

        try {
            const res = await fetch(`/api/activity-log?daysOld=${days}`, { method: "DELETE" })
            const result = await res.json()
            if (res.ok) {
                toast.success(result.message)
                fetchLogs()
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Gagal menghapus log")
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getActionDisplay = (action: string) => {
        return ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-600", icon: "📝" }
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <span className="text-6xl">🔒</span>
                    <h2 className="text-xl font-bold mt-4">Akses Ditolak</h2>
                    <p className="text-[var(--accents-5)] mt-2">Hanya admin yang bisa mengakses halaman ini</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">📋 Log Aktivitas</h1>
                    <p className="text-sm text-[var(--accents-5)] mt-1">
                        Pantau semua aktivitas pengguna di sistem
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={filterAction}
                        onChange={(e) => { setFilterAction(e.target.value); setPage(1) }}
                        className="h-9 px-3 bg-white border border-[var(--border)] rounded-md text-sm outline-none"
                    >
                        <option value="">Semua Aksi</option>
                        {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <div className="relative group">
                        <button className="h-9 px-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors">
                            🗑️ Bersihkan
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 hidden group-hover:block z-10 min-w-[160px]">
                            <button
                                onClick={() => handleClearOldLogs(7)}
                                className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accents-1)] rounded"
                            >
                                Hapus &gt; 7 hari
                            </button>
                            <button
                                onClick={() => handleClearOldLogs(30)}
                                className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accents-1)] rounded"
                            >
                                Hapus &gt; 30 hari
                            </button>
                            <button
                                onClick={() => handleClearOldLogs(90)}
                                className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accents-1)] rounded"
                            >
                                Hapus &gt; 90 hari
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {pagination && (
                <div className="flex items-center gap-4 text-sm text-[var(--accents-5)]">
                    <span>Total: <strong className="text-[var(--foreground)]">{pagination.total}</strong> log</span>
                    <span>•</span>
                    <span>Halaman {pagination.page} dari {pagination.totalPages}</span>
                </div>
            )}

            {/* Log Table */}
            <div className="turbo-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--accents-1)]">
                                <th className="px-4 py-3 text-left font-medium text-[var(--accents-5)]">Waktu</th>
                                <th className="px-4 py-3 text-left font-medium text-[var(--accents-5)]">User</th>
                                <th className="px-4 py-3 text-left font-medium text-[var(--accents-5)]">Aksi</th>
                                <th className="px-4 py-3 text-left font-medium text-[var(--accents-5)]">Detail</th>
                                <th className="px-4 py-3 text-left font-medium text-[var(--accents-5)]">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-[var(--accents-5)]">
                                        Memuat log aktivitas...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-[var(--accents-5)]">
                                        <span className="text-4xl block mb-2">📭</span>
                                        Belum ada log aktivitas
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const actionDisplay = getActionDisplay(log.action)
                                    return (
                                        <tr key={log.id} className="hover:bg-[var(--accents-1)] transition-colors">
                                            <td className="px-4 py-3 text-[var(--accents-5)] whitespace-nowrap text-xs">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-xs font-bold text-blue-700">
                                                        {log.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[var(--foreground)] text-sm">{log.user.name}</p>
                                                        <p className="text-xs text-[var(--accents-5)]">{log.user.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${actionDisplay.color}`}>
                                                    {actionDisplay.icon} {actionDisplay.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[var(--foreground)] max-w-[300px] truncate">
                                                {log.details || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-[var(--accents-5)] text-xs font-mono">
                                                {log.ipAddress || "-"}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm border border-[var(--border)] rounded hover:bg-[var(--accents-1)] disabled:opacity-50"
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const pageNum = i + 1
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`px-3 py-1 text-sm border rounded ${page === pageNum ? 'bg-black text-white border-black' : 'border-[var(--border)] hover:bg-[var(--accents-1)]'}`}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className="px-3 py-1 text-sm border border-[var(--border)] rounded hover:bg-[var(--accents-1)] disabled:opacity-50"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
