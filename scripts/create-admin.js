const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    const username = "admin"
    const password = "password123"

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { username } })

    if (existing) {
        console.log(`User '${username}' already exists. (Name: ${existing.name})`)
        console.log("Resetting password to default 'password123' just in case...")
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
            where: { username },
            data: { password: hashedPassword, role: "admin" }
        })
    } else {
        console.log(`Creating new Administrator account...`)
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.create({
            data: {
                name: "Administrator",
                username: username,
                password: hashedPassword,
                role: "admin",
            }
        })
        console.log("Administrator created successfully.")
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => await prisma.$disconnect())
