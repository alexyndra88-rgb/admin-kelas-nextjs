import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET teacher attendance by date
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const tanggal = searchParams.get("tanggal")
        const bulan = searchParams.get("bulan") // Format: YYYY-MM

        if (tanggal) {
            // Daily attendance
            const attendance = await prisma.absensiGuru.findMany({
                where: {
                    tanggal: new Date(tanggal)
                }
            })

            // Get user names
            const userIds = attendance.map(a => a.userId)
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true }
            })

            const result = attendance.map(a => ({
                userId: a.userId,
                userName: users.find(u => u.id === a.userId)?.name || "",
                waktuDatang: a.waktuDatang || "",
                ttdDatang: a.ttdDatang || "",
                waktuPulang: a.waktuPulang || "",
                ttdPulang: a.ttdPulang || "",
            }))

            return NextResponse.json(result)
        }

        if (bulan) {
            // Monthly recap
            const [year, month] = bulan.split("-").map(Number)
            const startDate = new Date(year, month - 1, 1)
            const endDate = new Date(year, month, 0)

            const attendance = await prisma.absensiGuru.findMany({
                where: {
                    tanggal: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            })

            return NextResponse.json(attendance)
        }

        return NextResponse.json({ error: "Missing tanggal or bulan parameter" }, { status: 400 })
    } catch (error) {
        console.error("Error fetching teacher attendance:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST save/update teacher attendance
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { tanggal, attendance } = await request.json()

        if (!tanggal || !Array.isArray(attendance)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 })
        }

        const dateObj = new Date(tanggal)

        for (const att of attendance) {
            const { userId, waktuDatang, ttdDatang, waktuPulang, ttdPulang } = att

            await prisma.absensiGuru.upsert({
                where: {
                    userId_tanggal: { userId, tanggal: dateObj }
                },
                update: {
                    waktuDatang: waktuDatang || null,
                    ttdDatang: ttdDatang || null,
                    waktuPulang: waktuPulang || null,
                    ttdPulang: ttdPulang || null,
                },
                create: {
                    userId,
                    tanggal: dateObj,
                    waktuDatang: waktuDatang || null,
                    ttdDatang: ttdDatang || null,
                    waktuPulang: waktuPulang || null,
                    ttdPulang: ttdPulang || null,
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving teacher attendance:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
