const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    console.log("Updating Accounts with NIP...")

    // 1. Yani Herfiana (Operator/Admin)
    const yani = await prisma.user.findFirst({
        where: { name: { contains: "Yani Herfiana", mode: "insensitive" } }
    })

    if (yani) {
        console.log(`Found Yani (${yani.name}). Updating...`)
        const hashedPassword = await bcrypt.hash("199204262025212065", 10)
        await prisma.user.update({
            where: { id: yani.id },
            data: {
                nip: "199204262025212065",
                username: "199204262025212065",
                password: hashedPassword,
            }
        })
    } else {
        console.log("Yani not found.")
    }

    // 2. Holid Ahsanudin (Penjaga)
    const holid = await prisma.user.findFirst({
        where: { name: { contains: "Holid", mode: "insensitive" } }
    })

    if (holid) {
        console.log(`Found Holid (${holid.name}). Updating...`)
        const hashedPassword = await bcrypt.hash("198208062025211095", 10)
        await prisma.user.update({
            where: { id: holid.id },
            data: {
                nip: "198208062025211095",
                username: "198208062025211095",
                password: hashedPassword,
            }
        })
    } else {
        console.log("Holid not found.")
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => await prisma.$disconnect())
