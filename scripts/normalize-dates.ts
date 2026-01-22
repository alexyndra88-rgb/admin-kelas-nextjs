
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Normalizing dates...')
    const allAbsensi = await prisma.absensi.findMany()

    for (const r of allAbsensi) {
        // Treat the existing date as potentially shifted.
        // effective local date?
        // If we assume usage was WIB (UTC+7).
        // We add 7 hours to the UTC time to see the "intended" date.
        const dateOnServer = new Date(r.tanggal)
        const timeMs = dateOnServer.getTime()
        const wibOffset = 7 * 60 * 60 * 1000
        const wibDate = new Date(timeMs + wibOffset)

        // Extract YYYY-MM-DD from the WIB date
        const y = wibDate.getUTCFullYear()
        const m = wibDate.getUTCMonth()
        const d = wibDate.getUTCDate()

        // Create new Pure UTC Midnight date
        const newDate = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))

        if (newDate.getTime() !== dateOnServer.getTime()) {
            // Update it
            try {
                await prisma.absensi.update({
                    where: { id: r.id },
                    data: { tanggal: newDate }
                })
            } catch (e: unknown) {
                // If update fails, it's likely a unique constraint violation (collision with existing normalized record)
                // We can delete this one if it's a "duplicate" in the target slot
                const error = e as { code?: string }
                if (error.code === 'P2002') {
                    console.log(`Collision for ${r.id}, deleting as duplicate...`)
                    await prisma.absensi.delete({ where: { id: r.id } })
                } else {
                    console.error(e)
                }
            }
        }
    }
    console.log('Normalization complete.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
