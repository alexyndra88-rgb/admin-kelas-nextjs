import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Update buku (admin only)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { judul, penulis, penerbit, tahunTerbit, isbn, kategori, kelas, jumlahCopy, lokasi } = body

        const buku = await prisma.buku.update({
            where: { id },
            data: {
                judul,
                penulis,
                penerbit,
                tahunTerbit,
                isbn,
                kategori,
                kelas,
                jumlahCopy,
                lokasi
            }
        })

        return NextResponse.json(buku)
    } catch (error) {
        console.error("Error updating buku:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE - Delete buku (admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        await prisma.buku.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting buku:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
