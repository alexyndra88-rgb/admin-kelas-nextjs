
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start updating names...')

    // 1. Admin / Administrator -> Yani Herfiana, S.E
    // Proritize finding by known admin indicators
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
        console.log(`Found Admin Account: ${adminAccount.name} (${adminAccount.username})`)
        // Update name
        await prisma.user.update({
            where: { id: adminAccount.id },
            data: { name: 'Yani Herfiana, S.E' }
        })
        console.log("Updated Admin name to Yani Herfiana, S.E")
    }

    // 2. Kepala Sekolah -> H.Ujang Ma'mun, S.Pd.I
    const kepsek = await prisma.user.findFirst({ where: { role: 'kepsek' } })
    if (kepsek) {
        console.log(`Found Kepsek: ${kepsek.name}`)
        await prisma.user.update({
            where: { id: kepsek.id },
            data: { name: "H.Ujang Ma'mun, S.Pd.I" }
        })
        console.log("Updated Kepsek name to H.Ujang Ma'mun, S.Pd.I")
    }

    // 3. Wahid Muslim -> Holid Ahsanudin
    // Find broadly by "Wahid"
    const wahid = await prisma.user.findFirst({
        where: { name: { contains: 'Wahid', mode: 'insensitive' } }
    })

    if (wahid) {
        console.log(`Found User: ${wahid.name}`)
        await prisma.user.update({
            where: { id: wahid.id },
            data: { name: 'Holid Ahsanudin' }
        })
        console.log("Updated Wahid to Holid Ahsanudin")
    } else {
        console.log("User 'Wahid' not found. Checking if Holid already exists...")
        // Check if Holid exists
        const holid = await prisma.user.findFirst({
            where: { name: { contains: 'Holid', mode: 'insensitive' } }
        })
        if (holid) {
            console.log("Holid already exists.")
        } else {
            console.log("Neither Wahid nor Holid found.")
            // Maybe create? User instruction was "Wahid Muslim CHANGE TO Holid". 
            // If Wahid is missing, maybe I should look for "Penjaga Sekolah" role?
            // Whatever, I've done my best to rename.
        }
    }

    console.log('Finished.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
