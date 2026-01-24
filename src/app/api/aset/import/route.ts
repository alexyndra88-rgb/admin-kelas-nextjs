import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"

const VALID_KIB = ["A", "B", "C", "D", "E"]
const VALID_KONDISI = ["Baik", "Rusak Ringan", "Rusak Berat"]
const VALID_SUMBER_DANA = ["BOS Reguler", "BOS Kinerja", "Hibah Pusat", "Hibah Pemda", "Komite", "Lainnya"]

// POST - Import aset from Excel
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

        const asetToImport: {
            namaAset: string
            kib: string
            kategori: string
            jumlah: number
            kondisi: string
            lokasi: string | null
            tahunPerolehan: number
            sumberDana: string
            hargaPerolehan: number
            nilaiPerUnit: number | null
            buktiKepemilikan: string | null
            keterangan: string | null
        }[] = []

        // Skip header row (row 1), start from row 2
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return // Skip header

            const kib = row.getCell(2).value?.toString()?.trim()?.toUpperCase()
            const namaAset = row.getCell(3).value?.toString()?.trim()
            const kategori = row.getCell(4).value?.toString()?.trim()

            if (!namaAset || !kib || !kategori) return // Skip empty rows

            // Validate KIB
            if (!VALID_KIB.includes(kib)) return

            const jumlahVal = row.getCell(5).value
            const jumlah = jumlahVal ? parseInt(jumlahVal.toString()) || 1 : 1

            let kondisi = row.getCell(6).value?.toString()?.trim() || "Baik"
            if (!VALID_KONDISI.includes(kondisi)) kondisi = "Baik"

            const lokasi = row.getCell(7).value?.toString()?.trim() || null

            const tahunVal = row.getCell(8).value
            const tahunPerolehan = tahunVal ? parseInt(tahunVal.toString()) : new Date().getFullYear()

            let sumberDana = row.getCell(9).value?.toString()?.trim() || "BOS Reguler"
            if (!VALID_SUMBER_DANA.includes(sumberDana)) sumberDana = "BOS Reguler"

            const hargaVal = row.getCell(10).value
            const hargaPerolehan = hargaVal ? parseFloat(hargaVal.toString().replace(/[,\.]/g, m => m === ',' ? '' : '.')) || 0 : 0

            const nilaiVal = row.getCell(11).value
            const nilaiPerUnit = nilaiVal ? parseFloat(nilaiVal.toString().replace(/[,\.]/g, m => m === ',' ? '' : '.')) : null

            const buktiKepemilikan = row.getCell(12).value?.toString()?.trim() || null
            const keterangan = row.getCell(13).value?.toString()?.trim() || null

            asetToImport.push({
                namaAset,
                kib,
                kategori,
                jumlah,
                kondisi,
                lokasi,
                tahunPerolehan: isNaN(tahunPerolehan) ? new Date().getFullYear() : tahunPerolehan,
                sumberDana,
                hargaPerolehan: isNaN(hargaPerolehan) ? 0 : hargaPerolehan,
                nilaiPerUnit: nilaiPerUnit && !isNaN(nilaiPerUnit) ? nilaiPerUnit : null,
                buktiKepemilikan,
                keterangan,
            })
        })

        if (asetToImport.length === 0) {
            return NextResponse.json({ error: "No valid data found in file" }, { status: 400 })
        }

        // Insert all assets
        const result = await prisma.aset.createMany({
            data: asetToImport,
            skipDuplicates: true,
        })

        return NextResponse.json({
            success: true,
            imported: result.count,
            message: `Berhasil import ${result.count} aset`
        })
    } catch (error) {
        console.error("Error importing aset:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
