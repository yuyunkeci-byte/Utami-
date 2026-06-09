import React, { useState } from "react";
import { X, Lock, Mail, AlertCircle, CheckCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { uid: string; email: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Silakan isi semua bidang.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses autentikasi.");
      }

      setSuccess(isLogin ? "Berhasil masuk! Sedang menyinkronkan draf..." : "Pendaftaran berhasil! Akun Anda siap digunakan.");
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Koneksi ke server gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in text-xs leading-relaxed">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-emerald-600 rounded font-extrabold uppercase tracking-wider text-[9px]">Sync Cloud</span>
            <h3 className="font-extrabold text-sm">{isLogin ? "Masuk ke Workspace" : "Daftar Akun Baru"}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Autentikasi ini mengaktifkan database awan instan untuk menyinkronkan seluruh draf RPL, materi presentasi, komitmen icebreaker, dan asesmen bimbingan Anda secara real-time lintas ponsel, tablet, dan desktop.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 font-semibold text-slate-700">
            {/* Email Field */}
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal text-slate-800"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal text-slate-800"
                />
              </div>
            </div>

            {/* Notifications */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-1.5 font-normal">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-start gap-1.5 font-normal">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                loading ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800 shadow"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-450 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>{isLogin ? "Masuk ke Akun" : "Daftar Sekarang"}</span>
              )}
            </button>
          </form>

          {/* Toggle register / login */}
          <div className="text-center pt-2 border-t border-slate-100 font-medium">
            {isLogin ? (
              <p>
                Belum memiliki akun?{" "}
                <button 
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Daftar baru di sini
                </button>
              </p>
            ) : (
              <p>
                Sudah memiliki akun?{" "}
                <button 
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
