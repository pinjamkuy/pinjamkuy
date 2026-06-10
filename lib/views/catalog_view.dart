import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../controllers/catalog_controller.dart';
import '../models/item_model.dart';
import '../theme/app_theme.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/empty_state_widget.dart';

class CatalogView extends GetView<CatalogController> {
  const CatalogView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── Header ──────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'PinjamKuy',
                                style: GoogleFonts.inter(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textPrimary,
                                  letterSpacing: -1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Temukan & pinjam yang kamu butuhkan',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: AppTheme.textSecondary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Status indicator + Logout
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Obx(() => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.accentSurface,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppTheme.accent.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: AppTheme.accent,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${controller.availableCount} tersedia',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.accent,
                                    ),
                                  ),
                                ],
                              ),
                            )),
                            const SizedBox(width: 4),
                            IconButton(
                              onPressed: () async {
                                final confirmLogout = await Get.dialog<bool>(
                                  AlertDialog(
                                    title: const Text('Keluar'),
                                    content: const Text('Apakah Anda yakin ingin keluar dari aplikasi?'),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Get.back(result: false),
                                        child: const Text('Batal'),
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
                              icon: Icon(
                                Icons.logout_rounded,
                                color: AppTheme.textSecondary,
                                size: 20,
                              ),
                              tooltip: 'Keluar',
                            ),
                          ],
                        )
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── Search Bar ────────────────────────────────
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(
                          AppTheme.radiusMedium,
                        ),
                        border: Border.all(color: AppTheme.surfaceBorder),
                      ),
                      child: TextField(
                        onChanged: controller.setSearch,
                        style: GoogleFonts.inter(
                          color: AppTheme.textPrimary,
                          fontSize: 14,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Cari barang atau ruangan...',
                          hintStyle: GoogleFonts.inter(
                            color: AppTheme.textTertiary,
                            fontSize: 14,
                          ),
                          prefixIcon: Icon(
                            Icons.search_rounded,
                            color: AppTheme.textTertiary,
                            size: 20,
                          ),
                          filled: false,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Category Chips ────────────────────────────
                    Obx(() => Row(
                      children: [
                        _buildCategoryChip('Semua'),
                        const SizedBox(width: 8),
                        _buildCategoryChip('Barang'),
                        const SizedBox(width: 8),
                        _buildCategoryChip('Ruangan'),
                      ],
                    )),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),

            // ── Items Grid ──────────────────────────────────────
            Obx(() {
              if (controller.isLoading.value) {
                return const SliverToBoxAdapter(
                  child: ShimmerGrid(),
                );
              }

              final items = controller.filteredItems;

              if (items.isEmpty) {
                return const SliverToBoxAdapter(
                  child: EmptyStateWidget(
                    icon: Icons.inventory_2_outlined,
                    title: 'Tidak ada item',
                    subtitle: 'Belum ada barang atau ruangan yang tersedia',
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.82,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      return _ItemCard(
                        item: items[index],
                        onTap: () => _showBorrowSheet(context, items[index]),
                      );
                    },
                    childCount: items.length,
                  ),
                ),
              );
            }),

            // Bottom padding
            const SliverToBoxAdapter(
              child: SizedBox(height: 100),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String label) {
    final isSelected = controller.selectedCategory.value == label;
    return GestureDetector(
      onTap: () => controller.setCategory(label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accent : AppTheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.accent : AppTheme.surfaceBorder,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? const Color(0xFF003300) : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  void _showBorrowSheet(BuildContext context, ItemModel item) {
    if (!item.isAvailable) {
      Get.snackbar(
        'Tidak Tersedia',
        '${item.name} sedang dipinjam',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.dangerSurface,
        colorText: AppTheme.danger,
      );
      return;
    }

    final nameController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final isSubmitting = false.obs;

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(AppTheme.radiusXLarge),
          ),
        ),
        child: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Item info
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppTheme.accentSurface,
                      borderRadius: BorderRadius.circular(
                        AppTheme.radiusMedium,
                      ),
                    ),
                    child: Icon(
                      item.isBarang
                          ? Icons.camera_alt_rounded
                          : Icons.meeting_room_rounded,
                      color: AppTheme.accent,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pinjam ${item.category}',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.accent,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.name,
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Name input
              Text(
                'Nama Peminjam',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: nameController,
                autofocus: true,
                style: GoogleFonts.inter(
                  color: AppTheme.textPrimary,
                  fontSize: 15,
                ),
                decoration: InputDecoration(
                  hintText: 'Masukkan nama lengkap',
                  prefixIcon: Icon(
                    Icons.person_outline_rounded,
                    color: AppTheme.textTertiary,
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Nama peminjam harus diisi';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),

              // Submit button
              Obx(() => SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: isSubmitting.value
                      ? null
                      : () async {
                          if (!formKey.currentState!.validate()) return;
                          isSubmitting.value = true;

                          final success = await controller.borrowItem(
                            item.id,
                            nameController.text.trim(),
                          );

                          isSubmitting.value = false;

                          if (success) {
                            Get.back(); // Close bottom sheet
                            _showSuccessDialog(item.name);
                          }
                        },
                  child: isSubmitting.value
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF003300),
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.check_circle_outline, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Pinjam Sekarang',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                ),
              )),
              SizedBox(height: MediaQuery.of(context).viewInsets.bottom),
            ],
          ),
        ),
      ),
      isScrollControlled: true,
    );
  }

  void _showSuccessDialog(String itemName) {
    Get.dialog(
      Dialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
        ),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Success icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.accentSurface,
                  shape: BoxShape.circle,
                  boxShadow: AppTheme.accentGlow,
                ),
                child: Icon(
                  Icons.check_rounded,
                  size: 40,
                  color: AppTheme.accent,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Berhasil! 🎉',
                style: GoogleFonts.inter(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$itemName berhasil dipinjam',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Get.back(),
                  child: Text(
                    'OK',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      barrierDismissible: true,
    );

    // Auto dismiss after 2.5 seconds
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (Get.isDialogOpen == true) {
        Get.back();
      }
    });
  }
}

