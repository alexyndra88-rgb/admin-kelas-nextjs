// Subject (Mapel) Configuration
// Centralized configuration for all subjects with class availability

export interface MapelConfig {
    name: string
    classes: number[] // which classes (1-6) have this subject
    exclusive?: boolean // If true, only guru_mapel with this subject can access
}

export const MAPEL_CONFIG: MapelConfig[] = [
    { name: "Bahasa Indonesia", classes: [1, 2, 3, 4, 5, 6] },
    { name: "Matematika", classes: [1, 2, 3, 4, 5, 6] },
    { name: "IPAs", classes: [1, 2, 3, 4, 5, 6] },  // Merged IPA + IPS
    { name: "Pendidikan Pancasila", classes: [1, 2, 3, 4, 5, 6] }, // Renamed from PKn
    { name: "Penjas", classes: [1, 2, 3, 4, 5, 6] },
    { name: "SBdP", classes: [1, 2, 3, 4, 5, 6] },
    { name: "Bahasa Sunda", classes: [1, 2, 3, 4, 5, 6] },
    { name: "B.Inggris", classes: [1, 2, 3, 4, 5, 6] },
    { name: "TdBA", classes: [1, 2, 3, 4, 5, 6] },
    { name: "Koding", classes: [5, 6] },  // Only grades 5-6
    { name: "KA", classes: [5, 6] },  // Only grades 5-6
    // Exclusive subjects - only for guru_mapel
    { name: "AKPK", classes: [1, 2, 3, 4, 5, 6], exclusive: true },
    { name: "PAI", classes: [1, 2, 3, 4, 5, 6], exclusive: true },
]

// Check if a subject is exclusive (guru_mapel only)
export function isExclusiveMapel(mapelName: string): boolean {
    const mapel = MAPEL_CONFIG.find(m => m.name === mapelName)
    return mapel?.exclusive === true
}

// Get list of subjects for a specific class (for regular guru - excludes exclusive)
export function getMapelByKelas(kelas: number): string[] {
    return MAPEL_CONFIG
        .filter(m => m.classes.includes(kelas) && !m.exclusive)
        .map(m => m.name)
}

// Get subjects for guru_mapel based on their assigned subjects
export function getMapelForGuruMapel(mapelDiampu: string): string[] {
    return mapelDiampu.split(",").map(m => m.trim()).filter(m => m)
}

// Get all unique subjects across all classes (including exclusive)
export function getAllMapel(): string[] {
    return MAPEL_CONFIG.map(m => m.name)
}

// Get subjects based on user role and assignment
export function getMapelByUser(kelas: number, role: string, mapelDiampu?: string | null): string[] {
    if (role === "guru_mapel" && mapelDiampu) {
        return getMapelForGuruMapel(mapelDiampu)
    }
    // Regular guru or admin - exclude exclusive subjects
    return getMapelByKelas(kelas)
}
