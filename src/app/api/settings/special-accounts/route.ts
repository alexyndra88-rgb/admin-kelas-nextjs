import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

// GET all kepsek and pengawas accounts
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const accounts = await prisma.user.findMany({
            where: {
                role: { in: ["kepsek", "pengawas"] }
            },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
            },
            orderBy: { role: "asc" }
        })

        return NextResponse.json(accounts)
    } catch (error) {
        console.error("Error fetching special accounts:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST update special accounts (create or update)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { accounts } = await request.json()

        for (const account of accounts) {
            const { id, name, username, password, role } = account

            // Validate role
            if (!["kepsek", "pengawas"].includes(role)) {
                continue
            }

            if (id) {
                // Update existing account
                const updateData: { name: string; username: string; password?: string } = {
                    name,
                    username,
                }
                if (password && password.trim() !== "") {
                    updateData.password = await bcrypt.hash(password, 10)
                }
                await prisma.user.update({
                    where: { id },
                    data: updateData,
                })
            } else if (username && name) {
                // Create new account
                const hashedPassword = await bcrypt.hash(password || "password123", 10)
                await prisma.user.create({
                    data: {
                        name,
                        username,
                        password: hashedPassword,
                        role,
                    },
                })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating special accounts:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
