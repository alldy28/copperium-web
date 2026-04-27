/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getProducts } from "./actions";
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
  Activity,
  QrCode, // Optional: Jika Anda ingin pakai ikon QR Code di tempat lain
} from "lucide-react";

export default function LandingPage() {
  const [stats, setStats] = useState({
    total: 0,
    totalWeight: 0,
    latestId: "---",
  });

  useEffect(() => {
    async function fetchStats() {
      const data = await getProducts();
      if (data && data.length > 0) {
        const weight = data.reduce(
          (acc: number, curr: any) => acc + (curr.weight || 0),
          0,
        );
        setStats({
          total: data.length,
          totalWeight: weight,
          latestId: data[0].id,
        });
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Background Glow Overlay */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <ShieldCheck className="text-black" size={24} />
            </div>
            <span className="font-black italic tracking-tighter text-xl uppercase">
              Cooperium<span className="text-cyan-400">Vault</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">
            <Link href="/" className="text-cyan-400">
              Dashboard
            </Link>
            <Link
              href="/products"
              className="hover:text-white transition-colors"
            >
              Inventory
            </Link>
            {/* 👇 LINK BARU: LIST QR CODE DITAMBAHKAN DI SINI 👇 */}
            <Link
              href="/list-qrcode"
              className="hover:text-cyan-400 transition-colors"
            >
              List QR Code
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Logs
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity size={14} className="animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase">
                System Operational
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-black tracking-tighter italic leading-[0.9]">
              SECURE YOUR <br />
              <span className="text-cyan-400">BRONZE ASSETS</span>
            </h1>

            <p className="text-white/40 text-lg max-w-md leading-relaxed">
              Terminal manajemen enkripsi aset tembaga dan perunggu. Generate QR
              unik dengan validasi PIN 6-digit untuk setiap unit produksi.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/products"
                className="px-8 py-4 bg-cyan-500 text-black font-black rounded-xl flex items-center gap-2 hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/20"
              >
                GO TO INVENTORY <ArrowRight size={20} />
              </Link>
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-black hover:bg-white/10 transition-all">
                VIEW DOCUMENTATION
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Package className="text-cyan-400" />}
              label="Total Assets"
              value={stats.total.toString()}
              unit="UNITS"
            />
            <StatCard
              icon={<Database className="text-orange-400" />}
              label="Net Weight"
              value={(stats.totalWeight / 1000).toFixed(1)}
              unit="KG"
            />
            <StatCard
              icon={<Layers className="text-purple-400" />}
              label="Latest ID"
              value={stats.latestId}
              unit="MINTED"
            />
            <StatCard
              icon={<ShieldCheck className="text-green-400" />}
              label="Protocol"
              value="v1.0.4"
              unit="SECURE"
            />
          </div>
        </div>

        {/* Quick Link Card */}
        <div className="mt-24 p-8 bg-gradient-to-r from-cyan-900/20 to-transparent border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/5 rounded-2xl">
              <LayoutDashboard size={32} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-xl uppercase italic">
                Ready to mint new batch?
              </h3>
              <p className="text-white/40 text-sm">
                Input quantity and generate high-resolution security labels.
              </p>
            </div>
          </div>
          <Link
            href="/products"
            className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-cyan-400 transition-colors"
          >
            Start Registration
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6 opacity-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
          <p>© 2026 COOPERIUM SECURE NODE</p>
          <p>AUTHORIZED ACCESS ONLY</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] hover:border-cyan-500/30 transition-all group">
      <div className="mb-6 bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-[10px] font-black text-white/30 tracking-widest uppercase mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-3xl font-black tracking-tighter italic">{value}</h4>
        <span className="text-[10px] font-black text-cyan-400/50 italic">
          {unit}
        </span>
      </div>
    </div>
  );
}
