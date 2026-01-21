import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("Seeding database...")

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10)

    await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            password: hashedPassword,
            name: "Administrator",
            role: "admin",
            kelas: null,
        },
    })

    // Create sample guru users
    for (let i = 1; i <= 6; i++) {
        await prisma.user.upsert({
            where: { username: `guru${i}` },
            update: {},
            create: {
                username: `guru${i}`,
                password: await bcrypt.hash("guru123", 10),
                name: `Guru Kelas ${i}`,
                role: "guru",
                kelas: i,
            },
        })
    }

    // Create default school settings
    await prisma.schoolSettings.upsert({
        where: { id: "main" },
        update: {},
        create: {
            id: "main",
            namaSekolah: "SDN 2 Nangerang",
            tahunAjaran: "2025/2026",
        },
    })

    console.log("Seeding complete!")
    console.log("")
    console.log("=== Login Credentials ===")
    console.log("Admin: username=admin, password=admin123")
    console.log("Guru:  username=guru1-6, password=guru123")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
