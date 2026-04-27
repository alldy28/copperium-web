/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  getProducts,
  addMasterProduct,
  deleteMasterProduct,
  updateMasterProduct,
} from "../actions";
import {
  Trash2,
  Plus,
  Loader2,
  QrCode,
  X,
  Check,
  Edit3,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { getCurrentRole } from "../login/actions";

export default function ProductMasterPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // STATE UNTUK MENYIMPAN ROLE (Agar aman di Client Component)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [modalType, setModalType] = useState<
    "NONE" | "ADD_PRODUCT" | "EDIT_PRODUCT"
  >("NONE");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    weight: 0,
    description: "",
    production_date: "",
    image: "",
    finest: "99.9%",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Panggil data produk dan role secara bersamaan
      const [data, role] = await Promise.all([getProducts(), getCurrentRole()]);

      setProducts(data || []);
      setIsSuperAdmin(role === "SUPERADMIN"); // Set role ke state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProduct = async () => {
    if (!productForm.name) return alert("Nama produk wajib diisi");
    setLoading(true);
    const res = await addMasterProduct(productForm);
    if (res.success) {
      setModalType("NONE");
      setProductForm({
        name: "",
        weight: 0,
        description: "",
        production_date: "",
        image: "",
        finest: "99.9%",
      });
      loadData();
    }
  };

  const handleEditProduct = (product: any) => {
    setSelectedId(product.id);
    setProductForm({
      name: product.name,
      weight: product.weight,
      description: product.description || "",
      production_date: product.production_date
        ? new Date(product.production_date).toISOString().split("T")[0]
        : "",
      image: product.image || "",
      finest: product.finest || "99.9%",
    });
    setModalType("EDIT_PRODUCT");
  };

  const handleUpdateProduct = async () => {
    if (!selectedId) return;
    setLoading(true);
    const res = await updateMasterProduct(selectedId, productForm);
    if (res.success) {
      setModalType("NONE");
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
              Master <span className="text-cyan-400">Products</span>
            </h1>
            <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase">
              Core Inventory System
            </p>
          </div>

          {/* SEMBUNYIKAN TOMBOL ADD JIKA BUKAN SUPER ADMIN */}
          {isSuperAdmin && (
            <button
              onClick={() => {
                setProductForm({
                  name: "",
                  weight: 0,
                  description: "",
                  production_date: "",
                  image: "",
                  finest: "99.9%",
                });
                setModalType("ADD_PRODUCT");
              }}
              className="bg-white text-black px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <Plus size={20} /> NEW MASTER
            </button>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black tracking-widest text-cyan-400 uppercase">
              <tr>
                <th className="p-6">Product Details</th>
                <th className="p-6">Specs</th>
                <th className="p-6 text-center">Batch Status</th>
                <th className="p-6 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && products.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-10 text-center text-white/30 italic text-xs tracking-widest uppercase"
                  >
                    Loading Database...
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="group hover:bg-white/[0.01]">
                    <td className="p-6">
                      <div className="font-bold text-lg">{p.name}</div>
                      <div className="flex items-center gap-2 text-white/30 text-xs mt-1 font-mono">
                        <Calendar size={12} />{" "}
                        {p.production_date
                          ? new Date(p.production_date)
                              .toISOString()
                              .split("T")[0]
                          : "---"}
                      </div>
                    </td>
                    <td className="p-6 font-mono">
                      <div className="text-cyan-400 font-bold">{p.weight}g</div>
                      <div className="text-[10px] opacity-40 uppercase tracking-widest">
                        {p.finest} Finest
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-black tracking-tighter">
                        {p.total_kepingan} UNITS GENERATED
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        {/* TOMBOL QR BISA DIAKSES OLEH SEMUA ROLE */}
                        <Link
                          href={`/qrcode?productId=${p.id}&name=${encodeURIComponent(p.name)}`}
                          className="p-3 bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-all"
                          title="Manage QR Batch"
                        >
                          <QrCode size={18} />
                        </Link>

                        {/* TOMBOL EDIT & DELETE HANYA UNTUK SUPER ADMIN */}
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="p-3 bg-white/5 hover:bg-yellow-500/10 hover:text-yellow-400 rounded-lg transition-all"
                              title="Edit Product"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  confirm("Hapus master dan semua kepingan?")
                                ) {
                                  await deleteMasterProduct(p.id);
                                  loadData();
                                }
                              }}
                              className="p-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Logic (Add/Edit) - Hanya bisa dibuka kalau Super Admin */}
        {isSuperAdmin &&
          (modalType === "ADD_PRODUCT" || modalType === "EDIT_PRODUCT") && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-[#0D0D0D] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-xl">
                <h2 className="text-2xl font-black italic uppercase text-cyan-400 mb-8">
                  {modalType === "ADD_PRODUCT"
                    ? "Register Master"
                    : "Update Master"}
                </h2>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-white/40 mb-2 block tracking-widest">
                      PRODUCT_NAME
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-cyan-500 font-bold"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 mb-2 block tracking-widest">
                      WEIGHT_G
                    </label>
                    <input
                      type="number"
                      step="0.01" // <--- PERBAIKAN 1: Mengizinkan desimal hingga 2 angka di belakang koma
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-cyan-500 font-mono"
                      value={productForm.weight || ""}
                      onChange={(e) => {
                        // PERBAIKAN 2: Menggunakan parseFloat agar titik (.) terbaca
                        const val = parseFloat(e.target.value);
                        setProductForm({
                          ...productForm,
                          weight: isNaN(val) ? 0 : val, // Jika input kosong, kembalikan ke 0
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 mb-2 block tracking-widest">
                      FINISH_FINEST
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-cyan-500 font-mono"
                      value={productForm.finest}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          finest: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-white/40 mb-2 block tracking-widest">
                      PRODUCTION_DATE
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-cyan-500 font-mono text-white"
                      style={{ colorScheme: "dark" }}
                      value={productForm.production_date}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          production_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setModalType("NONE")}
                    className="flex-1 py-4 text-xs font-black opacity-20 hover:opacity-100 uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all"
                  >
                    Abort
                  </button>
                  <button
                    onClick={
                      modalType === "ADD_PRODUCT"
                        ? handleCreateProduct
                        : handleUpdateProduct
                    }
                    className="flex-[2] bg-cyan-500 hover:bg-cyan-400 transition-colors text-black py-4 rounded-2xl font-black tracking-widest uppercase flex justify-center items-center gap-2"
                  >
                    <Check size={18} />{" "}
                    {modalType === "ADD_PRODUCT"
                      ? "Commence Registry"
                      : "Execute Update"}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
