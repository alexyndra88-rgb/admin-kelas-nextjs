import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const waliKelas = await prisma.waliKelas.findMany({
            orderBy: { kelas: "asc" },
        })
        return NextResponse.json(waliKelas)
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { waliKelas } = await request.json()

        for (const wali of waliKelas) {
            await prisma.waliKelas.upsert({
                where: { kelas: wali.kelas },
                update: { nama: wali.nama, nip: wali.nip },
                create: { kelas: wali.kelas, nama: wali.nama, nip: wali.nip },
            })
        }

        return NextResponse.json({ message: "Saved" })
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
