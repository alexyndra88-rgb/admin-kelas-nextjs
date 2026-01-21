import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username: string
            role: string
            kelas: number | null
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        username: string
        role: string
        kelas: number | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: string
        kelas: number | null
    }
}
