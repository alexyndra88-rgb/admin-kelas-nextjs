import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET database statistics and info
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get counts for all tables
        const [
            siswaCount,
            absensiCount,
            nilaiCount,
            jurnalCount,
            bukuCount,
            asetCount,
            userCount
        ] = await Promise.all([
            prisma.siswa.count(),
            prisma.absensi.count(),
            prisma.nilai.count(),
            prisma.jurnal.count(),
            prisma.buku.count(),
            prisma.aset.count(),
            prisma.user.count()
        ])

        // Get date ranges
        const oldestAbsensi = await prisma.absensi.findFirst({
            orderBy: { tanggal: 'asc' },
            select: { tanggal: true }
        })

        const newestAbsensi = await prisma.absensi.findFirst({
            orderBy: { tanggal: 'desc' },
            select: { tanggal: true }
        })

        return NextResponse.json({
            counts: {
                siswa: siswaCount,
                absensi: absensiCount,
                nilai: nilaiCount,
                jurnal: jurnalCount,
                buku: bukuCount,
                aset: asetCount,
                user: userCount
            },
            dateRanges: {
                absensi: {
                    oldest: oldestAbsensi?.tanggal || null,
                    newest: newestAbsensi?.tanggal || null
                }
            }
        })
    } catch (error) {
        console.error("Error fetching database info:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Perform database maintenance operations
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { action, options } = await request.json()

        switch (action) {
            case "reset-absensi": {
                // Reset all attendance data
                const deleted = await prisma.absensi.deleteMany({})
                return NextResponse.json({
                    success: true,
                    message: `${deleted.count} data absensi berhasil dihapus`
                })
            }

            case "reset-absensi-year": {
                // Reset attendance for specific year
                const year = options?.year
                if (!year) {
                    return NextResponse.json({ error: "Tahun harus diisi" }, { status: 400 })
                }

                const startDate = new Date(`${year}-01-01`)
                const endDate = new Date(`${year}-12-31`)

                const deleted = await prisma.absensi.deleteMany({
                    where: {
                        tanggal: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                })
                return NextResponse.json({
                    success: true,
                    message: `${deleted.count} data absensi tahun ${year} berhasil dihapus`
                })
            }

            case "reset-nilai": {
                // Reset all grades
                const deleted = await prisma.nilai.deleteMany({})
                return NextResponse.json({
                    success: true,
                    message: `${deleted.count} data nilai berhasil dihapus`
                })
            }

            case "reset-jurnal": {
                // Reset all journals
                const deleted = await prisma.jurnal.deleteMany({})
                return NextResponse.json({
                    success: true,
                    message: `${deleted.count} data jurnal berhasil dihapus`
                })
            }

            case "export-backup": {
                // Export all data as JSON backup
                const [
                    siswa,
                    absensi,
                    nilai,
                    jurnal,
                    buku,
                    aset,
                    waliKelas,
                    schoolSettings,
                    mapelKelas
                ] = await Promise.all([
                    prisma.siswa.findMany(),
                    prisma.absensi.findMany(),
                    prisma.nilai.findMany(),
                    prisma.jurnal.findMany(),
                    prisma.buku.findMany(),
                    prisma.aset.findMany(),
                    prisma.waliKelas.findMany(),
                    prisma.schoolSettings.findFirst(),
                    prisma.mapelKelas.findMany()
                ])

                const backup = {
                    exportDate: new Date().toISOString(),
                    version: "1.0",
                    data: {
                        siswa,
                        absensi,
                        nilai,
                        jurnal,
                        buku,
                        aset,
                        waliKelas,
                        schoolSettings,
                        mapelKelas
                    }
                }

                return NextResponse.json(backup)
            }

            case "naik-kelas": {
                // Promote all students to next grade
                // Students in grade 6 will be "graduated" (deleted or marked)

                // First, delete grade 6 students (they graduate)
                const graduated = await prisma.siswa.deleteMany({
                    where: { kelas: 6 }
                })

                // Then promote grades 1-5 to 2-6
                for (let grade = 5; grade >= 1; grade--) {
                    await prisma.siswa.updateMany({
                        where: { kelas: grade },
                        data: { kelas: grade + 1 }
                    })
                }

                return NextResponse.json({
                    success: true,
                    message: `Proses naik kelas berhasil. ${graduated.count} siswa kelas 6 telah lulus.`
                })
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }
    } catch (error) {
        console.error("Error performing database maintenance:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
