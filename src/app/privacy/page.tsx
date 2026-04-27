import React from "react";
import Link from "next/link";
import { ChevronLeft, ShieldAlert } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#050505] text-white/80 font-sans selection:bg-[#00FF84] selection:text-black pb-20">
      {/* Header / Navbar Simple */}
      <nav className="w-full border-b border-white/5 bg-[#0A0A0A] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-bold tracking-widest uppercase"
          >
            <ChevronLeft size={18} /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
              Privacy <span className="text-cyan-400">Policy</span>
            </h1>
            <p className="text-[10px] tracking-widest uppercase opacity-50 mt-1">
              Effective Date: January 1, 2026 | Copperium Scanner App
            </p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12 space-y-8 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-widest border-b border-white/10 pb-2">
              1. Introduction
            </h2>
            <p>
              Welcome to the Copperium Scanner application. This Privacy Policy
              explains how we collect, use, and protect your information when
              you use our mobile application. We are committed to ensuring that
              your privacy is protected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-widest border-b border-white/10 pb-2">
              2. Camera Permission & Usage
            </h2>
            <p className="mb-2">
              Our application requires access to your device's{" "}
              <strong>Camera</strong>. This permission is strictly used for the
              following purpose:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/60">
              <li>
                <strong>Scanning QR Codes:</strong> The camera is used
                exclusively in real-time to scan Copperium QR Codes attached to
                our physical physical assets.
              </li>
              <li>
                <strong>No Recording or Saving:</strong> We{" "}
                <strong>DO NOT</strong> take photos, record videos, or save any
                visual data from your camera to your device storage or our
                servers.
              </li>
              <li>
                <strong>No Background Access:</strong> The camera is only active
                when you explicitly open the scanning screen within the app.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-widest border-b border-white/10 pb-2">
              3. Data Collection
            </h2>
            <p>
              When you scan a QR code, the app extracts the text (UUID) embedded
              within the code and sends it to our secure server
              (`api.copperium.id`) to verify the authenticity of the physical
              asset. We do not collect Personal Identifiable Information (PII)
              such as your name, email, or phone number through the scanner app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-widest border-b border-white/10 pb-2">
              4. Third-Party Services
            </h2>
            <p>
              We do not sell, trade, or otherwise transfer your data to outside
              parties. The data transmitted during validation is heavily
              encrypted and strictly used for authentication purposes within the
              Copperium ecosystem.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-widest border-b border-white/10 pb-2">
              5. Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. Thus, you are
              advised to review this page periodically for any changes. We will
              notify you of any changes by posting the new Privacy Policy on
              this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-widest border-b border-white/10 pb-2">
              6. Contact Us
            </h2>
            <p>
              If you have any questions or suggestions about our Privacy Policy,
              do not hesitate to contact us at: <br />
              <span className="text-cyan-400 font-bold">
                support@copperium.id
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
