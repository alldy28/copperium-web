"use client";

import React, { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  getStockists,
  addStockist,
  updateStockist,
  deleteStockist,
} from "../actions";

// Interface Data
interface Stockist {
  id: number;
  stockist_id: string;
  name: string;
  phone: string;
  domicile: string;
  email: string;
  social: string;
  profile_picture: string;
}

// Interface untuk Cropper agar TypeScript tidak protes 'any'
interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- UTILITY: Fungsi untuk memotong gambar menggunakan Canvas ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return canvas.toDataURL("image/jpeg", 0.8);
}
// ----------------------------------------------------------------

export default function StockistPage() {
  const [stockists, setStockists] = useState<Stockist[]>([]);
  const [formData, setFormData] = useState({
    stockist_id: "",
    name: "",
    phone: "",
    domicile: "",
    email: "",
    social: "",
    profile_picture: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- STATE UNTUK CROPPER ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null,
  );

  // FETCH DATA
  useEffect(() => {
    let isMounted = true;
    const fetchStockists = async () => {
      const data = await getStockists();
      if (isMounted) setStockists(data);
    };
    fetchStockists();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // --- HANDLER UPLOAD & CROP ---
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader(); // Diubah jadi const
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      setImageSrc(imageDataUrl);
    }
  };

  const onCropComplete = useCallback(
    (_croppedArea: PixelCrop, croppedAreaPixels: PixelCrop) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const saveCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedImageBase64 = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
      );
      setFormData({ ...formData, profile_picture: croppedImageBase64 });
      setImageSrc(null); // Tutup Modal
    } catch (e) {
      console.error(e);
    }
  };

  // --- HANDLER FORM (CRUD) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateStockist(editingId, formData);
      setEditingId(null);
    } else {
      await addStockist(formData);
    }
    setFormData({
      stockist_id: "",
      name: "",
      phone: "",
      domicile: "",
      email: "",
      social: "",
      profile_picture: "",
    });
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEdit = (item: Stockist) => {
    setEditingId(item.id);
    setFormData({
      stockist_id: item.stockist_id || "",
      name: item.name,
      phone: item.phone,
      domicile: item.domicile,
      email: item.email,
      social: item.social || "",
      profile_picture: item.profile_picture || "",
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Hapus stokis ini?")) {
      await deleteStockist(id);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="p-6 bg-[#050505] min-h-screen text-white font-sans relative">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#d4af37] mb-8">
          Manajemen Jaringan Stokis
        </h2>

        {/* FORM INPUT */}
        <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 mb-10 flex flex-col md:flex-row gap-8 shadow-xl">
          {/* KOLOM UPLOAD FOTO (KIRI) */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-4 bg-black/50">
            {formData.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formData.profile_picture}
                alt="Preview"
                className="w-full aspect-4/3 object-cover rounded-lg mb-4 shadow-lg border border-[#d4af37]/30"
              />
            ) : (
              <div className="w-full aspect-4/3 bg-gray-900 rounded-lg mb-4 flex items-center justify-center text-gray-500 text-sm border border-gray-800">
                Belum ada foto (4:3)
              </div>
            )}
            <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-gray-600">
              Pilih Foto Profil
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* KOLOM INPUT TEKS (KANAN) */}
          <form
            onSubmit={handleSubmit}
            className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <input
              placeholder="ID Stokis (Contoh: STK-001)"
              name="stockist_id"
              value={formData.stockist_id}
              onChange={(e) =>
                setFormData({ ...formData, stockist_id: e.target.value })
              }
              className="bg-black border border-gray-700 p-3 rounded-lg focus:border-[#d4af37] outline-none"
              required
            />
            <input
              placeholder="Nama Stokis"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-black border border-gray-700 p-3 rounded-lg focus:border-[#d4af37] outline-none"
              required
            />
            <input
              placeholder="Nomor Telepon"
              name="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="bg-black border border-gray-700 p-3 rounded-lg focus:border-[#d4af37] outline-none"
              required
            />
            <input
              placeholder="Domisili (Kota)"
              name="domicile"
              value={formData.domicile}
              onChange={(e) =>
                setFormData({ ...formData, domicile: e.target.value })
              }
              className="bg-black border border-gray-700 p-3 rounded-lg focus:border-[#d4af37] outline-none"
              required
            />
            <input
              placeholder="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="bg-black border border-gray-700 p-3 rounded-lg focus:border-[#d4af37] outline-none"
              required
            />
            <input
              placeholder="Sosial Media (IG/FB)"
              name="social"
              value={formData.social}
              onChange={(e) =>
                setFormData({ ...formData, social: e.target.value })
              }
              className="bg-black border border-gray-700 p-3 rounded-lg focus:border-[#d4af37] outline-none"
            />

            {/* Update Tailwind Class (bg-linear-to-r) */}
            <button
              type="submit"
              className="sm:col-span-2 bg-linear-to-r from-[#b87333] to-[#d4af37] text-black font-bold py-3 rounded-lg mt-2 hover:scale-[1.02] transition-transform"
            >
              {editingId ? "Update Data Stokis" : "Simpan Data Stokis"}
            </button>
          </form>
        </div>

        {/* TABEL DATA */}
        <div className="bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-x-auto">
          <table className="w-full text-left min-w-max">
            <thead className="bg-black/50 border-b border-gray-800">
              <tr>
                <th className="p-4 text-[#d4af37]">Foto</th>
                <th className="p-4 text-[#d4af37]">ID Stokis</th>
                <th className="p-4 text-[#d4af37]">Nama</th>
                <th className="p-4 text-[#d4af37]">No. Telepon</th>
                <th className="p-4 text-[#d4af37]">Domisili</th>
                <th className="p-4 text-[#d4af37]">Email</th>
                <th className="p-4 text-[#d4af37]">Sosmed</th>
                <th className="p-4 text-[#d4af37] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stockists.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-900 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    {s.profile_picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.profile_picture}
                        alt={s.name}
                        className="w-16 h-12 object-cover rounded border border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-xs text-gray-500">
                        No Img
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-[#f3e5ab] font-mono">
                    {s.stockist_id}
                  </td>
                  <td className="p-4 font-semibold">{s.name}</td>
                  <td className="p-4 text-gray-400">{s.phone}</td>
                  <td className="p-4 text-gray-400">{s.domicile}</td>
                  <td className="p-4 text-gray-400">{s.email}</td>
                  <td className="p-4 text-gray-400">{s.social}</td>
                  <td className="p-4 flex items-center justify-center gap-4 h-full pt-6">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-500 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stockists.length === 0 && (
            <p className="p-8 text-center text-gray-500 italic">
              Belum ada data stokis.
            </p>
          )}
        </div>
      </div>

      {/* MODAL CROPPER */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-[#111] w-full max-w-xl rounded-2xl p-6 border border-gray-700 shadow-2xl flex flex-col">
            <h3 className="text-xl text-[#d4af37] font-bold mb-4">
              Sesuaikan Foto (Rasio 4:3)
            </h3>

            <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden mb-6">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="flex justify-between items-center gap-4">
              <button
                onClick={() => setImageSrc(null)}
                className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                onClick={saveCroppedImage}
                className="px-6 py-2 rounded-lg bg-[#d4af37] text-black font-bold hover:bg-[#b87333]"
              >
                Potong & Gunakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
