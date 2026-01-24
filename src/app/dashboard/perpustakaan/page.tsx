"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface Buku {
    id: string
    judul: string
    penulis: string
    penerbit: string | null
    tahunTerbit: number | null
    isbn: string | null
    kategori: string
    kelas: number | null
    jumlahCopy: number
    lokasi: string | null
}

interface SearchResult {
    id: string
    judul: string
    penulis: string
    penerbit: string
    tahunTerbit: number | null
    isbn: string
    kategori: string
    thumbnail: string | null
}

const KATEGORI_BUKU = ["Fiksi", "Non-Fiksi", "Pelajaran", "Referensi", "Majalah"]

export default function PerpustakaanPage() {
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === "admin"

    const [bukuList, setBukuList] = useState<Buku[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterKategori, setFilterKategori] = useState("")
    const [filterKelas, setFilterKelas] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [showModal, setShowModal] = useState(false)
    const [editingBuku, setEditingBuku] = useState<Buku | null>(null)
    const [saving, setSaving] = useState(false)

    // Online search states
    const [showSearchModal, setShowSearchModal] = useState(false)
    const [onlineSearchQuery, setOnlineSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [searching, setSearching] = useState(false)

    const [formData, setFormData] = useState({
        judul: "",
        penulis: "",
        penerbit: "",
        tahunTerbit: "",
        isbn: "",
        kategori: "Pelajaran",
        kelas: "",
        jumlahCopy: "1",
        lokasi: ""
    })

    const fetchBuku = async () => {
        try {
            const res = await fetch("/api/buku")
            if (res.ok) {
                const data = await res.json()
                setBukuList(data)
            }
        } catch (error) {
            console.error("Error fetching buku:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBuku()
    }, [])

    // Search books online using Google Books API
    const handleOnlineSearch = async () => {
        if (!onlineSearchQuery.trim()) return
        setSearching(true)
        try {
            // Check if it looks like an ISBN (only digits, 10 or 13 chars)
            const isIsbn = /^\d{10,13}$/.test(onlineSearchQuery.replace(/-/g, ""))
            const params = isIsbn
                ? `isbn=${encodeURIComponent(onlineSearchQuery.replace(/-/g, ""))}`
                : `q=${encodeURIComponent(onlineSearchQuery)}`

            const res = await fetch(`/api/buku/search?${params}`)
            if (res.ok) {
                const data = await res.json()
                setSearchResults(data)
            }
        } catch (error) {
            console.error("Error searching books:", error)
        } finally {
            setSearching(false)
        }
    }

    // Select a book from search results
    const handleSelectSearchResult = (result: SearchResult) => {
        setFormData({
            judul: result.judul,
            penulis: result.penulis,
            penerbit: result.penerbit || "",
            tahunTerbit: result.tahunTerbit?.toString() || "",
            isbn: result.isbn || "",
            kategori: mapKategori(result.kategori),
            kelas: "",
            jumlahCopy: "1",
            lokasi: ""
        })
        setShowSearchModal(false)
        setSearchResults([])
        setOnlineSearchQuery("")
        setShowModal(true)
        setEditingBuku(null)
    }

    // Map Google Books category to our categories
    const mapKategori = (googleCategory: string): string => {
        const cat = googleCategory.toLowerCase()
        if (cat.includes("fiction") || cat.includes("novel")) return "Fiksi"
        if (cat.includes("education") || cat.includes("textbook") || cat.includes("study")) return "Pelajaran"
        if (cat.includes("reference") || cat.includes("encyclopedia")) return "Referensi"
        if (cat.includes("magazine") || cat.includes("periodical")) return "Majalah"
        return "Non-Fiksi"
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            judul: formData.judul,
            penulis: formData.penulis,
            penerbit: formData.penerbit || null,
            tahunTerbit: formData.tahunTerbit ? parseInt(formData.tahunTerbit) : null,
            isbn: formData.isbn || null,
            kategori: formData.kategori,
            kelas: formData.kelas ? parseInt(formData.kelas) : null,
            jumlahCopy: parseInt(formData.jumlahCopy) || 1,
            lokasi: formData.lokasi || null
        }

        try {
            if (editingBuku) {
                await fetch(`/api/buku/${editingBuku.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
            } else {
                await fetch("/api/buku", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
            }
            setShowModal(false)
            setEditingBuku(null)
            resetForm()
            fetchBuku()
        } catch (error) {
            console.error("Error saving buku:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (buku: Buku) => {
        setEditingBuku(buku)
        setFormData({
            judul: buku.judul,
            penulis: buku.penulis,
            penerbit: buku.penerbit || "",
            tahunTerbit: buku.tahunTerbit?.toString() || "",
            isbn: buku.isbn || "",
            kategori: buku.kategori,
            kelas: buku.kelas?.toString() || "",
            jumlahCopy: buku.jumlahCopy.toString(),
            lokasi: buku.lokasi || ""
        })
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus buku ini?")) return
        try {
            await fetch(`/api/buku/${id}`, { method: "DELETE" })
            fetchBuku()
        } catch (error) {
            console.error("Error deleting buku:", error)
        }
    }

    const resetForm = () => {
        setFormData({
            judul: "",
            penulis: "",
            penerbit: "",
            tahunTerbit: "",
            isbn: "",
            kategori: "Pelajaran",
            kelas: "",
            jumlahCopy: "1",
            lokasi: ""
        })
    }

    const handleExport = async () => {
        try {
            const res = await fetch("/api/buku/export")
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "Daftar_Buku_Perpustakaan.xlsx"
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error("Error exporting:", error)
            alert("Gagal export data")
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/buku/import", {
                method: "POST",
                body: formData
            })
            const data = await res.json()
            if (res.ok) {
                alert(data.message || `Berhasil import ${data.imported} buku`)
                fetchBuku()
            } else {
                alert(data.error || "Gagal import data")
            }
        } catch (error) {
            console.error("Error importing:", error)
            alert("Gagal import data")
        }
        // Reset file input
        e.target.value = ""
    }

    const filteredBuku = bukuList.filter(buku => {
        const matchSearch = buku.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
            buku.penulis.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (buku.isbn && buku.isbn.includes(searchQuery))
        const matchKategori = !filterKategori || buku.kategori === filterKategori
        const matchKelas = !filterKelas || buku.kelas === parseInt(filterKelas)
        return matchSearch && matchKategori && matchKelas
    })

    // Pagination logic
    const totalPages = Math.ceil(filteredBuku.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedBuku = filteredBuku.slice(startIndex, endIndex)

    // Reset to page 1 when filters change
    const handleFilterChange = () => {
        setCurrentPage(1)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📚 Perpustakaan Sekolah</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola koleksi buku perpustakaan sekolah</p>
                </div>
                {isAdmin && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowSearchModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                        >
                            🔍 Cari Online
                        </button>
                        <button
                            onClick={() => { resetForm(); setEditingBuku(null); setShowModal(true) }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                        >
                            + Tambah
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
                        >
                            📥 Export
                        </button>
                        <label className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm cursor-pointer">
                            📤 Import
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleImport}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Cari judul, penulis, atau ISBN..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterKategori}
                        onChange={(e) => { setFilterKategori(e.target.value); setCurrentPage(1) }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Semua Kategori</option>
                        {KATEGORI_BUKU.map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                    <select
                        value={filterKelas}
                        onChange={(e) => { setFilterKelas(e.target.value); setCurrentPage(1) }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Semua Kelas</option>
                        {[1, 2, 3, 4, 5, 6].map(k => (
                            <option key={k} value={k}>Kelas {k}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-blue-600">{bukuList.length}</p>
                    <p className="text-sm text-gray-500">Total Judul</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-green-600">{bukuList.reduce((a, b) => a + b.jumlahCopy, 0)}</p>
                    <p className="text-sm text-gray-500">Total Eksemplar</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-purple-600">{new Set(bukuList.map(b => b.kategori)).size}</p>
                    <p className="text-sm text-gray-500">Kategori</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-orange-600">{filteredBuku.length}</p>
                    <p className="text-sm text-gray-500">Hasil Pencarian</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Judul</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Penulis</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kategori</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Kelas</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Jumlah</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lokasi</th>
                                {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBuku.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                                        {searchQuery || filterKategori ? "Tidak ada buku yang cocok dengan pencarian" : "Belum ada data buku"}
                                    </td>
                                </tr>
                            ) : paginatedBuku.map(buku => (
                                <tr key={buku.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-900">{buku.judul}</p>
                                            {buku.isbn && <p className="text-xs text-gray-400">ISBN: {buku.isbn}</p>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{buku.penulis}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{buku.kategori}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {buku.kelas ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Kelas {buku.kelas}</span> : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center font-medium">{buku.jumlahCopy}</td>
                                    <td className="px-4 py-3 text-gray-600">{buku.lokasi || "-"}</td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handleEdit(buku)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                                            <button onClick={() => handleDelete(buku.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {filteredBuku.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-2 py-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                        ← Sebelumnya
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                // Show first, last, current, and pages around current
                                if (page === 1 || page === totalPages) return true
                                if (Math.abs(page - currentPage) <= 2) return true
                                return false
                            })
                            .map((page, idx, arr) => (
                                <span key={page} className="flex items-center">
                                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                                        <span className="px-2 text-gray-400">...</span>
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                </span>
                            ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                        Berikutnya →
                    </button>
                </div>
            )}

            {/* Online Search Modal */}
            {showSearchModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">🔍 Cari Buku Online</h2>
                            <p className="text-sm text-gray-500 mt-1">Cari berdasarkan judul, penulis, atau ISBN dari Google Books</p>
                        </div>
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Masukkan judul buku, nama penulis, atau ISBN..."
                                    value={onlineSearchQuery}
                                    onChange={(e) => setOnlineSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleOnlineSearch()}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    autoFocus
                                />
                                <button
                                    onClick={handleOnlineSearch}
                                    disabled={searching || !onlineSearchQuery.trim()}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {searching ? "Mencari..." : "Cari"}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {searchResults.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    {searching ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
                                            <p>Mencari buku...</p>
                                        </div>
                                    ) : (
                                        <p>Ketik judul buku atau ISBN untuk mencari</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {searchResults.map(result => (
                                        <div
                                            key={result.id}
                                            onClick={() => handleSelectSearchResult(result)}
                                            className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 cursor-pointer transition-colors"
                                        >
                                            {result.thumbnail && (
                                                <img
                                                    src={result.thumbnail}
                                                    alt={result.judul}
                                                    className="w-16 h-20 object-cover rounded shadow-sm flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 truncate">{result.judul}</h3>
                                                <p className="text-sm text-gray-600">{result.penulis}</p>
                                                <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                                                    {result.penerbit && <span>📖 {result.penerbit}</span>}
                                                    {result.tahunTerbit && <span>📅 {result.tahunTerbit}</span>}
                                                    {result.isbn && <span>🔢 {result.isbn}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center text-green-600">
                                                <span className="text-sm">Pilih →</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => { setShowSearchModal(false); setSearchResults([]); setOnlineSearchQuery("") }}
                                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">{editingBuku ? "Edit Buku" : "Tambah Buku Baru"}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Buku *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.judul}
                                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Penulis *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.penulis}
                                    onChange={(e) => setFormData({ ...formData, penulis: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Penerbit</label>
                                    <input
                                        type="text"
                                        value={formData.penerbit}
                                        onChange={(e) => setFormData({ ...formData, penerbit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Terbit</label>
                                    <input
                                        type="number"
                                        value={formData.tahunTerbit}
                                        onChange={(e) => setFormData({ ...formData, tahunTerbit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                                    <select
                                        value={formData.kategori}
                                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {KATEGORI_BUKU.map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                    <select
                                        value={formData.kelas}
                                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-</option>
                                        {[1, 2, 3, 4, 5, 6].map(k => (
                                            <option key={k} value={k}>Kelas {k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Copy</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.jumlahCopy}
                                        onChange={(e) => setFormData({ ...formData, jumlahCopy: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                                    <input
                                        type="text"
                                        value={formData.isbn}
                                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi/Rak</label>
                                    <input
                                        type="text"
                                        value={formData.lokasi}
                                        onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? "Menyimpan..." : editingBuku ? "Simpan Perubahan" : "Tambah Buku"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
