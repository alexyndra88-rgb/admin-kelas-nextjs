
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const studentCount = await prisma.siswa.count()
    console.log('Total Students (All Classes):', studentCount)

    const class5Count = await prisma.siswa.count({ where: { kelas: 5 } })
    console.log('Class 5 Students:', class5Count)

    // Use today's logic to see what the dashboard sees
    const now = new Date()
    const wibOffset = 7 * 60 * 60 * 1000
    const wibDate = new Date(now.getTime() + wibOffset)
    const y = wibDate.getUTCFullYear()
    const m = wibDate.getUTCMonth()
    const d = wibDate.getUTCDate()

    const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(y, m, d, 23, 59, 59, 999))

    console.log(`Checking Attendance for Range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`)

    const class5Attendance = await prisma.absensi.findMany({
        where: {
            siswa: { kelas: 5 },
            tanggal: { gte: startOfDay, lte: endOfDay }
        },
        include: { siswa: true }
    })

    console.log('Class 5 Attendance Records:', class5Attendance.length)

    // Check duplicates in this result set
    const pids = class5Attendance.map(a => a.siswaId)
    const uniquePids = new Set(pids)
    console.log('Unique Student IDs in Attendance:', uniquePids.size)

    if (class5Attendance.length > uniquePids.size) {
        console.log('Duplicates detected in query result!')
        const counts = {}
        pids.forEach(p => counts[p] = (counts[p] || 0) + 1)
        Object.entries(counts).filter(([k, v]) => v > 1).forEach(([k, v]) => {
            console.log(`Student ${k} has ${v} records`)
            const recs = class5Attendance.filter(a => a.siswaId === k)
            recs.forEach(r => console.log(` - ${r.tanggal.toISOString()} (ID: ${r.id})`))
        })
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
