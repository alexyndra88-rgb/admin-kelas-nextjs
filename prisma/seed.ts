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

    // Update Kepala Sekolah account with real name
    await prisma.user.upsert({
        where: { username: "kepsek" },
        update: { name: "H. Ujang Ma'Mun, S.Pd.I." },
        create: {
            username: "kepsek",
            password: await bcrypt.hash("kepsek123", 10),
            name: "H. Ujang Ma'Mun, S.Pd.I.",
            role: "kepsek",
            kelas: null,
        },
    })

    // Create Penjaga Sekolah (Holid Ahsanudin)
    // Using guru role but without class assignment, or we could add a 'staff' role later?
    // For now assuming 'guru' role so they appear in lists, or 'tendik' if system supports.
    // Based on user request context, they should appear in Guru Attendance list.
    await prisma.user.upsert({
        where: { username: "198208062025211095" },
        update: {},
        create: {
            username: "198208062025211095",
            password: await bcrypt.hash("198208062025211095", 10),
            name: "Holid Ahsanudin",
            role: "guru", // Using 'guru' so they appear in attendance list for now
            kelas: null,
            nip: "198208062025211095"
        },
    })

    // Create Operator (Yani Herfiyana Apriyani, S.E)
    await prisma.user.upsert({
        where: { username: "199204262025212065" },
        update: {},
        create: {
            username: "199204262025212065",
            password: await bcrypt.hash("199204262025212065", 10),
            name: "Yani Herfiyana Apriyani, S.E",
            role: "guru", // Using 'guru' to ensure visibility in attendance list
            kelas: null,
            nip: "199204262025212065"
        },
    })

    // Create Pengawas account
    await prisma.user.upsert({
        where: { username: "pengawas" },
        update: {},
        create: {
            username: "pengawas",
            password: await bcrypt.hash("pengawas123", 10),
            name: "Pengawas Sekolah",
            role: "pengawas",
            kelas: null,
        },
    })

    // Create Guru Mapel accounts (AKPK and PAI)
    await prisma.user.upsert({
        where: { username: "cecep" },
        update: { role: "guru_mapel", mapelDiampu: "AKPK" },
        create: {
            username: "cecep",
            password: await bcrypt.hash("guru123", 10),
            name: "Cecep Rif'at Syarifudin, S.Pd",
            role: "guru_mapel",
            kelas: null,
            mapelDiampu: "AKPK",
        },
    })

    await prisma.user.upsert({
        where: { username: "kuraesin" },
        update: { role: "guru_mapel", mapelDiampu: "PAI" },
        create: {
            username: "kuraesin",
            password: await bcrypt.hash("guru123", 10),
            name: "Kuraesin, S.Pd.I",
            role: "guru_mapel",
            kelas: null,
            mapelDiampu: "PAI",
        },
    })

    console.log("Seeding complete!")
    console.log("")
    console.log("=== Login Credentials ===")
    console.log("Admin:    username=admin, password=admin123")
    console.log("Guru:     username=guru1-6, password=guru123")
    console.log("Kepsek:   username=kepsek, password=kepsek123")
    console.log("Pengawas: username=pengawas, password=pengawas123")
    console.log("Guru Mapel AKPK: username=cecep, password=guru123")
    console.log("Guru Mapel PAI:  username=kuraesin, password=guru123")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
