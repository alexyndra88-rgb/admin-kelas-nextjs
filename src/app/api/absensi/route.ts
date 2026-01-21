import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET absensi for a class and date
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const kelas = parseInt(searchParams.get("kelas") || "5")
        const tanggal = searchParams.get("tanggal")

        if (!tanggal) {
            return NextResponse.json({ error: "Tanggal required" }, { status: 400 })
        }

        const absensi = await prisma.absensi.findMany({
            where: {
                siswa: { kelas },
                tanggal: new Date(tanggal),
            },
            select: {
                siswaId: true,
                status: true,
            },
        })

        return NextResponse.json(absensi)
    } catch (error) {
        console.error("Error fetching absensi:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST save absensi
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { entries } = await request.json()

        for (const entry of entries) {
            await prisma.absensi.upsert({
                where: {
                    siswaId_tanggal: {
                        siswaId: entry.siswaId,
                        tanggal: new Date(entry.tanggal),
                    },
                },
                update: { status: entry.status },
                create: {
                    siswaId: entry.siswaId,
                    tanggal: new Date(entry.tanggal),
                    status: entry.status,
                },
            })
        }

        return NextResponse.json({ message: "Absensi saved" })
    } catch (error) {
        console.error("Error saving absensi:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
