import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/item_model.dart';
import '../models/borrow_log_model.dart';
import '../models/announcement_model.dart';

class SupabaseService {
  static SupabaseClient get _client => Supabase.instance.client;

  // ─── Items ─────────────────────────────────────────────────────

  /// Fetch all items from the database
  static Future<List<ItemModel>> fetchItems() async {
    final response = await _client
        .from('items')
        .select()
        .order('category')
        .order('name');
    return (response as List)
        .map((e) => ItemModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Stream real-time changes on the items table
  static Stream<List<Map<String, dynamic>>> streamItems() {
    return _client
        .from('items')
        .stream(primaryKey: ['id'])
        .order('category')
        .order('name');
  }

  /// Update item availability
  static Future<void> updateItemAvailability(
    String itemId,
    bool isAvailable,
  ) async {
    await _client
        .from('items')
        .update({'is_available': isAvailable})
        .eq('id', itemId);
  }

  // ─── Borrow Logs ──────────────────────────────────────────────

  /// Create a new borrow log entry
  static Future<void> createBorrowLog({
    required String itemId,
    required String borrowerName,
  }) async {
    await _client.from('borrow_logs').insert({
      'item_id': itemId,
      'borrower_name': borrowerName,
      'borrow_date': DateTime.now().toUtc().toIso8601String(),
      'status': 'Dipinjam',
    });
  }

  /// Fetch all borrow logs with joined item data
  static Future<List<BorrowLogModel>> fetchBorrowLogs({
    String? statusFilter,
  }) async {
    var query = _client
        .from('borrow_logs')
        .select('*, items(name, category)');

    if (statusFilter != null) {
      query = query.eq('status', statusFilter);
    }

    final response = await query.order('borrow_date', ascending: false);
    return (response as List)
        .map((e) => BorrowLogModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Fetch all borrow logs (all statuses) for PDF report
  static Future<List<BorrowLogModel>> fetchAllBorrowLogs() async {
    final response = await _client
        .from('borrow_logs')
        .select('*, items(name, category)')
        .order('borrow_date', ascending: false);
    return (response as List)
        .map((e) => BorrowLogModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Return an item: update borrow log status and increment available quantity
  static Future<void> returnItem({
    required String logId,
    required String itemId,
  }) async {
    // Update borrow log status
    await _client
        .from('borrow_logs')
        .update({'status': 'Selesai'})
        .eq('id', logId);

    // Fetch current quantities
    final itemResponse = await _client
        .from('items')
        .select('quantity, available_quantity')
        .eq('id', itemId)
        .single();
    
    final totalQty = itemResponse['quantity'] as int? ?? 1;
    final currentAvail = itemResponse['available_quantity'] as int? ?? 1;
    final newAvail = (currentAvail + 1).clamp(0, totalQty);

    // Update availability
    await _client
        .from('items')
        .update({
          'available_quantity': newAvail,
          'is_available': true,
        })
        .eq('id', itemId);
  }

  /// Borrow an item: decrement available quantity and create borrow log
  static Future<void> borrowItem({
    required String itemId,
    required String borrowerName,
  }) async {
    // Fetch current quantities
    final itemResponse = await _client
        .from('items')
        .select('quantity, available_quantity')
        .eq('id', itemId)
        .single();
    
    final currentAvail = itemResponse['available_quantity'] as int? ?? 1;
    if (currentAvail <= 0) {
      throw Exception('Stok item ini sedang kosong / tidak tersedia.');
    }

    final newAvail = currentAvail - 1;

    // Update availability
    await _client
        .from('items')
        .update({
          'available_quantity': newAvail,
          'is_available': newAvail > 0,
        })
        .eq('id', itemId);

    // Create borrow log
    await createBorrowLog(
      itemId: itemId,
      borrowerName: borrowerName,
    );
  }

  // ─── Announcements ──────────────────────────────────────────────

  /// Stream real-time changes on the announcements table
  static Stream<List<AnnouncementModel>> streamAnnouncements() {
    return _client
        .from('announcements')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .map((list) => list
            .map((e) => AnnouncementModel.fromJson(e))
            .toList());
  }
}

