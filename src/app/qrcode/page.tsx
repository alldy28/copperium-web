/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  const [isDownloadingFull, setIsDownloadingFull] = useState(false);
  const [isDownloadingQrOnly, setIsDownloadingQrOnly] = useState(false);

  // --- 1. LOAD DATA ANTREAN ---
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

  // --- 2. GENERATE BATCH BARU ---
  const handleGenerate = async () => {
    const count =
      typeof qrCount === "number" ? qrCount : parseInt(qrCount as string) || 0;
    if (!productId || count < 1) return;

    setLoading(true);
    try {
      const res = await generateKepingan(parseInt(productId), count);
      if (res.success) {
        setQrCount("");
        await loadKepingan();
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

  // --- 3. DOWNLOAD BATCH ZIP (TEMPLATE LAMA: FULL CARD) ---
  const handleDownloadFullZip = async () => {
    if (kepingans.length === 0) return alert("Tidak ada data untuk didownload");

    setIsDownloadingFull(true);
    const zip = new JSZip();
    const QRCode = await import("qrcode");

    let csvContent = "UUID,Link_QR,Kode_Validasi,ID_Produk,Nama_Produk\n";

    // Fungsi helper agar teks otomatis mengecil jika kepanjangan
    const drawAutoShrinkText = (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      defaultFontSize: number,
      fontWeight: string,
      fontFamily: string,
      maxWidth: number,
    ) => {
      let fontSize = defaultFontSize;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

      while (ctx.measureText(text).width > maxWidth && fontSize > 10) {
        fontSize -= 1;
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      }

      ctx.fillText(text, x, y);
    };

    try {
      for (const item of kepingans) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // 1. Padding 5px: Ukuran kanvas diperkecil disesuaikan dengan padding tipis
        canvas.width = 520;
        canvas.height = 230;
        if (!ctx) continue;

        // Kosongkan kanvas agar pinggiran membulat menjadi transparan (bolong)
        ctx.clearRect(0, 0, 520, 230);

        // 2. Potong (Clip) seluruh kanvas agar ujungnya membulat
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(0, 0, 520, 230, 20); // Corner Radius disesuaikan
        } else {
          ctx.rect(0, 0, 520, 230);
        }
        ctx.clip();

        // Background Utama
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 520, 230);

        // Wadah QR (Merapat ke pinggir kiri dan atas dengan jarak tepat 5px)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(5, 5, 220, 220, 16); // X: 5, Y: 5
        } else {
          ctx.fillRect(5, 5, 220, 220);
        }
        ctx.fill();

        // Generate QR Image
        const qrValue = `https://app.copperium.id/verif/${item.uuid}`;
        csvContent += `${item.uuid},${qrValue},${item.validation_code},${productId},"${productName}"\n`;

        const qrDataUrl = await QRCode.toDataURL(qrValue, {
          margin: 1,
          width: 210, // Dibesarkan sedikit agar padding di dalam kotak QR juga 5px
          color: { dark: "#000000", light: "#FFFFFF" },
        });

        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((res) => {
          qrImg.onload = res;
        });

        // Gambar QR (Offset 5px dari titik X=5, Y=5 wadah -> menjadi 10, 10)
        ctx.drawImage(qrImg, 10, 10, 210, 210);

        // --- TEKS INFORMASI ---
        ctx.textBaseline = "top";
        ctx.textAlign = "left";

        // Teks dimulai dari X: 240 (5 padding kiri + 220 lebar QR + 15 jarak pemisah tengah)
        const textX = 240;

        // Lebar maksimal 275 (X: 240 + Lebar: 275 = 515, sisa tepat 5px padding kanan dari total kanvas 520)
        const textMaxWidth = 275;

        // 1. ASSET ID (Padding atas 15px agar seimbang dengan tulisan di bawahnya)
        ctx.fillStyle = "#0088CC";
        ctx.font = "bold 15px Arial";
        ctx.fillText("ASSET ID", textX, 20);

        ctx.fillStyle = "#000000";
        drawAutoShrinkText(
          ctx,
          item.uuid,
          textX,
          43,
          35,
          "bold",
          "monospace",
          textMaxWidth,
        );

        // 2. SPECIFICATION (Posisi Y dirapikan ke 95 agar tidak menabrak)
        ctx.fillStyle = "#0088CC";
        ctx.font = "bold 15px Arial";
        ctx.fillText("SPECIFICATION", textX, 84);

        ctx.fillStyle = "#000000";
        const specText = `${item.weight}g|${item.finest}`;
        drawAutoShrinkText(
          ctx,
          specText,
          textX,
          106,
          35,
          "bold",
          "monospace",
          textMaxWidth,
        );

        // 3. VALIDATION CODE
        ctx.fillStyle = "#FF7700";
        ctx.font = "bold 15px Arial";
        ctx.fillText("VALIDATION CODE", textX, 148);

        ctx.fillStyle = "#000000";
        drawAutoShrinkText(
          ctx,
          item.validation_code,
          textX,
          166,
          45,
          "900",
          "monospace",
          textMaxWidth,
        );

        const imgData = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`${item.uuid}_FULL.png`, imgData, { base64: true });
      }

      zip.file(`DATA_KODE_${productName.replace(/\s+/g, "_")}.csv`, csvContent);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `BATCH_FULL_${productName.replace(/\s+/g, "_")}.zip`);

      const uuidsToUpdate = kepingans.map((k) => k.uuid);
      const updateRes = await markKepinganAsDownloaded(uuidsToUpdate);

      if (updateRes.success) {
        setKepingans([]);
        setQrCount("");
        alert(
          "Batch Full Card berhasil didownload! File ZIP berisi gambar dan file Excel (CSV).",
        );
      } else {
        alert("Download berhasil, tapi gagal mengupdate status.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memproses gambar.");
    } finally {
      setIsDownloadingFull(false);
    }
  };

  // --- 4. DOWNLOAD BATCH ZIP (TEMPLATE BARU: QR ONLY) ---
  const handleDownloadQrOnlyZip = async () => {
    if (kepingans.length === 0) return alert("Tidak ada data untuk didownload");

    setIsDownloadingQrOnly(true);
    const zip = new JSZip();
    const QRCode = await import("qrcode");

    // Header untuk file CSV
    let csvContent = "UUID,Link_QR,Kode_Validasi,ID_Produk,Nama_Produk\n";

    try {
      for (const item of kepingans) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Ukuran Kotak Persegi (hanya untuk QR)
        canvas.width = 300;
        canvas.height = 300;
        if (!ctx) continue;

        // Background Putih
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 300, 300);

        // Generate QR Image
        const qrValue = `https://app.copperium.id/verif/${item.uuid}`;

        // Tambahkan data ke baris CSV
        csvContent += `${item.uuid},${qrValue},${item.validation_code},${productId},"${productName}"\n`;

        const qrDataUrl = await QRCode.toDataURL(qrValue, {
          margin: 1, // Margin bawaan QR
          width: 260,
          color: { dark: "#000000", light: "#FFFFFF" },
        });

        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((res) => {
          qrImg.onload = res;
        });

        // Gambar QR pas di tengah (sisa margin putih 20px keliling)
        ctx.drawImage(qrImg, 20, 20, 260, 260);

        const imgData = canvas.toDataURL("image/png").split(",")[1];

        // --- PENAMAAN FILE DIUBAH (Sesuai request sebelumnya) ---
        zip.file(`${item.uuid}_PIN-${item.validation_code}.png`, imgData, {
          base64: true,
        });
      }

      // Masukkan file CSV ke dalam ZIP
      zip.file(
        `DATA_KODE_QR_ONLY_${productName.replace(/\s+/g, "_")}.csv`,
        csvContent,
      );

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `BATCH_QR_ONLY_${productName.replace(/\s+/g, "_")}.zip`);

      const uuidsToUpdate = kepingans.map((k) => k.uuid);
      const updateRes = await markKepinganAsDownloaded(uuidsToUpdate);

      if (updateRes.success) {
        setKepingans([]);
        setQrCount("");
        alert(
          "Batch QR Only berhasil didownload! File ZIP berisi gambar dan file Excel (CSV).",
        );
      } else {
        alert("Download berhasil, tapi gagal mengupdate status.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memproses gambar QR Only.");
    } finally {
      setIsDownloadingQrOnly(false);
    }
  };

  const isAnyDownloading = isDownloadingFull || isDownloadingQrOnly;

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

        {/* HEADER & DOWNLOAD BUTTONS */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
              {productName}
            </h1>
            <p className="text-cyan-400 font-mono text-[10px] tracking-[0.3em] uppercase mt-2">
              Print Queue Management
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {/* Tombol Lama: FULL CARD */}
            <button
              onClick={handleDownloadFullZip}
              disabled={isAnyDownloading || kepingans.length === 0}
              className="w-full md:w-auto bg-green-500 hover:bg-green-400 disabled:opacity-30 text-black px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            >
              {isDownloadingFull ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download size={20} />
              )}
              {isDownloadingFull
                ? "PROCESSING FULL..."
                : `DOWNLOAD FULL LABELS`}
            </button>

            {/* Tombol Baru: QR ONLY */}
            <button
              onClick={handleDownloadQrOnlyZip}
              disabled={isAnyDownloading || kepingans.length === 0}
              className="w-full md:w-auto bg-white hover:bg-gray-200 disabled:opacity-30 text-black px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isDownloadingQrOnly ? (
                <Loader2 className="animate-spin" />
              ) : (
                <QrCode size={20} />
              )}
              {isDownloadingQrOnly ? "PROCESSING QR..." : `GENERATE QR ONLY`}
            </button>
          </div>
        </div>

        {/* Control Panel (Generate Kepingan Baru) */}
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
              className="w-full bg-cyan-500 text-black py-5 rounded-2xl font-black hover:bg-cyan-400 transition-all flex justify-center items-center gap-2 shadow-xl shadow-cyan-500/20 disabled:opacity-50"
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
