import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { Announcement } from '../types';
import { Plus, Search, Trash2, Edit2, X, Megaphone, Loader2 } from 'lucide-react';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err: any) {
      alert('Gagal mengambil data pengumuman: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedAnnouncement(null);
    setTitle('');
    setContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (announcement: Announcement) => {
    setModalMode('edit');
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Judul dan konten pengumuman tidak boleh kosong.');
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const { error } = await supabase.from('announcements').insert({
          title,
          content,
        });
        if (error) throw error;
      } else if (modalMode === 'edit' && selectedAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title,
            content,
          })
          .eq('id', selectedAnnouncement.id);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      alert('Gagal menyimpan pengumuman: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      fetchAnnouncements();
    } catch (err: any) {
      alert('Gagal menghapus pengumuman: ' + err.message);
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Kelola Pengumuman Kampus
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tambah, edit, dan hapus pengumuman resmi untuk mahasiswa di aplikasi mobile.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold rounded-xl transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_-2px_rgba(16,185,129,0.4)] cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Tambah Pengumuman
        </button>
      </div>

      {/* Control Actions & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-zinc-100 placeholder-zinc-500 rounded-lg outline-none transition-all text-sm"
          />
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          Menampilkan {filteredAnnouncements.length} pengumuman
        </div>
      </div>

      {/* Table / Grid list of announcements */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-zinc-500 text-sm mt-4">Memuat data pengumuman...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/40 flex items-center justify-center text-zinc-600 mb-4">
            <Megaphone className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300">Tidak ada pengumuman</h3>
          <p className="text-zinc-500 text-sm max-w-sm mt-1">
            Belum ada pengumuman yang ditambahkan. Klik tombol "Tambah Pengumuman" untuk memulai.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {announcement.title}
                  </h3>
                  <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md shrink-0 border border-zinc-800/50">
                    {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {announcement.content}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-zinc-800/60">
                <button
                  onClick={() => handleOpenEditModal(announcement)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/20 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/20 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-400" />
                {modalMode === 'create' ? 'Tambah Pengumuman Baru' : 'Edit Pengumuman'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Peminjaman Studio Podcast"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-zinc-100 rounded-lg outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Konten / Detail Pengumuman
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis detail info atau pengumuman kampus di sini..."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-zinc-100 rounded-lg outline-none transition-all text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/20 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modalMode === 'create' ? 'Simpan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
