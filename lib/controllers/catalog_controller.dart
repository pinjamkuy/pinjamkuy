import 'dart:async';
import 'package:get/get.dart';
import '../models/item_model.dart';
import '../services/supabase_service.dart';

class CatalogController extends GetxController {
  final items = <ItemModel>[].obs;
  final isLoading = true.obs;
  final selectedCategory = 'Semua'.obs;
  final searchQuery = ''.obs;
  StreamSubscription? _streamSub;

  @override
  void onInit() {
    super.onInit();
    _subscribeToRealtime();
  }

  @override
  void onClose() {
    _streamSub?.cancel();
    super.onClose();
  }

  /// Subscribe to Supabase real-time stream on items table
  void _subscribeToRealtime() {
    isLoading.value = true;
    _streamSub = SupabaseService.streamItems().listen(
      (data) {
        items.value = data
            .map((e) => ItemModel.fromJson(e))
            .toList();
        isLoading.value = false;
      },
      onError: (error) {
        isLoading.value = false;
        Get.snackbar(
          'Error',
          'Gagal memuat data: $error',
          snackPosition: SnackPosition.BOTTOM,
        );
      },
    );
  }

  /// Filter items by category
  List<ItemModel> get filteredItems {
    var result = items.toList();

    // Category filter
    if (selectedCategory.value != 'Semua') {
      result = result
          .where((item) => item.category == selectedCategory.value)
          .toList();
    }

    // Search filter
    if (searchQuery.value.isNotEmpty) {
      result = result
          .where(
            (item) => item.name.toLowerCase().contains(
              searchQuery.value.toLowerCase(),
            ),
          )
          .toList();
    }

    return result;
  }

  /// Borrow an item
  Future<bool> borrowItem(String itemId, String borrowerName) async {
    try {
      await SupabaseService.borrowItem(
        itemId: itemId,
        borrowerName: borrowerName,
      );
      return true;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Gagal meminjam: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    }
  }

  void setCategory(String category) {
    selectedCategory.value = category;
  }

  void setSearch(String query) {
    searchQuery.value = query;
  }

  /// Count items by availability
  int get availableCount => items.where((i) => i.isAvailable).length;
  int get borrowedCount => items.where((i) => !i.isAvailable).length;
}
