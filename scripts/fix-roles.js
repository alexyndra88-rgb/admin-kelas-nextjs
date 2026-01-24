const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    console.log("Fixing Account Roles...")

    // 1. Fix Holid (The Penjaga) -> Role: guru_mapel (Staff)
    // Find by the NIP/Username we set
    const holid = await prisma.user.findUnique({
        where: { username: "198208062025211095" }
    })

    if (holid) {
        console.log(`Found Holid (${holid.name}). Setting role to 'guru_mapel'...`)
        await prisma.user.update({
            where: { id: holid.id },
            data: { role: "guru_mapel" }
        })
    } else {
        console.log("Holid account (1982...) not found. Creating...")
        const pwd = await bcrypt.hash("198208062025211095", 10)
        await prisma.user.create({
            data: {
                name: "Holid Ahsanudin",
                username: "198208062025211095",
                password: pwd,
                role: "guru_mapel",
                nip: "198208062025211095"
            }
        })
    }

    // 2. Restore Wahid Muslim (The Pengawas) -> Role: pengawas
    const wahid = await prisma.user.findFirst({
        where: { name: { contains: "Wahid", mode: "insensitive" } }
    })

    if (!wahid) {
        console.log("Wahid not found. Creating Pengawas account...")
        const pwd = await bcrypt.hash("password123", 10)
        // Check if 'pengawas' username taken
        const existingUser = await prisma.user.findUnique({ where: { username: "pengawas" } })
        const username = existingUser ? "pengawas_wahid" : "pengawas"

        await prisma.user.create({
            data: {
                name: "Wahid Muslim",
                username: username,
                password: pwd,
                role: "pengawas",
                // nip?
            }
        })
        console.log(`Wahid Muslim created (User: ${username}).`)
    } else {
        console.log(`Found Wahid (${wahid.name}). Ensuring role is 'pengawas'...`)
        await prisma.user.update({
            where: { id: wahid.id },
            data: { role: "pengawas" }
        })
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
