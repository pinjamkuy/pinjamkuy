import React, { useState } from 'react';
import { Mail, KeyRound, ArrowRight, LockKeyhole } from 'lucide-react';
import { supabase } from '../App';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data?.user?.email !== 'pinj4mkuy@gmail.com') {
        await supabase.auth.signOut();
        throw new Error('Akses ditolak. Akun Anda tidak memiliki hak akses Administrator.');
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal masuk. Silakan cek kembali surel & kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_center,#111827_0%,#030712_100%)] p-6">
      <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-300">

        {/* Glow Element */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-zinc-950 shadow-lg shadow-emerald-500/20 mb-4 transform hover:scale-105 transition-transform">
            <LockKeyhole className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">PinjamKuy Admin</h1>
          <p className="text-sm text-zinc-400">Silakan masuk untuk mengelola inventaris & peminjaman</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Surel (Email)</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="pinj4mkuy@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-650 focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Kata Sandi</label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-4 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 font-bold rounded-lg shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none disabled:shadow-none transition-all cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin"></span>
            ) : (
              <>
                Masuk Sekarang
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
