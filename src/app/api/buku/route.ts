import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List all buku (all roles)
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const buku = await prisma.buku.findMany({
            orderBy: { judul: "asc" }
        })

        return NextResponse.json(buku)
    } catch (error) {
        console.error("Error fetching buku:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Create new buku (admin only)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { judul, penulis, penerbit, tahunTerbit, isbn, kategori, kelas, jumlahCopy, lokasi } = body

        if (!judul || !penulis || !kategori) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const buku = await prisma.buku.create({
            data: {
                judul,
                penulis,
                penerbit,
                tahunTerbit,
                isbn,
                kategori,
                kelas,
                jumlahCopy: jumlahCopy || 1,
                lokasi
            }
        })

        return NextResponse.json(buku, { status: 201 })
    } catch (error) {
        console.error("Error creating buku:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
