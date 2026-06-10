import { User, Sun, Moon } from 'lucide-react';

interface TopbarProps {
  email: string;
  currentTab: 'overview' | 'catalog' | 'logs' | 'announcements';
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Topbar({ email, currentTab, theme, onToggleTheme }: TopbarProps) {
  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'overview':
        return {
          title: 'Dashboard Ringkasan',
          subtitle: 'Selamat datang kembali di panel admin PinjamKuy.',
        };
      case 'catalog':
        return {
          title: 'Kelola Inventaris & Ruangan',
          subtitle: 'Tambah, ubah ketersediaan, atau hapus item dari katalog peminjaman.',
        };
      case 'announcements':
        return {
          title: 'Kelola Pengumuman Kampus',
          subtitle: 'Tambah, ubah, atau hapus informasi pengumuman kampus untuk mahasiswa.',
        };
      case 'logs':
        return {
          title: 'Laporan Log Transaksi',
          subtitle: 'Lihat seluruh riwayat transaksi peminjaman barang dan ruangan.',
        };
      default:
        return {
          title: 'Panel Admin',
          subtitle: 'Aplikasi Manajemen PinjamKuy.',
        };
    }
  };

  const info = getHeaderInfo();

  return (
    <header className="flex justify-between items-center px-8 py-6 border-b border-zinc-800 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30">
      
      {/* Title Details */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">{info.title}</h2>
        <p className="text-xs text-zinc-400 mt-1">{info.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all cursor-pointer"
          title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
        >
          {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-zinc-200 truncate max-w-[150px]">{email}</span>
            <span className="text-[10px] text-zinc-500 font-medium leading-none mt-0.5">Super Admin</span>
          </div>
        </div>
      </div>

    </header>
  );
}
