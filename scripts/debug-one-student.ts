
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const arbitraryStudent = await prisma.absensi.findFirst()
    if (!arbitraryStudent) return

    const records = await prisma.absensi.findMany({
        where: { siswaId: arbitraryStudent.siswaId },
        orderBy: { tanggal: 'asc' }
    })

    console.log(`Records for student ${arbitraryStudent.siswaId}:`)
    records.forEach(r => {
        console.log(`ID: ${r.id} | Date: ${r.tanggal.toISOString()} | Status: ${r.status}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
