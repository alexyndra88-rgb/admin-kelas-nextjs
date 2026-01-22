import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { tanggal, bulan, type } = await request.json()

        // Get all teachers
        const teachers = await prisma.user.findMany({
            where: { role: { in: ["guru", "guru_mapel"] } },
            select: { id: true, name: true, role: true },
            orderBy: { name: "asc" }
        })

        let workbook: XLSX.WorkBook
        let sheetData: (string | number)[][]

        if (type === "daily" && tanggal) {
            // Daily export
            const dateObj = new Date(tanggal)
            const attendance = await prisma.absensiGuru.findMany({
                where: { tanggal: dateObj }
            })

            const formattedDate = dateObj.toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
            })

            sheetData = [
                ["DAFTAR HADIR GURU"],
                [`Tanggal: ${formattedDate}`],
                [],
                ["No", "Nama Guru", "Jabatan", "Waktu Datang", "Tanda Tangan", "Waktu Pulang", "Tanda Tangan"],
            ]

            teachers.forEach((teacher, idx) => {
                const att = attendance.find(a => a.userId === teacher.id)
                sheetData.push([
                    idx + 1,
                    teacher.name,
                    teacher.role === "guru_mapel" ? "Guru Mapel" : "Wali Kelas",
                    att?.waktuDatang || "-",
                    att?.ttdDatang ? "✓" : "-",
                    att?.waktuPulang || "-",
                    att?.ttdPulang ? "✓" : "-",
                ])
            })

            workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

            // Set column widths
            worksheet["!cols"] = [
                { wch: 5 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
            ]

            XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi Harian")

        } else if (type === "monthly" && bulan) {
            // Monthly recap export
            const [year, month] = bulan.split("-").map(Number)
            const startDate = new Date(year, month - 1, 1)
            const endDate = new Date(year, month, 0)
            const daysInMonth = endDate.getDate()

            const attendance = await prisma.absensiGuru.findMany({
                where: {
                    tanggal: { gte: startDate, lte: endDate }
                }
            })

            const monthName = startDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })

            // Header row with dates
            const headerRow = ["No", "Nama Guru"]
            for (let d = 1; d <= daysInMonth; d++) {
                headerRow.push(d.toString())
            }
            headerRow.push("Jumlah Hadir")

            sheetData = [
                ["REKAP KEHADIRAN GURU"],
                [`Bulan: ${monthName}`],
                [],
                headerRow,
            ]

            teachers.forEach((teacher, idx) => {
                const row: (string | number)[] = [idx + 1, teacher.name]
                let hadirCount = 0

                for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                    const att = attendance.find(a =>
                        a.userId === teacher.id &&
                        a.tanggal.toISOString().split("T")[0] === dateStr
                    )
                    if (att?.ttdDatang) {
                        row.push("✓")
                        hadirCount++
                    } else {
                        row.push("-")
                    }
                }
                row.push(hadirCount)
                sheetData.push(row)
            })

            workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

            // Set column widths
            const cols = [{ wch: 5 }, { wch: 35 }]
            for (let d = 0; d < daysInMonth; d++) {
                cols.push({ wch: 4 })
            }
            cols.push({ wch: 12 })
            worksheet["!cols"] = cols

            XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Bulanan")

        } else {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
        }

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

        return new NextResponse(excelBuffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="absensi-guru-${tanggal || bulan}.xlsx"`
            }
        })
    } catch (error) {
        console.error("Error exporting teacher attendance:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
