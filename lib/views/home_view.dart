import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/home_controller.dart';
import '../controllers/catalog_controller.dart';
import '../theme/app_theme.dart';
import 'dashboard_view.dart';
import 'catalog_view.dart';
import 'activity_view.dart';
import 'profile_view.dart';

class HomeView extends StatelessWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    // Initialize required controllers
    final homeController = Get.put(HomeController());
    Get.put(CatalogController());

    final views = [
      const DashboardView(),
      const CatalogView(),
      const ActivityView(),
      const ProfileView(),
    ];

    return Obx(() => Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: homeController.currentIndex.value,
        children: views,
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          margin: const EdgeInsets.fromLTRB(24, 0, 24, 16),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(AppTheme.radiusXLarge),
            border: Border.all(
              color: AppTheme.surfaceBorder,
              width: 1,
            ),
            boxShadow: AppTheme.softShadow,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                index: 0,
                icon: Icons.dashboard_outlined,
                activeIcon: Icons.dashboard_rounded,
                label: 'Beranda',
                homeController: homeController,
              ),
              _buildNavItem(
                index: 1,
                icon: Icons.inventory_2_outlined,
                activeIcon: Icons.inventory_2_rounded,
                label: 'Katalog',
                homeController: homeController,
              ),
              _buildNavItem(
                index: 2,
                icon: Icons.history_outlined,
                activeIcon: Icons.history_rounded,
                label: 'Aktivitas',
                homeController: homeController,
              ),
              _buildNavItem(
                index: 3,
                icon: Icons.person_outline_rounded,
                activeIcon: Icons.person_rounded,
                label: 'Profil',
                homeController: homeController,
              ),
            ],
          ),
        ),
      ),
    ));
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required HomeController homeController,
  }) {
    final isSelected = homeController.currentIndex.value == index;
    return GestureDetector(
      onTap: () => homeController.changeIndex(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedScale(
              scale: isSelected ? 1.1 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: Icon(
                isSelected ? activeIcon : icon,
                color: isSelected ? AppTheme.accent : AppTheme.textSecondary,
                size: 24,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppTheme.accent : AppTheme.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 4),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: isSelected ? 6 : 0,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.accent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