// ─── Item Card Widget ────────────────────────────────────────────
class _ItemCard extends StatelessWidget {
  final ItemModel item;
  final VoidCallback onTap;

  const _ItemCard({required this.item, required this.onTap});

  IconData get _categoryIcon {
    if (item.isBarang) {
      // Choose icon based on name hints
      final name = item.name.toLowerCase();
      if (name.contains('kamera') || name.contains('camera')) {
        return Icons.camera_alt_rounded;
      }
      if (name.contains('laptop') || name.contains('komputer')) {
        return Icons.laptop_mac_rounded;
      }
      if (name.contains('proyektor') || name.contains('projector')) {
        return Icons.videocam_rounded;
      }
      if (name.contains('mic') || name.contains('mikrofon')) {
        return Icons.mic_rounded;
      }
      if (name.contains('speaker')) {
        return Icons.speaker_rounded;
      }
      if (name.contains('tripod')) {
        return Icons.filter_center_focus_rounded;
      }
      return Icons.inventory_2_rounded;
    }
    // Ruangan
    final name = item.name.toLowerCase();
    if (name.contains('rapat') || name.contains('meeting')) {
      return Icons.meeting_room_rounded;
    }
    if (name.contains('lab')) {
      return Icons.science_rounded;
    }
    if (name.contains('aula') || name.contains('hall')) {
      return Icons.corporate_fare_rounded;
    }
    if (name.contains('studio')) {
      return Icons.radio_rounded;
    }
    return Icons.meeting_room_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          gradient: AppTheme.cardGradient,
          borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
          border: Border.all(
            color: item.isAvailable
                ? AppTheme.surfaceBorder
                : AppTheme.danger.withValues(alpha: 0.3),
            width: 0.5,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: item.isAvailable
                      ? AppTheme.accentSurface
                      : AppTheme.dangerSurface,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                ),
                child: Icon(
                  _categoryIcon,
                  color: item.isAvailable ? AppTheme.accent : AppTheme.danger,
                  size: 24,
                ),
              ),
              const Spacer(),

              // Category tag
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: item.isBarang
                      ? AppTheme.accentSurface
                      : AppTheme.warningSurface,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  item.category,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: item.isBarang ? AppTheme.accent : AppTheme.warning,
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Name
              Text(
                item.name,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                  height: 1.2,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),

              // Status
              Row(
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: item.isAvailable
                          ? AppTheme.accent
                          : AppTheme.danger,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    item.isAvailable ? 'Tersedia' : 'Dipinjam',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: item.isAvailable
                          ? AppTheme.accent
                          : AppTheme.danger,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
