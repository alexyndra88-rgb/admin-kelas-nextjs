import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MAPEL_CONFIG } from "@/lib/mapelConfig"

// GET mapel configuration for a class (with custom names)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const kelas = parseInt(searchParams.get("kelas") || "0")

        // Get default mapel for this class
        const defaultMapel = MAPEL_CONFIG.filter(m => m.classes.includes(kelas))

        // Get custom names from database
        const customNames = await prisma.mapelKelas.findMany({
            where: { kelas },
        })

        // Merge: use custom name if exists, otherwise use default
        const result = defaultMapel.map(m => {
            const custom = customNames.find(c => c.mapelCode === m.name)
            return {
                code: m.name,
                name: custom?.namaMapel || m.name,
                isCustom: !!custom,
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching mapel config:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST update mapel names for a class (admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { kelas, mapelList } = await request.json()

        if (!kelas || !Array.isArray(mapelList)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 })
        }

        // Update or create custom names for each mapel
        for (const mapel of mapelList) {
            const { code, name } = mapel

            if (name === code) {
                // If name matches code, delete custom entry (use default)
                await prisma.mapelKelas.deleteMany({
                    where: { kelas, mapelCode: code }
                })
            } else {
                // Create or update custom name
                await prisma.mapelKelas.upsert({
                    where: {
                        kelas_mapelCode: { kelas, mapelCode: code }
                    },
                    update: { namaMapel: name },
                    create: {
                        kelas,
                        mapelCode: code,
                        namaMapel: name,
                    }
                })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating mapel config:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
