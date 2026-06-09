import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Trash2 } from 'lucide-react';
import { supabase } from '../App.tsx';
import { Item } from '../types.ts';
import confetti from 'canvas-confetti';

export default function Catalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Barang' | 'Ruangan'>('Barang');
  const [submitting, setSubmitting] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error loading catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    // Listen for realtime catalog updates
    const channel = supabase.channel('catalog-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('items')
        .insert({
          name: newItemName.trim(),
          category: newItemCategory,
          is_available: true,
        });

      if (error) throw error;

      setNewItemName('');
      
      // Fire confetti for celebration
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00e676', '#ffffff']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00e676', '#ffffff']
      });

    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailable = async (itemId: string, isChecked: boolean, name: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_available: isChecked })
        .eq('id', itemId);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert(`Gagal mengubah ketersediaan untuk "${name}".`);
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}" dari katalog?`)) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert(`Gagal menghapus "${name}".`);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start animate-fade-in">
      
      {/* Add Item Form Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg lg:sticky lg:top-28">
        <div className="px-6 py-5 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">Tambah Item Baru</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleAddItem} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Nama Barang / Ruangan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Kamera Sony A7III"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Kategori</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as 'Barang' | 'Ruangan')}
                className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              >
                <option value="Barang">Barang</option>
                <option value="Ruangan">Ruangan</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 font-bold rounded-lg shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none disabled:shadow-none transition-all cursor-pointer"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin"></span>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Tambah ke Katalog
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Catalog Listing Table Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-5 border-b border-zinc-800 gap-4">
          <h3 className="text-base font-bold text-white">Daftar Inventaris & Ruangan</h3>
          
          {/* Live Search */}
          <div className="relative flex items-center w-full sm:w-64">
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari inventaris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950/40 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-650 focus:border-emerald-500 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 italic">Memuat daftar inventaris...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 italic">Tidak ada item inventaris ditemukan.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nama Item</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Kategori</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="py-4 font-semibold text-zinc-100">{item.name}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 text-xs font-medium bg-zinc-800 border border-zinc-700/60 rounded text-zinc-400">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.is_available
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.is_available ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                          {item.is_available ? 'Tersedia' : 'Sedang Dipinjam'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-4">
                          {/* Toggle Switch */}
                          <label className="relative inline-flex items-center cursor-pointer" title="Ubah ketersediaan">
                            <input
                              type="checkbox"
                              checked={item.is_available}
                              onChange={(e) => handleToggleAvailable(item.id, e.target.checked, item.name)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-emerald-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/10 peer-checked:border-emerald-500/20 border border-zinc-800"></div>
                          </label>

                          {/* Delete Action */}
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                            title="Hapus Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
