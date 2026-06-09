import { useState, useEffect } from 'react';
import { FileDown } from 'lucide-react';
import { supabase } from '../App';
import { BorrowLog } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Logs() {
  const [logs, setLogs] = useState<BorrowLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('borrow_logs')
        .select('*, items(name, category)')
        .order('borrow_date', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Setup Realtime subscriptions
    const channel = supabase.channel('logs-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrow_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      const primaryColor = [18, 18, 21]; // #121215
      const accentColor = [0, 200, 100];  // emerald green

      // 1. Draw Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("PINJAMKUY", 15, 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text("LAPORAN BULANAN PEMINJAMAN INVENTARIS & RUANGAN", 15, 33);

      // 2. Draw Metadata
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 15, 50);

      // 3. Stats Grid
      const totalLogsCount = logs.length;
      const activeLoansCount = logs.filter(log => log.status === 'Dipinjam').length;
      const completedLoansCount = totalLogsCount - activeLoansCount;

      doc.setFillColor(243, 244, 246);
      doc.rect(15, 58, 55, 20, 'F');
      doc.rect(77, 58, 55, 20, 'F');
      doc.rect(140, 58, 55, 20, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(totalLogsCount.toString(), 20, 66);
      doc.text(activeLoansCount.toString(), 82, 66);
      doc.text(completedLoansCount.toString(), 145, 66);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("TOTAL TRANSAKSI", 20, 72);
      doc.text("AKTIF DIPINJAM", 82, 72);
      doc.text("SELESAI DIKEMBALIKAN", 145, 72);

      // 4. Data Table
      const tableHeaders = [["Nama Peminjam", "Nama Item", "Kategori", "Tanggal Pinjam", "Status"]];
      const tableRows = logs.map(log => [
        log.borrower_name,
        log.items ? log.items.name : 'Item Terhapus',
        log.items ? log.items.category : '-',
        new Date(log.borrow_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        log.status
      ]);

      (doc as any).autoTable({
        startY: 88,
        head: tableHeaders,
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          4: { fontStyle: 'bold' }
        }
      });

      doc.save(`Laporan_Peminjaman_PinjamKuy_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor laporan PDF.');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-5 border-b border-zinc-800 gap-4">
        <h3 className="text-base font-bold text-white">Riwayat Lengkap Peminjaman</h3>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-400 hover:text-zinc-950 text-emerald-400 font-bold rounded-lg border border-emerald-500/20 hover:border-transparent transition-all cursor-pointer text-sm shadow shadow-emerald-500/5"
        >
          <FileDown className="w-4 h-4" />
          Ekspor PDF Laporan
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 italic">Memuat riwayat logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 italic">Belum ada riwayat logs transaksi.</div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.map((log) => {
                  const isReturned = log.status === 'Selesai';
                  return (
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
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isReturned
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isReturned ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
