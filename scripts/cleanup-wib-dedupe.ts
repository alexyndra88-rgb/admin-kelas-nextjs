
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- CLEANUP BASED ON WIB DAY ---')
    const allAbsensi = await prisma.absensi.findMany({
        orderBy: { tanggal: 'desc' }
    })

    console.log(`Total Records: ${allAbsensi.length}`)

    const seen = new Set()
    const idsToDelete = []

    for (const r of allAbsensi) {
        // Convert to WIB Date String (YYYY-MM-DD)
        const timeMs = new Date(r.tanggal).getTime()
        const wibOffset = 7 * 60 * 60 * 1000
        const wibDate = new Date(timeMs + wibOffset)

        // Extract YYYY-MM-DD from the WIB date
        const y = wibDate.getUTCFullYear()
        const m = String(wibDate.getUTCMonth() + 1).padStart(2, '0')
        const d = String(wibDate.getUTCDate()).padStart(2, '0')
        const wibDateStr = `${y}-${m}-${d}`

        const key = `${r.siswaId}_${wibDateStr}`

        if (seen.has(key)) {
            idsToDelete.push(r.id)
            // console.log(`Duplicate found for ${r.siswaId} on ${wibDateStr} (ID: ${r.id})`)
        } else {
            seen.add(key)
        }
    }

    console.log(`Found ${idsToDelete.length} duplicates to delete.`)

    if (idsToDelete.length > 0) {
        // Delete in batches
        const batchSize = 100
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
            const batch = idsToDelete.slice(i, i + batchSize)
            await prisma.absensi.deleteMany({
                where: { id: { in: batch } }
            })
            console.log(`Deleted batch ${i / batchSize + 1}`)
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
