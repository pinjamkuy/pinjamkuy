class ItemModel {
  final String id;
  final String name;
  final String category; // 'Barang' or 'Ruangan'
  final bool isAvailable;
  final String? imageUrl;

  ItemModel({
    required this.id,
    required this.name,
    required this.category,
    required this.isAvailable,
    this.imageUrl,
  });

  factory ItemModel.fromJson(Map<String, dynamic> json) {
    return ItemModel(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      isAvailable: json['is_available'] as bool? ?? true,
      imageUrl: json['image_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'is_available': isAvailable,
      'image_url': imageUrl,
    };
  }

  ItemModel copyWith({
    String? id,
    String? name,
    String? category,
    bool? isAvailable,
    String? imageUrl,
  }) {
    return ItemModel(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      isAvailable: isAvailable ?? this.isAvailable,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }

  bool get isBarang => category == 'Barang';
  bool get isRuangan => category == 'Ruangan';
}
