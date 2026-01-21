"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"

export default function DashboardPage() {
    const { data: session } = useSession()

    const quickActions = [
        { href: "/dashboard/absensi", icon: "📋", label: "Isi Absensi", color: "from-emerald-500 to-green-600" },
        { href: "/dashboard/nilai", icon: "📝", label: "Input Nilai", color: "from-amber-500 to-orange-600" },
        { href: "/dashboard/jurnal", icon: "📖", label: "Tulis Jurnal", color: "from-blue-500 to-cyan-600" },
    ]

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2]">🏠</span>
                    Dashboard
                </h1>
                <p className="text-[#a0a0b0] mt-2">
                    Selamat datang, <span className="text-white font-semibold">{session?.user?.name}</span>!
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    icon="👨‍🎓"
                    value="-"
                    label="Total Siswa"
                    gradient="from-[#667eea] to-[#764ba2]"
                />
                <StatCard
                    icon="✅"
                    value="-"
                    label="Hadir Hari Ini"
                    gradient="from-emerald-500 to-green-600"
                />
                <StatCard
                    icon="❌"
                    value="-"
                    label="Tidak Hadir"
                    gradient="from-pink-500 to-red-500"
                />
                <StatCard
                    icon="📖"
                    value="-"
                    label="Jurnal Tercatat"
                    gradient="from-blue-500 to-cyan-600"
                />
            </div>

            {/* Quick Actions */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="text-[#667eea]">⚡</span> Aksi Cepat
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group p-6 bg-[#16213e] border border-white/10 rounded-xl hover:border-[#667eea] transition-all hover:-translate-y-1"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-4xl">{action.icon}</span>
                                <span className="font-semibold">{action.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-[#16213e] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="text-[#667eea]">ℹ️</span> Informasi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-[#1a1a2e] rounded-lg">
                        <span className="text-2xl">🏫</span>
                        <div>
                            <p className="text-sm text-[#a0a0b0]">Kepala Sekolah</p>
                            <p className="font-semibold">-</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[#1a1a2e] rounded-lg">
                        <span className="text-2xl">👩‍🏫</span>
                        <div>
                            <p className="text-sm text-[#a0a0b0]">Wali Kelas</p>
                            <p className="font-semibold">-</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, value, label, gradient }: { icon: string; value: string | number; label: string; gradient: string }) {
    return (
        <div className="bg-[#16213e] border border-white/10 rounded-xl p-6 hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}>
                    {icon}
                </div>
                <div>
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="text-[#a0a0b0] text-sm">{label}</p>
                </div>
            </div>
        </div>
    )
}
