
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG USER AND ATTENDANCE ---')

    // 1. Find User 'Andris'
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: { contains: 'andris', mode: 'insensitive' } },
                { name: { contains: 'andris', mode: 'insensitive' } }
            ]
        }
    })
    console.log('User found:', user)

    if (!user) {
        console.log('No user named Andris found. Listing all admins:')
        const admins = await prisma.user.findMany({ where: { role: 'admin' } })
        console.log(admins)
    }

    // 2. Check Student Counts
    const totalStudents = await prisma.siswa.count()
    console.log('Total Students in DB:', totalStudents)

    if (user && user.kelas) {
        const classCount = await prisma.siswa.count({ where: { kelas: user.kelas } })
        console.log(`Students in Class ${user.kelas}:`, classCount)
    }

    // 3. Check Attendance for Today (Using generic date query to see what's there)
    // We'll look for anything in the last 24 hours just to be safe, or just simply all records for today's date string

    const todayStr = new Date().toISOString().split('T')[0]
    console.log('Checking attendance roughly around:', todayStr)

    const allAbsensi = await prisma.absensi.findMany({
        take: 50
    })

    // Since Absensi might not have createdAt, let's just group by date
    const absensiByDate = await prisma.absensi.groupBy({
        by: ['tanggal'],
        _count: { id: true },
        orderBy: { tanggal: 'desc' }
    })

    console.log('Attendance counts by date (Top 5):')
    absensiByDate.slice(0, 5).forEach(group => {
        console.log(`${group.tanggal.toISOString()}: ${group._count.id} records`)
    })

    // Detailed check for the top date (likely today or yesterday)
    if (absensiByDate.length > 0) {
        const latestDate = absensiByDate[0].tanggal
        const records = await prisma.absensi.findMany({
            where: { tanggal: latestDate },
            include: { siswa: true }
        })

        console.log(`\nDetailed records for ${latestDate.toISOString()} (Count: ${records.length}):`)

        // Check for duplicate students
        const studentIds = records.map(r => r.siswaId)
        const uniqueStudentIds = new Set(studentIds)
        console.log(`Unique Student IDs: ${uniqueStudentIds.size}`)

        console.log('Sample records:')
        records.slice(0, 3).forEach(r => {
            console.log(`- ${r.siswa.nama} (Class ${r.siswa.kelas}): ${r.status}`)
        })

        if (records.length > uniqueStudentIds.size) {
            console.log("!!! DUPLICATES DETECTED !!!")
            const seen = new Set()
            const duplicates = []
            for (const id of studentIds) {
                if (seen.has(id)) duplicates.push(id)
                seen.add(id)
            }
            console.log(`Duplicate Student IDs count: ${duplicates.length}`)
        }
    }

    // Check Schema for createdAt on Absensi
    // I recall viewing schema earlier and it didn't have createdAt.
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
