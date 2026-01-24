"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface Aset {
    id: string
    namaAset: string
    kib: string
    kategori: string
    jumlah: number
    kondisi: string
    lokasi: string | null
    tahunPerolehan: number
    sumberDana: string
    hargaPerolehan: number
    nilaiPerUnit: number | null
    buktiKepemilikan: string | null
    tanggalBeli: string | null
    keterangan: string | null
}

const KIB_OPTIONS = [
    { value: "A", label: "KIB A - Tanah" },
    { value: "B", label: "KIB B - Peralatan & Mesin" },
    { value: "C", label: "KIB C - Gedung & Bangunan" },
    { value: "D", label: "KIB D - Jalan, Irigasi & Jaringan" },
    { value: "E", label: "KIB E - Aset Tetap Lainnya" },
]

const KATEGORI_PER_KIB: Record<string, string[]> = {
    "A": ["Tanah Sekolah", "Tanah Lapangan", "Lainnya"],
    "B": ["Perabot", "Elektronik", "Alat Olahraga", "Alat Praktik", "Kendaraan", "Mesin", "Lainnya"],
    "C": ["Ruang Kelas", "Ruang Kantor", "Pagar", "Jamban/WC", "Gudang", "Lainnya"],
    "D": ["Instalasi Listrik", "Jaringan Internet", "Drainase", "Pipa Air", "Lainnya"],
    "E": ["Buku Perpustakaan", "Koleksi Seni", "Hewan/Tumbuhan", "Software", "Lainnya"],
}

const SUMBER_DANA = ["BOS Reguler", "BOS Kinerja", "Hibah Pusat", "Hibah Pemda", "Komite", "Lainnya"]
const KONDISI_ASET = ["Baik", "Rusak Ringan", "Rusak Berat"]

