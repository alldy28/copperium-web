/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getAllKepingan } from "../actions";
import {
  Loader2,
  Search,
  QrCode,
  Database,
  ArrowLeft,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function GlobalQrListPage() {
  // State untuk menyimpan data array (maksimal 20 baris per halaman)
  const [data, setData] = useState<any[]>([]);
  // State untuk menyimpan total keseluruhan data dari database
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  // State Pencarian & Debounce
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // 1. Efek Debounce: Menunda hit ke server sampai user selesai mengetik 0.5 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset ke halaman 1 setiap kali kata kunci berubah
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. Fungsi Fetch Data dari Server
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Panggil backend dengan parameter
      const response = await getAllKepingan({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
      });

      // PERBAIKAN ERROR TYPESCRIPT ADA DI SINI:
      // Kita pecah response menjadi data (array) dan total (number)
      if (response) {
        setData(response.data || []);
        setTotalRecords(response.total || 0);
      } else {
        setData([]);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error(error);
      setData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  // Tarik data saat halaman pertama dimuat atau saat page/search berubah
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hitung total halaman yang tersedia
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Tombol Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/30 hover:text-cyan-400 mb-8 transition-all group font-bold text-xs tracking-widest"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          BACK TO DASHBOARD
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Database className="text-cyan-400" size={24} />
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                Global <span className="text-cyan-400">Registry</span>
              </h1>
            </div>
            <p className="text-white/40 font-mono text-[10px] tracking-[0.3em] uppercase">
              All Minted Kepingan Database
            </p>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 px-6 py-3 rounded-2xl flex items-center gap-4">
            <div className="text-cyan-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-widest uppercase text-white/50">
                Total Global Records
              </div>
              <div className="text-xl font-black font-mono leading-none">
                {totalRecords.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl mb-8 flex items-center gap-4 focus-within:border-cyan-500/50 transition-colors">
          <Search className="text-white/30 ml-2" size={20} />
          <input
            type="text"
            placeholder="Cari berdasarkan UUID, Nama Produk, atau PIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/20 font-mono"
          />
          {loading && (
            <Loader2 className="animate-spin text-cyan-500 mr-2" size={20} />
          )}
        </div>

        {/* Table Data */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black tracking-widest text-cyan-400 uppercase whitespace-nowrap">
                <tr>
                  <th className="p-6">Asset ID (UUID)</th>
                  <th className="p-6">Master Product</th>
                  <th className="p-6 text-center">Security PIN</th>
                  <th className="p-6 text-right">Mint Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-24 text-center">
                      <Loader2
                        className="animate-spin mx-auto text-cyan-500 mb-4"
                        size={32}
                      />
                      <span className="text-[10px] tracking-widest opacity-20 uppercase">
                        Fetching Data...
                      </span>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-24 text-center text-white/20 italic tracking-widest text-sm uppercase"
                    >
                      NO RECORDS FOUND
                    </td>
                  </tr>
                ) : (
                  data.map((k) => (
                    <tr
                      key={k.uuid}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded-lg text-white/40 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                            <QrCode size={16} />
                          </div>
                          <span className="font-mono font-bold text-lg">
                            {k.uuid}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 font-bold text-white/80">
                        {k.product_name}
                      </td>
                      <td className="p-6 text-center">
                        <span className="px-3 py-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-md font-mono font-black text-sm tracking-[0.2em]">
                          {k.validation_code}
                        </span>
                      </td>
                      <td className="p-6 text-right font-mono text-[10px] text-white/40 uppercase">
                        {new Date(k.created_at).toLocaleString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalRecords > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
            <div className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} of{" "}
              {totalRecords.toLocaleString("id-ID")} entries
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/60 hover:text-cyan-400 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="px-4 font-mono text-xs font-bold">
                PAGE {currentPage} <span className="text-white/30 mx-1">/</span>{" "}
                {totalPages || 1}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage >= totalPages || loading}
                className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/60 hover:text-cyan-400 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
