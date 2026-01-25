import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const waliKelas = await prisma.waliKelas.findMany({
            orderBy: { kelas: "asc" },
        })

        const users = await prisma.user.findMany({
            where: { role: "guru" },
            select: {
                username: true,
                kelas: true,
                fotoProfilUrl: true
            }
        })

        // Combine data
        const combined = [1, 2, 3, 4, 5, 6].map(k => {
            const info = waliKelas.find(w => w.kelas === k)
            const user = users.find(u => u.kelas === k)
            return {
                kelas: k,
                nama: info?.nama || "",
                nip: info?.nip || "",
                username: user?.username || `guru${k}`,
                fotoProfilUrl: user?.fotoProfilUrl || ""
            }
        })

        return NextResponse.json(combined)
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { waliKelasData } = await request.json()

        for (const data of waliKelasData) {
            // Update or Create WaliKelas Info
            await prisma.waliKelas.upsert({
                where: { kelas: data.kelas },
                update: { nama: data.nama, nip: data.nip },
                create: { kelas: data.kelas, nama: data.nama, nip: data.nip },
            })

            // Update User Account
            const updatePayload: any = {
                username: data.username,
                name: data.nama,
            }

            if (data.password && data.password.trim() !== "") {
                const hashedPassword = await bcrypt.hash(data.password, 10)
                updatePayload.password = hashedPassword
            }

            if (data.fotoProfilUrl !== undefined) {
                updatePayload.fotoProfilUrl = data.fotoProfilUrl
            }

            // Find current user for this class
            const existingUser = await prisma.user.findFirst({
                where: { kelas: data.kelas, role: "guru" }
            })

            if (existingUser) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: updatePayload
                })
            } else {
                // If user doesn't exist, create it
                const finalPassword = data.password ? await bcrypt.hash(data.password, 10) : await bcrypt.hash(`guru123`, 10)
                await prisma.user.create({
                    data: {
                        username: data.username,
                        password: finalPassword,
                        name: data.nama,
                        role: "guru",
                        kelas: data.kelas,
                        fotoProfilUrl: data.fotoProfilUrl
                    }
                })
            }
        }

        return NextResponse.json({ message: "Saved" })
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
