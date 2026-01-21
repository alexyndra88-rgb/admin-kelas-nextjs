import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET jurnal for a class
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const kelas = parseInt(searchParams.get("kelas") || "5")

        const jurnal = await prisma.jurnal.findMany({
            where: { kelas },
            orderBy: { tanggal: "desc" },
        })

        return NextResponse.json(jurnal)
    } catch (error) {
        console.error("Error fetching jurnal:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST create jurnal
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { tanggal, jamKe, mapel, materi, metode, catatan, siswaAbsen, kelas } = body

        const jurnal = await prisma.jurnal.create({
            data: {
                tanggal: new Date(tanggal),
                jamKe,
                mapel,
                materi,
                metode,
                catatan,
                siswaAbsen,
                kelas: parseInt(kelas),
            },
        })

        return NextResponse.json(jurnal, { status: 201 })
    } catch (error) {
        console.error("Error creating jurnal:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
