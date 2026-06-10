import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class DashboardView extends StatelessWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Universitas Mulia',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.accent,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Dashboard Info',
                        style: GoogleFonts.inter(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.accentSurface,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.school_rounded,
                      color: AppTheme.primary,
                      size: 24,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Welcome Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.primary, AppTheme.accentDim],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                  boxShadow: AppTheme.softShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PinjamKuy Kampus UM',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sistem peminjaman inventaris barang organisasi mahasiswa dan ruangan kelas/studio di lingkungan Universitas Mulia Balikpapan.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.white.withValues(alpha: 0.85),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Alur Peminjaman Section
              Text(
                'Alur Peminjaman',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              
              _buildGuideStep(
                icon: Icons.search_rounded,
                title: '1. Pilih Barang / Ruangan',
                desc: 'Temukan item yang Anda butuhkan di menu Katalog dan pastikan statusnya "Tersedia".',
              ),
              _buildGuideStep(
                icon: Icons.assignment_turned_in_rounded,
                title: '2. Ajukan Pinjaman di Aplikasi',
                desc: 'Klik tombol Pinjam, masukkan nama Anda, dan kirim pengajuan secara instan.',
              ),
              _buildGuideStep(
                icon: Icons.vpn_key_rounded,
                title: '3. Ambil Kunci / Barang',
                desc: 'Tunjukkan bukti peminjaman aktif ke staf organisasi/sarpras kampus untuk verifikasi.',
              ),
              _buildGuideStep(
                icon: Icons.history_rounded,
                title: '4. Kembalikan Tepat Waktu',
                desc: 'Setelah selesai, kembalikan ke tempat semula dan pastikan status peminjaman diselesaikan oleh Admin.',
              ),

              const SizedBox(height: 28),

              // Info & Pengumuman
              Text(
                'Pengumuman Kampus',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              
              _buildAnnouncementCard(
                title: 'Peminjaman Studio Podcast',
                desc: 'Studio Podcast & Recording dibuka setiap Senin-Jumat pukul 08:00 hingga 16:00 WITA. Harap lakukan booking minimal 2 jam sebelum penggunaan.',
                date: 'Hari ini',
              ),
              _buildAnnouncementCard(
                title: 'Pengembalian Inventaris LDK',
                desc: 'Semua barang inventaris organisasi LDK yang dipinjam wajib dikembalikan ke sekre maksimal 1 hari setelah kegiatan berakhir.',
                date: 'Kemarin',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGuideStep({
    required IconData icon,
    required String title,
    required String desc,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.surfaceLight,
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
              border: Border.all(color: AppTheme.surfaceBorder),
            ),
            child: Icon(
              icon,
              color: AppTheme.accent,
              size: 18,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnnouncementCard({
    required String title,
    required String desc,
    required String date,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        border: Border.all(color: AppTheme.surfaceBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                date,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.accent,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            desc,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
