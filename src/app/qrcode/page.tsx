/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
// PASTIKAN markKepinganAsDownloaded SUDAH ADA DI actions.ts ANDA
import {
  getKepinganByProduct,
  generateKepingan,
  markKepinganAsDownloaded,
} from "../actions";
import { Download, Loader2, ArrowLeft, Plus, QrCode } from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function QrManagementContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const productName = searchParams.get("name") || "Unknown Product";

  const [kepingans, setKepingans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCount, setQrCount] = useState<number | string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  // --- 1. LOAD DATA ANTREAN (Hanya yang berstatus NEW) ---
  const loadKepingan = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await getKepinganByProduct(parseInt(productId));
      setKepingans(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadKepingan();
  }, [loadKepingan]);

  // --- 2. GENERATE BATCH BARI ---
  const handleGenerate = async () => {
    const count =
      typeof qrCount === "number" ? qrCount : parseInt(qrCount as string) || 0;
    if (!productId || count < 1) return;

    setLoading(true);
    try {
      const res = await generateKepingan(parseInt(productId), count);
      if (res.success) {
        setQrCount(""); // Kosongkan input setelah sukses generate
        await loadKepingan(); // Tarik data baru ke layar
      } else {
        alert("Error: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (kepingans.length === 0) return alert("Tidak ada data untuk didownload");

    setIsDownloading(true);
    const zip = new JSZip();
    const QRCode = await import("qrcode");

    try {
      // PROSES MENGGAMBAR KE CANVAS
      for (const item of kepingans) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 600;
        canvas.height = 300;
        if (!ctx) continue;

        // Background Putih
        ctx.fillStyle = "#FFFFFF"; // <-- DIUBAH MENJADI PUTIH
        ctx.fillRect(0, 0, 600, 300);

        // Wadah QR Putih (opsional: bisa dihilangkan/diubah warnanya agar kontras,
        // tapi jika background sudah putih, ini hanya menegaskan area QR)
        ctx.fillStyle = "#F0F0F0";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(30, 40, 220, 220, 20);
        } else {
          ctx.fillRect(30, 40, 220, 220); // Fallback browser lama
        }
        ctx.fill();

        // (Opsional) Tambahkan border pada wadah QR agar terlihat batasnya di background putih
        // ctx.strokeStyle = "#FFFFFF";
        // ctx.lineWidth = 2;
        // ctx.stroke();

        // Generate QR Image
        const qrValue = `https://app.copperium.id/verif/${item.uuid}`;
        const qrDataUrl = await QRCode.toDataURL(qrValue, {
          margin: 1,
          width: 190,
          color: { dark: "#000000", light: "#FFFFFF" },
        });

        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((res) => {
          qrImg.onload = res;
        });
        ctx.drawImage(qrImg, 45, 55, 190, 190);

        // Teks Informasi
        ctx.textBaseline = "top";

        ctx.fillStyle = "#0088CC"; // <-- Diubah sedikit agar lebih kontras di bg putih
        ctx.font = "bold 15px Arial";
        ctx.fillText("ASSET ID", 290, 60);
        ctx.fillStyle = "#000000"; // <-- Teks diubah menjadi Hitam
        ctx.font = "bold 35px monospace";
        ctx.fillText(item.uuid, 290, 80);

        ctx.fillStyle = "#0088CC"; // <-- Diubah sedikit agar lebih kontras di bg putih
        ctx.font = "bold 15px Arial";
        ctx.fillText("SPECIFICATION", 290, 130);
        ctx.fillStyle = "#000000"; // <-- Teks diubah menjadi Hitam
        ctx.font = "bold 35px monospace";
        ctx.fillText(`${item.weight}g | ${item.finest}`, 290, 150);

        ctx.fillStyle = "#FF7700"; // <-- Diubah sedikit agar lebih kontras di bg putih
        ctx.font = "bold 15px Arial";
        ctx.fillText("VALIDATION CODE", 290, 200);
        ctx.fillStyle = "#000000"; // <-- Teks diubah menjadi Hitam
        ctx.font = "900 45px monospace";
        ctx.fillText(item.validation_code, 290, 220);

        const imgData = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`${item.uuid}.png`, imgData, { base64: true });
      }

      // 1. Download file ZIP-nya
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `BATCH_${productName.replace(/\s+/g, "_")}.zip`);

      // 2. Kumpulkan semua UUID yang baru saja sukses didownload
      const uuidsToUpdate = kepingans.map((k) => k.uuid);

      // 3. Ubah statusnya di database menjadi 'DOWNLOADED'
      const updateRes = await markKepinganAsDownloaded(uuidsToUpdate);

      if (updateRes.success) {
        // 4. BERSIHKAN LAYAR & KOTAK INPUT
        setKepingans([]);
        setQrCount("");
        alert("Batch berhasil didownload! Antrean layar telah dibersihkan.");
      } else {
        alert("Download berhasil, tapi gagal mengupdate status di database.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memproses gambar. Periksa konsol.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-white/30 hover:text-cyan-400 mb-8 transition-all group font-bold text-xs tracking-widest"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          BACK TO INVENTORY
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
              {productName}
            </h1>
            <p className="text-cyan-400 font-mono text-[10px] tracking-[0.3em] uppercase mt-2">
              Print Queue Management
            </p>
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading || kepingans.length === 0}
            className="w-full md:w-auto bg-green-500 hover:bg-green-400 disabled:opacity-30 text-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
            {isDownloading
              ? "PROCESSING..."
              : `DOWNLOAD ${kepingans.length} LABELS (ZIP)`}
          </button>
        </div>

        {/* Control Panel */}
        <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] mb-12 flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/3">
            <label className="text-[10px] font-black text-white/30 block mb-3 tracking-widest uppercase text-center md:text-left">
              Minting Quantity
            </label>
            <input
              type="number"
              value={qrCount}
              onChange={(e) =>
                setQrCount(e.target.value ? parseInt(e.target.value) : "")
              }
              placeholder="0"
              className="w-full bg-black border border-white/10 p-5 rounded-2xl text-center text-3xl font-black outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="hidden md:block h-16 w-[1px] bg-white/10" />
          <div className="flex-1">
            <p className="text-white/40 text-sm mb-4 italic text-center md:text-left">
              Masukkan jumlah kepingan baru yang ingin dicetak. Setelah
              di-download, data akan masuk ke Global Registry dan hilang dari
              antrean ini.
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-white text-black py-5 rounded-2xl font-black hover:bg-cyan-400 transition-all flex justify-center items-center gap-2 shadow-xl shadow-white/5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Plus size={20} />
              )}{" "}
              EXECUTE MINTING PROTOCOL
            </button>
          </div>
        </div>

        {/* Kepingan Grid (Antrean) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading && kepingans.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-20 italic tracking-widest uppercase text-xs">
              Accessing Queue Database...
            </div>
          ) : kepingans.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-40 italic tracking-widest text-sm border border-dashed border-white/10 rounded-3xl">
              TIDAK ADA ANTREAN CETAK
            </div>
          ) : (
            kepingans.map((k) => (
              <div
                key={k.uuid}
                className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-cyan-500/30 transition-all group relative overflow-hidden"
              >
                {/* Badge NEW */}
                <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[8px] font-black px-3 py-1 rounded-bl-lg tracking-widest">
                  NEW
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <QrCode size={16} />
                  </div>
                </div>
                <div className="font-mono font-black text-xl tracking-tighter mb-1 group-hover:text-cyan-400 transition-colors">
                  {k.uuid}
                </div>
                <div className="text-[10px] font-black tracking-widest text-orange-500 bg-orange-500/10 inline-block px-2 py-0.5 rounded uppercase">
                  PIN: {k.validation_code}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Parent component for Suspense
export default function QrManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white font-black italic uppercase tracking-[0.5em] opacity-20 animate-pulse text-xl">
          Initializing Node...
        </div>
      }
    >
      <QrManagementContent />
    </Suspense>
  );
}
