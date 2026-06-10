import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

class ProfileView extends StatelessWidget {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email ?? 'student@students.universitasmulia.ac.id';

    // Extract student name/ID placeholder from email
    final namePlaceholder = email.split('@')[0].toUpperCase();

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Header title
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Profil Saya',
                  style: GoogleFonts.inter(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Avatar card
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: AppTheme.accentSurface,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.accent.withValues(alpha: 0.3), width: 2),
                ),
                child: Center(
                  child: Text(
                    namePlaceholder.substring(0, namePlaceholder.length > 2 ? 2 : namePlaceholder.length),
                    style: GoogleFonts.inter(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.accent,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Student email
              Text(
                email,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Mahasiswa Universitas Mulia',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 32),

              // Information Blocks
              _buildInfoRow(
                icon: Icons.badge_outlined,
                label: 'Nomor Induk Mahasiswa (NIM)',
                value: namePlaceholder.replaceAll(RegExp(r'[^0-9]'), '').isEmpty 
                    ? '221103099 (Placeholder)' 
                    : namePlaceholder.replaceAll(RegExp(r'[^0-9]'), ''),
              ),
              const SizedBox(height: 12),
              
              _buildInfoRow(
                icon: Icons.school_outlined,
                label: 'Instansi / Kampus',
                value: 'Universitas Mulia Balikpapan',
              ),
              const SizedBox(height: 12),

              _buildInfoRow(
                icon: Icons.admin_panel_settings_outlined,
                label: 'Hak Akses Sistem',
                value: 'Peminjam (Client)',
              ),
              const SizedBox(height: 32),

              // Sign Out Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.danger,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                    ),
                  ),
                  onPressed: () async {
                    final confirmLogout = await Get.dialog<bool>(
                      AlertDialog(
                        title: const Text('Keluar'),
                        content: const Text('Apakah Anda yakin ingin keluar dari aplikasi?'),
                        actions: [
                          TextButton(
                            onPressed: () => Get.back(result: false),
                            child: Text(
                              'Batal',
                              style: TextStyle(color: AppTheme.textSecondary),
                            ),
                          ),
                          TextButton(
                            onPressed: () => Get.back(result: true),
                            child: const Text(
                              'Keluar',
                              style: TextStyle(color: AppTheme.danger, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (confirmLogout == true) {
                      await Supabase.instance.client.auth.signOut();
                      Get.offAllNamed('/login');
                    }
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.logout_rounded, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        'Keluar dari Akun',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        border: Border.all(color: AppTheme.surfaceBorder),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.textSecondary, size: 22),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppTheme.textTertiary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
