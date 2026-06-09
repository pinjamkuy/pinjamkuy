class BorrowLogModel {
  final String id;
  final String itemId;
  final String borrowerName;
  final DateTime borrowDate;
  final String status; // 'Dipinjam' or 'Selesai'
  final String? itemName; // Joined from items table
  final String? itemCategory; // Joined from items table

  BorrowLogModel({
    required this.id,
    required this.itemId,
    required this.borrowerName,
    required this.borrowDate,
    required this.status,
    this.itemName,
    this.itemCategory,
  });

  factory BorrowLogModel.fromJson(Map<String, dynamic> json) {
    // Handle joined data from items table
    final items = json['items'];
    return BorrowLogModel(
      id: json['id'] as String,
      itemId: json['item_id'] as String,
      borrowerName: json['borrower_name'] as String,
      borrowDate: DateTime.parse(json['borrow_date'] as String),
      status: json['status'] as String,
      itemName: items != null ? items['name'] as String? : null,
      itemCategory: items != null ? items['category'] as String? : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'item_id': itemId,
      'borrower_name': borrowerName,
      'borrow_date': borrowDate.toIso8601String(),
      'status': status,
    };
  }

  bool get isDipinjam => status == 'Dipinjam';
  bool get isSelesai => status == 'Selesai';
}
