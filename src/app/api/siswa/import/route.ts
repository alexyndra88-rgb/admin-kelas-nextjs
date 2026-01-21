import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST import multiple students
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { students, kelas, replace } = await request.json()

        if (!Array.isArray(students) || students.length === 0) {
            return NextResponse.json({ error: "No data to import" }, { status: 400 })
        }

        // If replace, delete existing students in this class
        if (replace) {
            await prisma.siswa.deleteMany({ where: { kelas: parseInt(kelas) } })
        }

        // Prepare data
        const data = students.map((s: { nis: string; nama: string; jenisKelamin: string; alamat?: string; namaOrtu?: string; noHp?: string }) => ({
            nis: String(s.nis),
            nama: String(s.nama),
            jenisKelamin: String(s.jenisKelamin || "L").toUpperCase(),
            kelas: parseInt(kelas),
            alamat: s.alamat || null,
            namaOrtu: s.namaOrtu || null,
            noHp: s.noHp || null,
        }))

        // Create many
        const result = await prisma.siswa.createMany({
            data,
            skipDuplicates: true,
        })

        return NextResponse.json({
            message: `${result.count} siswa berhasil diimport`,
            count: result.count
        })
    } catch (error) {
        console.error("Error importing siswa:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