export default function AsetPage() {
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === "admin"

    const [asetList, setAsetList] = useState<Aset[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterKib, setFilterKib] = useState("")
    const [filterKondisi, setFilterKondisi] = useState("")
    const [filterSumberDana, setFilterSumberDana] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const [showModal, setShowModal] = useState(false)
    const [editingAset, setEditingAset] = useState<Aset | null>(null)
    const [saving, setSaving] = useState(false)

    const currentYear = new Date().getFullYear()
    const [formData, setFormData] = useState({
        namaAset: "",
        kib: "B",
        kategori: "Perabot",
        jumlah: "1",
        kondisi: "Baik",
        lokasi: "",
        tahunPerolehan: currentYear.toString(),
        sumberDana: "BOS Reguler",
        hargaPerolehan: "",
        nilaiPerUnit: "",
        buktiKepemilikan: "",
        tanggalBeli: "",
        keterangan: ""
    })

    const fetchAset = async () => {
        try {
            const res = await fetch("/api/aset")
            if (res.ok) {
                const data = await res.json()
                setAsetList(data)
            }
        } catch (error) {
            console.error("Error fetching aset:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAset()
    }, [])

    // Update kategori options when KIB changes
    useEffect(() => {
        const kategoriList = KATEGORI_PER_KIB[formData.kib] || []
        if (!kategoriList.includes(formData.kategori)) {
            setFormData(prev => ({ ...prev, kategori: kategoriList[0] || "" }))
        }
    }, [formData.kib])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            namaAset: formData.namaAset,
            kib: formData.kib,
            kategori: formData.kategori,
            jumlah: parseInt(formData.jumlah) || 1,
            kondisi: formData.kondisi,
            lokasi: formData.lokasi || null,
            tahunPerolehan: parseInt(formData.tahunPerolehan),
            sumberDana: formData.sumberDana,
            hargaPerolehan: parseFloat(formData.hargaPerolehan) || 0,
            nilaiPerUnit: formData.nilaiPerUnit ? parseFloat(formData.nilaiPerUnit) : null,
            buktiKepemilikan: formData.buktiKepemilikan || null,
            tanggalBeli: formData.tanggalBeli || null,
            keterangan: formData.keterangan || null
        }

        try {
            if (editingAset) {
                await fetch(`/api/aset/${editingAset.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
            } else {
                await fetch("/api/aset", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
            }
            setShowModal(false)
            setEditingAset(null)
            resetForm()
            fetchAset()
        } catch (error) {
            console.error("Error saving aset:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (aset: Aset) => {
        setEditingAset(aset)
        setFormData({
            namaAset: aset.namaAset,
            kib: aset.kib,
            kategori: aset.kategori,
            jumlah: aset.jumlah.toString(),
            kondisi: aset.kondisi,
            lokasi: aset.lokasi || "",
            tahunPerolehan: aset.tahunPerolehan.toString(),
            sumberDana: aset.sumberDana,
            hargaPerolehan: aset.hargaPerolehan.toString(),
            nilaiPerUnit: aset.nilaiPerUnit?.toString() || "",
            buktiKepemilikan: aset.buktiKepemilikan || "",
            tanggalBeli: aset.tanggalBeli ? aset.tanggalBeli.split("T")[0] : "",
            keterangan: aset.keterangan || ""
        })
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus aset ini?")) return
        try {
            await fetch(`/api/aset/${id}`, { method: "DELETE" })
            fetchAset()
        } catch (error) {
            console.error("Error deleting aset:", error)
        }
    }

    const resetForm = () => {
        setFormData({
            namaAset: "",
            kib: "B",
            kategori: "Perabot",
            jumlah: "1",
            kondisi: "Baik",
            lokasi: "",
            tahunPerolehan: currentYear.toString(),
            sumberDana: "BOS Reguler",
            hargaPerolehan: "",
            nilaiPerUnit: "",
            buktiKepemilikan: "",
            tanggalBeli: "",
            keterangan: ""
        })
    }

    const handleExport = async () => {
        try {
            const res = await fetch("/api/aset/export")
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "Data_Aset_Sekolah.xlsx"
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
            const res = await fetch("/api/aset/import", {
                method: "POST",
                body: formData
            })
            const data = await res.json()
            if (res.ok) {
                alert(data.message || `Berhasil import ${data.imported} aset`)
                fetchAset()
            } else {
                alert(data.error || "Gagal import data")
            }
        } catch (error) {
            console.error("Error importing:", error)
            alert("Gagal import data")
        }
        e.target.value = ""
    }

    const filteredAset = asetList.filter(aset => {
        const matchSearch = aset.namaAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (aset.lokasi && aset.lokasi.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (aset.buktiKepemilikan && aset.buktiKepemilikan.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchKib = !filterKib || aset.kib === filterKib
        const matchKondisi = !filterKondisi || aset.kondisi === filterKondisi
        const matchSumberDana = !filterSumberDana || aset.sumberDana === filterSumberDana
        return matchSearch && matchKib && matchKondisi && matchSumberDana
    })

    // Pagination
    const totalPages = Math.ceil(filteredAset.length / itemsPerPage)
    const paginatedAset = filteredAset.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // Statistics
    const totalNilai = asetList.reduce((acc, a) => acc + (a.hargaPerolehan * a.jumlah), 0)
    const totalByKib = KIB_OPTIONS.reduce((acc, kib) => {
        acc[kib.value] = asetList.filter(a => a.kib === kib.value).reduce((sum, a) => sum + (a.hargaPerolehan * a.jumlah), 0)
        return acc
    }, {} as Record<string, number>)

    const kondisiColor = (kondisi: string) => {
        switch (kondisi) {
            case "Baik": return "bg-green-100 text-green-700"
            case "Rusak Ringan": return "bg-yellow-100 text-yellow-700"
            case "Rusak Berat": return "bg-red-100 text-red-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const kibColor = (kib: string) => {
        const colors: Record<string, string> = {
            "A": "bg-emerald-100 text-emerald-700",
            "B": "bg-blue-100 text-blue-700",
            "C": "bg-orange-100 text-orange-700",
            "D": "bg-purple-100 text-purple-700",
            "E": "bg-pink-100 text-pink-700",
        }
        return colors[kib] || "bg-gray-100 text-gray-700"
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
                    <h1 className="text-2xl font-bold text-gray-900">📦 Data Aset Sekolah</h1>
                    <p className="text-gray-500 text-sm mt-1">Kartu Inventaris Barang (KIB) Sekolah</p>
                </div>
                {isAdmin && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { resetForm(); setEditingAset(null); setShowModal(true) }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            + Tambah
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                            📥 Export
                        </button>
                        <label className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm cursor-pointer">
                            📤 Import
                            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
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
                            placeholder="Cari nama, lokasi, atau bukti kepemilikan..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterKib}
                        onChange={(e) => { setFilterKib(e.target.value); setCurrentPage(1) }}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="">Semua KIB</option>
                        {KIB_OPTIONS.map(k => (
                            <option key={k.value} value={k.value}>{k.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterKondisi}
                        onChange={(e) => { setFilterKondisi(e.target.value); setCurrentPage(1) }}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="">Semua Kondisi</option>
                        {KONDISI_ASET.map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                    <select
                        value={filterSumberDana}
                        onChange={(e) => { setFilterSumberDana(e.target.value); setCurrentPage(1) }}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="">Semua Sumber</option>
                        {SUMBER_DANA.map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-blue-600">{asetList.length}</p>
                    <p className="text-sm text-gray-500">Total Aset</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-green-600">{asetList.reduce((a, b) => a + b.jumlah, 0)}</p>
                    <p className="text-sm text-gray-500">Total Unit</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xl font-bold text-purple-600">Rp {(totalNilai / 1000000).toFixed(1)}jt</p>
                    <p className="text-sm text-gray-500">Total Nilai</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-emerald-600">{asetList.filter(a => a.kondisi === "Baik").length}</p>
                    <p className="text-sm text-gray-500">Kondisi Baik</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-yellow-600">{asetList.filter(a => a.kondisi === "Rusak Ringan").length}</p>
                    <p className="text-sm text-gray-500">Rusak Ringan</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-red-600">{asetList.filter(a => a.kondisi === "Rusak Berat").length}</p>
                    <p className="text-sm text-gray-500">Rusak Berat</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama Aset</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">KIB</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kategori</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Jml</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Kondisi</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Harga</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sumber</th>
                                {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedAset.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                                        {searchQuery || filterKib || filterKondisi || filterSumberDana ? "Tidak ada aset yang cocok" : "Belum ada data aset"}
                                    </td>
                                </tr>
                            ) : paginatedAset.map(aset => (
                                <tr key={aset.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-900">{aset.namaAset}</p>
                                            <p className="text-xs text-gray-400">{aset.lokasi || "-"} • {aset.tahunPerolehan}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${kibColor(aset.kib)}`}>{aset.kib}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{aset.kategori}</td>
                                    <td className="px-4 py-3 text-center font-medium">{aset.jumlah}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full ${kondisiColor(aset.kondisi)}`}>{aset.kondisi}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm">Rp {aset.hargaPerolehan.toLocaleString("id-ID")}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{aset.sumberDana}</td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handleEdit(aset)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                                            <button onClick={() => handleDelete(aset.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {filteredAset.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-2 py-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-300"
                    >
                        ← Sebelumnya
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                            .map((page, idx, arr) => (
                                <span key={page} className="flex items-center">
                                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-2 text-gray-400">...</span>}
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        {page}
                                    </button>
                                </span>
                            ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-300"
                    >
                        Berikutnya →
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">{editingAset ? "Edit Aset" : "Tambah Aset Baru"}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Aset *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.namaAset}
                                    onChange={(e) => setFormData({ ...formData, namaAset: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis KIB *</label>
                                    <select
                                        value={formData.kib}
                                        onChange={(e) => setFormData({ ...formData, kib: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        {KIB_OPTIONS.map(k => (
                                            <option key={k.value} value={k.value}>{k.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                                    <select
                                        value={formData.kategori}
                                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        {(KATEGORI_PER_KIB[formData.kib] || []).map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.jumlah}
                                        onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi *</label>
                                    <select
                                        value={formData.kondisi}
                                        onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        {KONDISI_ASET.map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                                    <input
                                        type="text"
                                        value={formData.lokasi}
                                        onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Ruang/lokasi"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Perolehan *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1900"
                                        max={currentYear}
                                        value={formData.tahunPerolehan}
                                        onChange={(e) => setFormData({ ...formData, tahunPerolehan: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sumber Dana *</label>
                                    <select
                                        value={formData.sumberDana}
                                        onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        {SUMBER_DANA.map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Perolehan (Rp) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.hargaPerolehan}
                                        onChange={(e) => setFormData({ ...formData, hargaPerolehan: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Harga beli awal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Kepemilikan</label>
                                    <input
                                        type="text"
                                        value={formData.buktiKepemilikan}
                                        onChange={(e) => setFormData({ ...formData, buktiKepemilikan: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="No. Faktur/Nota/Sertifikat"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                <textarea
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? "Menyimpan..." : editingAset ? "Simpan" : "Tambah"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
