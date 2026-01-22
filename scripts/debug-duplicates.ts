
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG USER AND ATTENDANCE (RETRY) ---')
    console.log('DATABASE_URL:', process.env.DATABASE_URL)

    // 1. Find User 'Andris'
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: { contains: 'andris', mode: 'insensitive' } },
                { name: { contains: 'andris', mode: 'insensitive' } }
            ]
        }
    })

    if (user) {
        console.log(`User: ${user.name} | Role: ${user.role} | Kelas: ${user.kelas}`)
    } else {
        console.log('User Andris not found.')
    }

    // 2. Count Records
    const totalStudents = await prisma.siswa.count()
    console.log('Total Students in DB:', totalStudents)

    // 3. Check "Today's" Attendance Logic (WIB Simulation)
    const now = new Date()
    const wibOffset = 7 * 60 * 60 * 1000
    const wibDate = new Date(now.getTime() + wibOffset)
    console.log('Simulated WIB Date:', wibDate.toISOString())

    const y = wibDate.getUTCFullYear()
    const m = wibDate.getUTCMonth()
    const d = wibDate.getUTCDate()

    // Create UTC Boundaries as per new logic
    const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(y, m, d, 23, 59, 59, 999))

    console.log('Query Range (UTC):')
    console.log('Start:', startOfDay.toISOString())
    console.log('End:  ', endOfDay.toISOString())

    const attendanceToday = await prisma.absensi.findMany({
        where: {
            tanggal: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: { siswa: true }
    })

    console.log(`Attendance Records Found: ${attendanceToday.length}`)

    console.log('--- Checking Class 5 Specifically (User Andris context) ---')
    const class5Attendance = await prisma.absensi.findMany({
        where: {
            siswa: { kelas: 5 },
            tanggal: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: { siswa: true }
    })

    console.log(`Class 5 Attendance Count: ${class5Attendance.length}`)

    const c5Counts: Record<string, number> = {}
    class5Attendance.forEach(a => {
        const key = `${a.siswaId}_${a.tanggal.toISOString()}`
        c5Counts[key] = (c5Counts[key] || 0) + 1

        // Also check just by student ID
        c5Counts[a.siswaId] = (c5Counts[a.siswaId] || 0) + 1
    })

    // Print all records
    class5Attendance.forEach(r => {
        console.log(`${r.siswa.nama} (${r.siswaId}) - ${r.tanggal.toISOString()} - ${r.status}`)
    })

    // Group by Student ID to find duplicates in this range
    const studentCounts: Record<string, number> = {}
    attendanceToday.forEach(a => {
        studentCounts[a.siswaId] = (studentCounts[a.siswaId] || 0) + 1
    })

    const duplicates = Object.entries(studentCounts).filter(([id, count]) => (count as number) > 1)
    console.log(`Students with >1 record today: ${duplicates.length}`)

    if (duplicates.length > 0) {
        console.log('Sample Duplicates:')
        const sampleId = duplicates[0][0]
        const records = attendanceToday.filter(a => a.siswaId === sampleId)
        records.forEach(r => {
            console.log(`- ID: ${r.id} | Date: ${r.tanggal.toISOString()} | Siswa: ${r.siswa.nama}`)
        })
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
