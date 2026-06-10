import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Trash2, Pencil, X } from 'lucide-react';
import { supabase } from '../App';
import { Item } from '../types';
import confetti from 'canvas-confetti';

export default function Catalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Barang' | 'Ruangan'>('Barang');
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'Barang' | 'Ruangan'>('Barang');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);

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
      let uploadedUrl = null;

      if (newFile) {
        const fileExt = newFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, newFile);

        if (uploadError) {
          throw new Error('Gagal mengunggah foto. Pastikan bucket "item-images" sudah dibuat di Supabase Storage dan diatur sebagai Public.');
        }

        const { data: urlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        uploadedUrl = urlData.publicUrl;
      }

      const quantityVal = newItemCategory === 'Barang' ? newItemQuantity : 1;

      const { error } = await supabase
        .from('items')
        .insert({
          name: newItemName.trim(),
          category: newItemCategory,
          is_available: true,
          image_url: uploadedUrl,
          quantity: quantityVal,
          available_quantity: quantityVal,
        });

      if (error) throw error;

      setNewItemName('');
      setNewItemQuantity(1);
      setNewFile(null);
      
      // Reset file input element
      const fileInput = document.getElementById('new-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

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

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal menambahkan item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSubmitting(true);
    try {
      let finalImageUrl = editImageUrl;

      if (editFile) {
        const fileExt = editFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, editFile);

        if (uploadError) {
          throw new Error('Gagal mengunggah foto baru. Pastikan bucket "item-images" sudah dibuat di Supabase Storage dan diatur sebagai Public.');
        }

        const { data: urlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        finalImageUrl = urlData.publicUrl;
      }

      const totalQty = editCategory === 'Barang' ? editQuantity : 1;
      const currentlyBorrowed = (editingItem.quantity || 1) - (editingItem.available_quantity || 1);
      const newAvail = Math.max(0, totalQty - currentlyBorrowed);

      const { error } = await supabase
        .from('items')
        .update({
          name: editName.trim(),
          category: editCategory,
          image_url: finalImageUrl,
          quantity: totalQty,
          available_quantity: newAvail,
          is_available: newAvail > 0,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setEditingItem(null);
      fetchItems();

      // Reset form
      setEditFile(null);
      const fileInput = document.getElementById('edit-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal memperbarui item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditQuantity(item.quantity || 1);
    setEditImageUrl(item.image_url || null);
    setEditFile(null);
  };

  const handleToggleAvailable = async (itemId: string, isChecked: boolean, name: string) => {
    try {
      const selectedItem = items.find(i => i.id === itemId);
      if (!selectedItem) return;

      const totalQty = selectedItem.quantity || 1;
      const newAvail = isChecked ? totalQty : 0;

      const { error } = await supabase
        .from('items')
        .update({ 
          is_available: isChecked,
          available_quantity: newAvail
        })
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
                className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-650 focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
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

            {newItemCategory === 'Barang' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Jumlah Stok (Quantity)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Unggah Foto (Opsional)</label>
              <input
                id="new-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 file:cursor-pointer"
              />
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
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status / Stok</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredItems.map((item) => {
                    const isBarang = item.category === 'Barang';
                    const hasStock = (item.available_quantity ?? 1) > 0;
                    const isAvail = item.is_available && hasStock;

                    return (
                      <tr key={item.id} className="hover:bg-zinc-800/10 transition-colors">
                        <td className="py-4 font-semibold text-zinc-100">
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-10 h-10 object-cover rounded-lg border border-zinc-800"
                              />
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center bg-zinc-800 border border-zinc-700/60 rounded-lg text-zinc-450 text-xs">
                                {item.category === 'Barang' ? '📦' : '🚪'}
                              </div>
                            )}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-0.5 text-xs font-medium bg-zinc-800 border border-zinc-700/60 rounded text-zinc-400">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold w-max ${
                              isAvail
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                              {isAvail ? 'Tersedia' : 'Sedang Dipinjam'}
                            </span>
                            {isBarang && (
                              <span className="text-[10px] text-zinc-550 font-medium pl-2">
                                Stok: {item.available_quantity} / {item.quantity} tersisa
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-center gap-4">
                            {/* Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer" title="Ubah ketersediaan">
                              <input
                                type="checkbox"
                                checked={isAvail}
                                onChange={(e) => handleToggleAvailable(item.id, e.target.checked, item.name)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-emerald-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/10 peer-checked:border-emerald-500/20 border border-zinc-800"></div>
                            </label>

                            {/* Edit Action */}
                            <button
                              onClick={() => handleEditClick(item)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-350 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"
                              title="Edit Item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Edit Item</h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateItem} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Nama Barang / Ruangan</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Kategori</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as 'Barang' | 'Ruangan')}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                >
                  <option value="Barang">Barang</option>
                  <option value="Ruangan">Ruangan</option>
                </select>
              </div>

              {editCategory === 'Barang' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Jumlah Stok (Quantity)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                </div>
              )}

              {/* Current Image View */}
              {editImageUrl && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Foto Saat Ini</label>
                  <div className="relative w-full h-32 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950/40 animate-fade-in">
                    <img 
                      src={editImageUrl} 
                      alt="Current preview" 
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setEditImageUrl(null)}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white py-1 px-2.5 rounded-md text-xs font-bold transition-colors cursor-pointer"
                      title="Hapus foto saat ini"
                    >
                      Hapus Foto
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {editImageUrl ? 'Ganti Foto (Opsional)' : 'Unggah Foto (Opsional)'}
                </label>
                <input
                  id="edit-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-sm text-white focus:border-emerald-500 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 file:cursor-pointer"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 font-bold rounded-lg transition-all cursor-pointer text-sm"
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin"></span>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
