import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowRight, LockKeyhole, AlertTriangle } from 'lucide-react';
import { supabase } from '../App';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setCheckingSession(false);
      }
    });

    // 2. Listen to changes (e.g. when PKCE code exchange finishes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession);
        setCheckingSession(false);
      }
    });

    // 3. Timeout fallback: if no session after 3 seconds, stop checking
    const timer = setTimeout(() => {
      setCheckingSession(false);
    }, 3500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setErrorMsg('Sesi tidak ditemukan. Tautan pemulihan mungkin sudah kedaluwarsa atau tidak valid.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi minimal harus 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMsg('Kata sandi Anda berhasil diperbarui! Silakan buka kembali aplikasi mobile PinjamKuy dan masuk menggunakan kata sandi baru Anda.');
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memperbarui kata sandi. Tautan mungkin sudah kadaluarsa.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-emerald-500/10 rounded-full border-t-emerald-400 animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-zinc-400">Memverifikasi tautan pemulihan sandi Anda...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">Atur Ulang Kata Sandi</h1>
          <p className="text-sm text-zinc-400">Silakan masukkan kata sandi baru Anda di bawah ini</p>
          {session && (
            <p className="text-xs text-emerald-400 mt-2 font-medium bg-emerald-500/10 py-1 px-3 rounded-full inline-block">
              Surel: {session.user.email}
            </p>
          )}
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Invalid/Expired Link Alert */}
        {!session && !successMsg && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tautan Tidak Valid</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Tautan pemulihan kata sandi Anda sudah kedaluwarsa, tidak valid, atau sudah pernah digunakan sebelumnya. Silakan minta tautan baru dari aplikasi mobile PinjamKuy.
            </p>
          </div>
        )}

        {/* Form */}
        {session && !successMsg && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Kata Sandi Baru</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-4 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Konfirmasi Kata Sandi</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-4 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Simpan Kata Sandi
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
