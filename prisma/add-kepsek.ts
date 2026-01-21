import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("Adding Kepala Sekolah user...")

    const nip = "196912122007011021"
    const hashedPassword = await bcrypt.hash(nip, 10)

    await prisma.user.upsert({
        where: { username: nip },
        update: {
            password: hashedPassword,
            name: "H.Ujang Ma'Mun, S.Pd",
            role: "kepsek",
        },
        create: {
            username: nip,
            password: hashedPassword,
            name: "H.Ujang Ma'Mun, S.Pd",
            role: "kepsek",
            kelas: null,
        },
    })

    console.log("Kepala Sekolah user created!")
    console.log("")
    console.log("=== Kepala Sekolah Login ===")
    console.log(`Username: ${nip}`)
    console.log(`Password: ${nip}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
