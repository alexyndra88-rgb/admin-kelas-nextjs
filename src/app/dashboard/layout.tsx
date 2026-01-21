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
    { href: "/dashboard/rekap-absensi", icon: "calendar-check", label: "Rekap Kehadiran" },
    { href: "/dashboard/rekap-nilai", icon: "document-report", label: "Rekap Nilai" },
    { href: "/dashboard/pengaturan", icon: "cog", label: "Pengaturan" },
]

function Icon({ name, className, strokeWidth = 2 }: { name: string; className?: string; strokeWidth?: number }) {
    const icons: Record<string, React.ReactNode> = {
        home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
        users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
        "clipboard-check": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
        "chart-line": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />,
        book: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
        "calendar-check": <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9 14l2 2 4-4" /></>,
        "document-report": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        cog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
        logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
        menu: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M4 6h16M4 12h16M4 18h16" />,
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
        <div className="min-h-screen flex bg-[#f3f4f6]">
            {/* Sidebar - Turbopack Style */}
            <aside className={`fixed inset-y-0 left-0 w-64 turbo-sidebar z-50 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-5 border-b border-[var(--border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold">
                                <Icon name="book" className="w-4 h-4" />
                            </div>
                            <div>
                                <h1 className="font-bold text-sm text-[var(--foreground)] tracking-tight">Andris4Edu</h1>
                                <p className="text-[11px] text-[var(--accents-5)]">Admin Kelas</p>
                            </div>
                        </div>

                        {/* Class Selector - Minimalist */}
                        <div className="mt-5">
                            {isAdmin && (
                                <div className="relative">
                                    <select
                                        value={currentKelas}
                                        onChange={(e) => setCurrentKelas(Number(e.target.value))}
                                        className="w-full bg-[var(--accents-1)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-black appearance-none cursor-pointer"
                                    >
                                        {[1, 2, 3, 4, 5, 6].map((k) => (
                                            <option key={k} value={k}>Kelas {k}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-2 pointer-events-none text-[var(--accents-5)]">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            )}
                            {!isAdmin && (
                                <div className="px-3 py-1.5 bg-[var(--accents-2)] rounded-md text-xs font-medium text-[var(--accents-6)] border border-[var(--border)] inline-block">
                                    Kelas {currentKelas}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-0.5">
                        <p className="px-3 text-[10px] font-semibold text-[var(--accents-5)] uppercase mb-2">Menu</p>
                        {menuItems.map((item) => {
                            if (item.label === "Pengaturan" && !isAdmin) return null;

                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive
                                        ? "bg-[var(--accents-2)] text-black"
                                        : "text-[var(--accents-5)] hover:bg-[var(--accents-1)] hover:text-black"
                                        }`}
                                >
                                    <Icon name={item.icon} className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[var(--accents-4)]'}`} strokeWidth={2} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Profile - Minimal */}
                    <div className="p-4 border-t border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-[var(--accents-6)]">
                                {session.user.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--foreground)] truncate">{session.user.name}</p>
                                <p className="text-[10px] text-[var(--accents-5)] capitalize">{session.user.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--accents-5)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <Icon name="logout" className="w-3.5 h-3.5" />
                            Log Out
                        </button>
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
                className="fixed top-4 right-4 z-50 lg:hidden w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-black"
            >
                <Icon name={sidebarOpen ? "logout" : "menu"} className="w-5 h-5" />
            </button>

            {/* Main content */}
            <main className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-64'}`}>
                <div className="max-w-7xl mx-auto p-6 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    )
}





