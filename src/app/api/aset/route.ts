import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List all aset (all roles)
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const aset = await prisma.aset.findMany({
            orderBy: { namaAset: "asc" }
        })

        return NextResponse.json(aset)
    } catch (error) {
        console.error("Error fetching aset:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Create new aset (admin only)
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
        const {
            namaAset, kib, kategori, jumlah, kondisi, lokasi,
            tahunPerolehan, sumberDana, hargaPerolehan,
            nilaiPerUnit, buktiKepemilikan, tanggalBeli, keterangan
        } = body

        if (!namaAset || !kib || !kategori || !kondisi || !tahunPerolehan || !sumberDana || hargaPerolehan === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const aset = await prisma.aset.create({
            data: {
                namaAset,
                kib,
                kategori,
                jumlah: jumlah || 1,
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

        return NextResponse.json(aset, { status: 201 })
    } catch (error) {
        console.error("Error creating aset:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
