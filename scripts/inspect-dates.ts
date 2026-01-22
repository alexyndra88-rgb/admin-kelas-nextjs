
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- INSPECT CLASS 5 DATES ---')
    const records = await prisma.absensi.findMany({
        where: { siswa: { kelas: 5 } },
        select: {
            id: true,
            tanggal: true,
            siswa: { select: { nama: true } }
        },
        orderBy: { siswaId: 'asc' }
    })

    console.log(`Total Records: ${records.length}`)

    records.forEach(r => {
        // Print Raw Date and UTC String
        console.log(`${r.siswa.nama.padEnd(20)} | ${r.tanggal.toISOString()} | JSON: ${JSON.stringify(r.tanggal)}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
