import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Update aset (admin only)
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
        const {
            namaAset, kib, kategori, jumlah, kondisi, lokasi,
            tahunPerolehan, sumberDana, hargaPerolehan,
            nilaiPerUnit, buktiKepemilikan, tanggalBeli, keterangan
        } = body

        const aset = await prisma.aset.update({
            where: { id },
            data: {
                namaAset,
                kib,
                kategori,
                jumlah,
                kondisi,
                lokasi,
                tahunPerolehan: parseInt(tahunPerolehan),
                sumberDana,
                hargaPerolehan: parseFloat(hargaPerolehan),
                nilaiPerUnit: nilaiPerUnit ? parseFloat(nilaiPerUnit) : null,
                buktiKepemilikan,
                tanggalBeli: tanggalBeli ? new Date(tanggalBeli) : null,
                keterangan
            }
        })

        return NextResponse.json(aset)
    } catch (error) {
        console.error("Error updating aset:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE - Delete aset (admin only)
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
        await prisma.aset.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting aset:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
