import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"

// POST - Import buku from Excel
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Parse Excel file
        const workbook = new ExcelJS.Workbook()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await workbook.xlsx.load(uint8Array as any)

        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
            return NextResponse.json({ error: "No worksheet found" }, { status: 400 })
        }

        const bukuToImport: {
            judul: string
            penulis: string
            penerbit: string | null
            tahunTerbit: number | null
            isbn: string | null
            kategori: string
            kelas: number | null
            jumlahCopy: number
            lokasi: string | null
        }[] = []

        // Skip header row (row 1), start from row 2
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return // Skip header

            const judul = row.getCell(2).value?.toString()?.trim()
            const penulis = row.getCell(3).value?.toString()?.trim()

            if (!judul || !penulis) return // Skip empty rows

            const penerbit = row.getCell(4).value?.toString()?.trim() || null
            const tahunTerbitVal = row.getCell(5).value
            const tahunTerbit = tahunTerbitVal ? parseInt(tahunTerbitVal.toString()) : null
            const isbn = row.getCell(6).value?.toString()?.trim() || null
            const kategori = row.getCell(7).value?.toString()?.trim() || "Pelajaran"

            // Parse kelas - can be "Kelas 1" or just "1"
            const kelasVal = row.getCell(8).value?.toString()?.trim()
            let kelas: number | null = null
            if (kelasVal) {
                const kelasMatch = kelasVal.match(/\d+/)
                if (kelasMatch) {
                    kelas = parseInt(kelasMatch[0])
                    if (kelas < 1 || kelas > 6) kelas = null
                }
            }

            const jumlahCopyVal = row.getCell(9).value
            const jumlahCopy = jumlahCopyVal ? parseInt(jumlahCopyVal.toString()) || 1 : 1
            const lokasi = row.getCell(10).value?.toString()?.trim() || null

            bukuToImport.push({
                judul,
                penulis,
                penerbit,
                tahunTerbit: isNaN(tahunTerbit as number) ? null : tahunTerbit,
                isbn,
                kategori,
                kelas,
                jumlahCopy,
                lokasi,
            })
        })

        if (bukuToImport.length === 0) {
            return NextResponse.json({ error: "No valid data found in file" }, { status: 400 })
        }

        // Insert all books
        const result = await prisma.buku.createMany({
            data: bukuToImport,
            skipDuplicates: true,
        })

        return NextResponse.json({
            success: true,
            imported: result.count,
            message: `Berhasil import ${result.count} buku`
        })
    } catch (error) {
        console.error("Error importing buku:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
