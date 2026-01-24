import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
    try {
        const hashedPassword = await bcrypt.hash("admin123", 10)

        // Force create or update admin user
        const user = await prisma.user.upsert({
            where: { username: "admin" },
            update: {
                password: hashedPassword,
                role: "admin",
                name: "Administrator"
            },
            create: {
                username: "admin",
                password: hashedPassword,
                name: "Administrator",
                role: "admin",
                kelas: null,
            },
        })

        return NextResponse.json({
            success: true,
            message: "User 'admin' berhasil di-reset.",
            credentials: {
                username: "admin",
                password: "admin123"
            },
            user_id: user.id
        })
    } catch (error) {
        console.error("Fix Admin Error:", error)
        return NextResponse.json({ error: "Gagal mereset admin", details: error }, { status: 500 })
    }
}
