/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getKepinganByUuid } from "../../actions";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function VerificationPage() {
  const params = useParams();
  const uuidParam = params?.uuid as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // State untuk PIN
  const [pinInput, setPinInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [pinError, setPinError] = useState(false);


  const loadData = useCallback(async (id: string) => {
    setLoading(true);
    const result = await getKepinganByUuid(id);
    if (result) {
      setData(result);
    } else {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (uuidParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData(uuidParam);
    }
  }, [uuidParam, loadData]);

  const handleVerifyPin = () => {
    if (pinInput === data?.validation_code) {
      setIsVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  // Tampilan Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
        <p className="font-mono text-xs tracking-[0.3em] uppercase opacity-50">
          Secure Connection...
        </p>
      </div>
    );
  }

  // Tampilan Data Tidak Ditemukan / Palsu
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="text-red-500 mb-6" size={60} />
        <h1 className="text-2xl font-black italic uppercase text-red-500 mb-2">
          Warning
        </h1>
        <p className="text-white/50 text-sm">
          Asset ID tidak ditemukan dalam Global Registry. Harap waspada terhadap
          produk tiruan.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans flex flex-col items-center">
      {/* Kontainer bergaya Mobile-First (Kecil di tengah) */}
      <div className="w-full max-w-md mt-10">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            Copperium <span className="text-cyan-400">Auth</span>
          </h1>
          <p className="text-cyan-400/50 font-mono text-[10px] tracking-[0.3em] uppercase mt-2">
            Decentralized Verification
          </p>
        </div>

        {/* --- STATE 1: MINTA PIN --- */}
        {!isVerified ? (
          <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
              <Lock size={30} />
            </div>
            <h2 className="text-xl font-black uppercase mb-2">
              Secure Gateway
            </h2>
            <p className="text-white/40 text-xs mb-8">
              Masukkan 6-Digit PIN (Validation Code) yang tertera pada label
              fisik produk Anda.
            </p>

            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))} // Hanya angka
              placeholder="000000"
              className={`w-full bg-black border ${pinError ? "border-red-500 text-red-500" : "border-white/10 text-white"} p-5 rounded-2xl text-center text-3xl font-black tracking-[0.3em] outline-none focus:border-cyan-500 transition-colors mb-4`}
            />

            {pinError && (
              <p className="text-red-500 text-xs mb-4 font-bold">
                PIN SALAH! COBA LAGI.
              </p>
            )}

            <button
              onClick={handleVerifyPin}
              disabled={pinInput.length !== 6}
              className="w-full bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-xl font-black tracking-widest uppercase transition-all"
            >
              Verify Asset
            </button>
          </div>
        ) : (
          /* --- STATE 2: SERTIFIKAT KEASLIAN --- */
          <div className="bg-gradient-to-b from-cyan-900/20 to-black border border-cyan-500/30 p-1 rounded-[2.5rem] shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
            {/* Efek Garis Kilauan */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

            <div className="bg-[#0A0A0A] p-8 rounded-[2.3rem]">
              <div className="flex flex-col items-center text-center mb-8 border-b border-white/10 pb-8">
                <CheckCircle2
                  className="text-cyan-400 mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  size={50}
                />
                <h2 className="text-green-400 font-black tracking-widest uppercase text-sm mb-1">
                  Authentic Product
                </h2>
                <div className="text-3xl font-black font-mono tracking-tighter">
                  {data.uuid}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-1">
                    Master Product
                  </div>
                  <div className="text-lg font-bold">{data.product_name}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl">
                    <div className="text-[9px] font-black tracking-widest text-white/40 uppercase mb-1">
                      Weight
                    </div>
                    <div className="text-xl font-mono font-bold text-cyan-400">
                      {data.weight}g
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl">
                    <div className="text-[9px] font-black tracking-widest text-white/40 uppercase mb-1">
                      Finest Purity
                    </div>
                    <div className="text-xl font-mono font-bold text-cyan-400">
                      {data.finest}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-1">
                    Production Date
                  </div>
                  <div className="text-sm font-mono">
                    {new Date(data.production_date).toLocaleDateString(
                      "id-ID",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-cyan-500/50 text-[10px] uppercase font-black tracking-widest">
                <ShieldCheck size={14} /> Copperium Security Protocol
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
