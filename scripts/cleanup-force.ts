
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting cleanup...')

    const allAbsensi = await prisma.absensi.findMany({
        orderBy: { tanggal: 'asc' }
    })

    console.log(`Found ${allAbsensi.length} records. checking for duplicates...`)

    const seen = new Set()
    const idsToDelete = []

    for (const r of allAbsensi) {
        // Force date to YYYY-MM-DD string relative to UTC to identify "same day"
        // Actually, since we want to clear ALL duplicates for a student-day pair:
        const d = new Date(r.tanggal)
        // We treat the date loosely: YYYY-MM-DD
        const dateStr = d.toISOString().split('T')[0]

        const key = `${r.siswaId}_${dateStr}`

        if (seen.has(key)) {
            idsToDelete.push(r.id)
        } else {
            seen.add(key)
        }
    }

    console.log(`Found ${idsToDelete.length} duplicates to delete.`)

    if (idsToDelete.length > 0) {
        await prisma.absensi.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        })
        console.log('Deleted duplicates.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
