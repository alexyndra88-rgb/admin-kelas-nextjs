import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET users by role
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const roleParam = searchParams.get("role") || "guru"
        const roles = roleParam.split(",").map(r => r.trim())

        const users = await prisma.user.findMany({
            where: {
                role: { in: roles }
            },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                kelas: true,
                mapelDiampu: true,
            },
            orderBy: { name: "asc" }
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
