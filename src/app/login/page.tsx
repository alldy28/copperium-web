"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, KeyRound, Loader2, User } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await loginAction(username, password);

    if (res.success) {
      router.push("/"); // Arahkan ke Landing Page setelah login sukses
    } else {
      setError(res.error || "Akses Ditolak.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow Besar untuk nuansa Cyberpunk */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/2 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden z-10 backdrop-blur-sm">
        {/* Glow Effect Sudut Kanan Atas */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full"></div>

        {/* HEADER BRANDING COOPERIUM */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <ShieldCheck size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            Cooperium<span className="text-cyan-400">Vault</span>
          </h1>
          <p className="text-cyan-400/50 font-mono text-[10px] tracking-[0.3em] uppercase mt-2">
            Secure Node Authentication
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] font-black p-4 rounded-xl text-center tracking-widest uppercase">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2 text-white/40 text-[10px] font-black tracking-widest uppercase">
              <User size={12} className="text-cyan-400" /> Authorized ID
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-cyan-400 outline-none focus:border-cyan-500 transition-colors font-mono tracking-widest placeholder:text-white/10"
              placeholder="e.g. admin"
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-white/40 text-[10px] font-black tracking-widest uppercase">
              <KeyRound size={12} className="text-cyan-400" /> Security PIN
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-cyan-400 outline-none focus:border-cyan-500 transition-colors font-mono tracking-widest placeholder:text-white/10"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-xl font-black tracking-widest uppercase transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Initiate Access"}
          </button>
        </form>

        {/* Footer Kecil di Form */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-white/20">
            Cooperium System Protocol v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
