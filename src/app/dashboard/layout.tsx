"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const menuItems = [
    { href: "/dashboard", icon: "home", label: "Dashboard" },
    { href: "/dashboard/siswa", icon: "users", label: "Data Siswa" },
    { href: "/dashboard/absensi", icon: "clipboard-check", label: "Daftar Hadir" },
    { href: "/dashboard/nilai", icon: "chart-line", label: "Daftar Nilai" },
    { href: "/dashboard/jurnal", icon: "book", label: "Jurnal Harian" },
    { href: "/dashboard/pengaturan", icon: "cog", label: "Pengaturan" },
]

function Icon({ name, className }: { name: string; className?: string }) {
    const icons: Record<string, React.ReactNode> = {
        home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
        users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
        "clipboard-check": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
        "chart-line": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />,
        book: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
        cog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
        logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
        menu: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />,
    }
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icons[name]}
        </svg>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [currentKelas, setCurrentKelas] = useState<number>(5)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
        if (session?.user?.kelas) {
            setCurrentKelas(session.user.kelas)
        }
    }, [status, session, router])

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#667eea] border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (!session) return null

    const isAdmin = session.user.role === "admin"

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1a1a2e] border-r border-white/10 z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                                <Icon name="book" className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2]">
                                    SDN 2 Nangerang
                                </h1>
                            </div>
                        </div>
                        {/* Class Selector */}
                        {isAdmin && (
                            <select
                                value={currentKelas}
                                onChange={(e) => setCurrentKelas(Number(e.target.value))}
                                className="mt-4 w-full px-3 py-2 bg-[#16213e] border-2 border-[#667eea] rounded-lg text-white font-semibold cursor-pointer"
                            >
                                {[1, 2, 3, 4, 5, 6].map((k) => (
                                    <option key={k} value={k}>Kelas {k}</option>
                                ))}
                            </select>
                        )}
                        {!isAdmin && (
                            <div className="mt-4 px-3 py-2 bg-[#16213e] border border-white/10 rounded-lg text-center">
                                <span className="font-semibold">Kelas {currentKelas}</span>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg"
                                            : "text-[#a0a0b0] hover:bg-[#16213e] hover:text-white"
                                        }`}
                                >
                                    <Icon name={item.icon} className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10">
                        <div className="mb-3 px-4 py-2">
                            <p className="text-sm text-[#a0a0b0]">Login sebagai:</p>
                            <p className="font-semibold truncate">{session.user.name}</p>
                            <p className="text-xs text-[#667eea]">{session.user.role}</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex items-center gap-3 w-full px-4 py-3 text-[#a0a0b0] hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
                        >
                            <Icon name="logout" className="w-5 h-5" />
                            <span className="font-medium">Keluar</span>
                        </button>
                        <p className="mt-4 text-center text-xs text-[#a0a0b0]">
                            Tahun Ajaran 2025/2026
                        </p>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden w-11 h-11 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center shadow-lg"
            >
                <Icon name="menu" className="w-6 h-6" />
            </button>

            {/* Main content */}
            <main className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8">
                {children}
            </main>
        </div>
    )
}
