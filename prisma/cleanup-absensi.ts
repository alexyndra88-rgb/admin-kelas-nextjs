
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting absensi cleanup (Aggressive Mode)...')

    // 1. Get ALL records
    const allAbsensi = await prisma.absensi.findMany({
        orderBy: { createdAt: 'desc' } // Keep the latest created
    })

    console.log(`Scanning ${allAbsensi.length} records...`)

    const seen = new Set()
    const idsToDelete = []
    const idsToKeep = []

    for (const record of allAbsensi) {
        // Normalize date string for comparison
        const d = new Date(record.tanggal)
        // Use local date parts to avoid UTC shift issues in string key logic
        // Actually, best to just use YYYY-MM-DD from the date object
        const dateKey = d.toISOString().split('T')[0]

        const key = `${record.siswaId}_${dateKey}`

        if (seen.has(key)) {
            // Already saw this key (and since we iterate desc, we saw the NEWER one first)
            // So this is an older duplicate -> DELETE IT
            idsToDelete.push(record.id)
        } else {
            seen.add(key)
            idsToKeep.push(record.id)
        }
    }

    console.log(`Found ${idsToDelete.length} duplicates to delete. Keeping ${idsToKeep.length} unique records.`)

    // 2. Delete duplicates
    if (idsToDelete.length > 0) {
        const deleted = await prisma.absensi.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        })
        console.log(`Deleted ${deleted.count} records.`)
    }

    // 3. Normalize remaining records
    console.log('Normalizing remaining dates...')
    for (const id of idsToKeep) {
        const record = allAbsensi.find(r => r.id === id)
        if (record) {
            const d = new Date(record.tanggal)
            d.setHours(0, 0, 0, 0)

            // Only update if needed
            if (d.getTime() !== new Date(record.tanggal).getTime()) {
                await prisma.absensi.update({
                    where: { id: id },
                    data: { tanggal: d }
                }).catch(e => {
                    console.log(`Skipping update for ${id} due to likely collision: ${e.message}`)
                })
            }
        }
    }

    console.log('Cleanup complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
