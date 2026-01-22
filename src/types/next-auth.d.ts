import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username: string
            role: string
            kelas: number | null
            fotoProfilUrl: string | null
            mapelDiampu: string | null
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        username: string
        role: string
        kelas: number | null
        fotoProfilUrl: string | null
        mapelDiampu: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: string
        kelas: number | null
        fotoProfilUrl: string | null
        mapelDiampu: string | null
    }
}
