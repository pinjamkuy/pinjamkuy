import { LayoutDashboard, Archive, History, LogOut } from 'lucide-react';
import { supabase } from '../App';

interface SidebarProps {
  currentTab: 'overview' | 'catalog' | 'logs';
  onChangeTab: (tab: 'overview' | 'catalog' | 'logs') => void;
}

export default function Sidebar({ currentTab, onChangeTab }: SidebarProps) {
  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 sticky top-0 h-screen z-40">
      
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">PinjamKuy</span>
        </div>
        <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
          Admin
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1">
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => onChangeTab('overview')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Ringkasan
            </button>
          </li>
          <li>
            <button
              onClick={() => onChangeTab('catalog')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                currentTab === 'catalog'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <Archive className="w-5 h-5" />
              Kelola Katalog
            </button>
          </li>
          <li>
            <button
              onClick={() => onChangeTab('logs')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                currentTab === 'logs'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <History className="w-5 h-5" />
              Riwayat Log
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-zinc-800 pt-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-zinc-400 text-sm font-medium border border-zinc-800 rounded-lg transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>

    </aside>
  );
}
