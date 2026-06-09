import { useState, useEffect } from 'react';
import { Archive, ArrowLeftRight, CheckCircle2, ClipboardList } from 'lucide-react';
import { supabase } from '../App.tsx';
import { BorrowLog } from '../types.ts';
import confetti from 'canvas-confetti';

export default function Overview() {
  const [stats, setStats] = useState({
    totalItems: 0,
    activeLoans: 0,
    availableItems: 0,
    totalLogs: 0,
  });
  const [activeLogs, setActiveLogs] = useState<BorrowLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load stats and active logs
  const fetchData = async () => {
    try {
      // 1. Fetch Items
      const { data: items, error: itemsErr } = await supabase
        .from('items')
        .select('id, is_available');
      
      if (itemsErr) throw itemsErr;

      const total = items?.length || 0;
      const available = items?.filter((i: any) => i.is_available).length || 0;
      const active = total - available;

      // 2. Fetch Total Logs Count
      const { count: totalLogsCount, error: logsErr } = await supabase
        .from('borrow_logs')
        .select('*', { count: 'exact', head: true });

      if (logsErr) throw logsErr;

      setStats({
        totalItems: total,
        activeLoans: active,
        availableItems: available,
        totalLogs: totalLogsCount || 0,
      });

      // 3. Fetch Active Loans (Dipinjam) with joined items
      const { data: loans, error: loansErr } = await supabase
        .from('borrow_logs')
        .select('*, items(name, category)')
        .eq('status', 'Dipinjam')
        .order('borrow_date', { ascending: false });

      if (loansErr) throw loansErr;
      setActiveLogs(loans || []);
    } catch (err) {
      console.error('Error fetching overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Realtime subscriptions
    const channel = supabase.channel('overview-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrow_logs' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleReturnItem = async (logId: string, itemId: string, itemName: string) => {
    if (!confirm(`Selesaikan peminjaman untuk "${itemName}"?`)) return;

    try {
      // 1. Update log status
      const { error: logErr } = await supabase
        .from('borrow_logs')
        .update({ status: 'Selesai' })
        .eq('id', logId);
      if (logErr) throw logErr;

      // 2. Set item as available
      const { error: itemErr } = await supabase
        .from('items')
        .update({ is_available: true })
        .eq('id', itemId);
      if (itemErr) throw itemErr;

      // Fire confetti for premium success animation!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00e676', '#00bfa5', '#ffffff']
      });

    } catch (err) {
      console.error(err);
      alert('Gagal mengembalikan barang.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Items */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-5 hover:-translate-y-1 hover:border-zinc-700/60 shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-400">Total Barang</h3>
            <p className="text-2xl font-extrabold text-white mt-1">{stats.totalItems}</p>
          </div>
        </div>

        {/* Active Loans */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-5 hover:-translate-y-1 hover:border-zinc-700/60 shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-400">Sedang Dipinjam</h3>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{stats.activeLoans}</p>
          </div>
        </div>

        {/* Available Items */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-5 hover:-translate-y-1 hover:border-zinc-700/60 shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-400">Tersedia</h3>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.availableItems}</p>
          </div>
        </div>

        {/* Log History */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-5 hover:-translate-y-1 hover:border-zinc-700/60 shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-400">Log Transaksi</h3>
            <p className="text-2xl font-extrabold text-teal-400 mt-1">{stats.totalLogs}</p>
          </div>
        </div>

      </div>

      {/* Active Loans Table Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">Peminjaman Aktif saat Ini</h3>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Realtime Sync
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 italic">Memuat peminjaman aktif...</div>
          ) : activeLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 italic">Tidak ada peminjaman aktif saat ini.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nama Peminjam</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nama Item</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Kategori</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Tanggal Pinjam</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {activeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="py-4 font-semibold text-zinc-100">{log.borrower_name}</td>
                      <td className="py-4 text-zinc-300">{log.items?.name ?? 'Item Terhapus'}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 text-xs font-medium bg-zinc-800 border border-zinc-700/60 rounded text-zinc-400">
                          {log.items?.category ?? '-'}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-zinc-400">
                        {new Date(log.borrow_date).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          Dipinjam
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => handleReturnItem(log.id, log.item_id, log.items?.name ?? 'Item')}
                          className="px-4 py-2 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-400 hover:text-zinc-950 text-emerald-400 rounded-lg shadow shadow-emerald-500/5 transition-all cursor-pointer"
                        >
                          Selesaikan Peminjaman
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
