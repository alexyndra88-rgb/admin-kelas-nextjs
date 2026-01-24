const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Start updating names (JS)...')

    // 1. Admin
    const adminAccount = await prisma.user.findFirst({
        where: {
            OR: [
                { name: 'Administrator' },
                { username: 'admin' },
                { role: 'admin' }
            ]
        }
    })

    if (adminAccount) {
        if (adminAccount.name !== 'Yani Herfiana, S.E') {
            console.log(`Found Admin: ${adminAccount.name}`)
            await prisma.user.update({
                where: { id: adminAccount.id },
                data: { name: 'Yani Herfiana, S.E' }
            })
            console.log("Updated Admin.")
        } else {
            console.log("Admin OK.")
        }
    }

    // 2. Kepsek
    const kepsek = await prisma.user.findFirst({ where: { role: 'kepsek' } })
    if (kepsek) {
        if (kepsek.name !== "H.Ujang Ma'mun, S.Pd.I") {
            console.log(`Found Kepsek: ${kepsek.name}`)
            await prisma.user.update({
                where: { id: kepsek.id },
                data: { name: "H.Ujang Ma'mun, S.Pd.I" }
            })
            console.log("Updated Kepsek.")
        } else {
            console.log("Kepsek OK.")
        }
    }

    // 3. Wahid
    const wahid = await prisma.user.findFirst({
        where: { name: { contains: 'Wahid', mode: 'insensitive' } }
    })

    if (wahid) {
        console.log(`Found Wahid: ${wahid.name}`)
        await prisma.user.update({
            where: { id: wahid.id },
            data: { name: 'Holid Ahsanudin' }
        })
        console.log("Updated Wahid to Holid.")
    } else {
        const holid = await prisma.user.findFirst({
            where: { name: { contains: 'Holid', mode: 'insensitive' } }
        })
        if (holid) console.log("Holid already exists: " + holid.name)
        else console.log("User Wahid/Holid not found.")
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => await prisma.$disconnect())
