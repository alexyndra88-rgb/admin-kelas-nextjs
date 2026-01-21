import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET nilai for a class, mapel, and jenisNilai
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const kelas = parseInt(searchParams.get("kelas") || "5")
        const mapel = searchParams.get("mapel")
        const jenisNilai = searchParams.get("jenisNilai")

        if (!mapel || !jenisNilai) {
            return NextResponse.json({ error: "Mapel and jenisNilai required" }, { status: 400 })
        }

        const nilai = await prisma.nilai.findMany({
            where: {
                siswa: { kelas },
                mapel,
                jenisNilai,
            },
            select: {
                siswaId: true,
                nilai: true,
            },
        })

        return NextResponse.json(nilai)
    } catch (error) {
        console.error("Error fetching nilai:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST save nilai
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { entries } = await request.json()

        for (const entry of entries) {
            await prisma.nilai.upsert({
                where: {
                    siswaId_mapel_jenisNilai: {
                        siswaId: entry.siswaId,
                        mapel: entry.mapel,
                        jenisNilai: entry.jenisNilai,
                    },
                },
                update: { nilai: entry.nilai },
                create: {
                    siswaId: entry.siswaId,
                    mapel: entry.mapel,
                    jenisNilai: entry.jenisNilai,
                    nilai: entry.nilai,
                },
            })
        }

        return NextResponse.json({ message: "Nilai saved" })
    } catch (error) {
        console.error("Error saving nilai:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
