import 'package:get/get.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import '../models/borrow_log_model.dart';
import '../services/supabase_service.dart';

class AdminController extends GetxController {
  final activeLogs = <BorrowLogModel>[].obs;
  final allLogs = <BorrowLogModel>[].obs;
  final isLoading = true.obs;
  final isReturning = <String, bool>{}.obs;

  @override
  void onInit() {
    super.onInit();
    fetchActiveLogs();
  }

  /// Fetch active borrow logs (status: Dipinjam)
  Future<void> fetchActiveLogs() async {
    try {
      isLoading.value = true;
      activeLogs.value = await SupabaseService.fetchBorrowLogs(
        statusFilter: 'Dipinjam',
      );
    } catch (e) {
      Get.snackbar(
        'Error',
        'Gagal memuat data: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  /// Return an item
  Future<void> returnItem(String logId, String itemId) async {
    try {
      isReturning[logId] = true;
      isReturning.refresh();

      await SupabaseService.returnItem(logId: logId, itemId: itemId);

      // Remove from active list
      activeLogs.removeWhere((log) => log.id == logId);

      Get.snackbar(
        'Berhasil',
        'Barang telah dikembalikan',
        snackPosition: SnackPosition.BOTTOM,
      );
    } catch (e) {
      Get.snackbar(
        'Error',
        'Gagal mengembalikan: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isReturning.remove(logId);
      isReturning.refresh();
    }
  }

  /// Generate and display PDF report
  Future<void> generatePdfReport() async {
    try {
      // Fetch all logs for report
      allLogs.value = await SupabaseService.fetchAllBorrowLogs();

      if (allLogs.isEmpty) {
        Get.snackbar(
          'Info',
          'Belum ada data peminjaman',
          snackPosition: SnackPosition.BOTTOM,
        );
        return;
      }

      final pdf = pw.Document();
      final dateFormat = DateFormat('dd MMM yyyy, HH:mm', 'id');
      final now = DateFormat('dd MMMM yyyy', 'id').format(DateTime.now());

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          header: (context) => pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'PinjamKuy',
                    style: pw.TextStyle(
                      fontSize: 24,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('#00E676'),
                    ),
                  ),
                  pw.Text(
                    'Laporan Peminjaman',
                    style: pw.TextStyle(
                      fontSize: 14,
                      color: PdfColors.grey600,
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 4),
              pw.Text(
                'Dicetak pada: $now',
                style: pw.TextStyle(
                  fontSize: 10,
                  color: PdfColors.grey500,
                ),
              ),
              pw.SizedBox(height: 8),
              pw.Divider(color: PdfColors.grey300),
              pw.SizedBox(height: 12),
            ],
          ),
          footer: (context) => pw.Container(
            alignment: pw.Alignment.centerRight,
            margin: const pw.EdgeInsets.only(top: 12),
            child: pw.Text(
              'Halaman ${context.pageNumber} / ${context.pagesCount}',
              style: pw.TextStyle(
                fontSize: 9,
                color: PdfColors.grey500,
              ),
            ),
          ),
          build: (context) => [
            // Summary row
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
              children: [
                _buildSummaryBox(
                  'Total Peminjaman',
                  '${allLogs.length}',
                ),
                _buildSummaryBox(
                  'Sedang Dipinjam',
                  '${allLogs.where((l) => l.isDipinjam).length}',
                ),
                _buildSummaryBox(
                  'Selesai',
                  '${allLogs.where((l) => l.isSelesai).length}',
                ),
              ],
            ),
            pw.SizedBox(height: 20),

            // Table
            pw.TableHelper.fromTextArray(
              context: context,
              headerStyle: pw.TextStyle(
                fontWeight: pw.FontWeight.bold,
                fontSize: 10,
                color: PdfColors.white,
              ),
              headerDecoration: const pw.BoxDecoration(
                color: PdfColor.fromInt(0xFF1B5E20),
              ),
              headerAlignment: pw.Alignment.centerLeft,
              cellStyle: const pw.TextStyle(fontSize: 9),
              cellHeight: 32,
              cellAlignments: {
                0: pw.Alignment.centerLeft,
                1: pw.Alignment.centerLeft,
                2: pw.Alignment.centerLeft,
                3: pw.Alignment.centerLeft,
                4: pw.Alignment.center,
              },
              headers: [
                'No',
                'Item',
                'Peminjam',
                'Tanggal',
                'Status',
              ],
              data: List.generate(allLogs.length, (index) {
                final log = allLogs[index];
                return [
                  '${index + 1}',
                  log.itemName ?? '-',
                  log.borrowerName,
                  dateFormat.format(log.borrowDate),
                  log.status,
                ];
              }),
            ),
          ],
        ),
      );

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
        name: 'Laporan_PinjamKuy_$now',
      );
    } catch (e) {
      Get.snackbar(
        'Error',
        'Gagal membuat PDF: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  pw.Widget _buildSummaryBox(String label, String value) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: PdfColors.grey300),
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        children: [
          pw.Text(
            value,
            style: pw.TextStyle(
              fontSize: 20,
              fontWeight: pw.FontWeight.bold,
              color: PdfColor.fromHex('#1B5E20'),
            ),
          ),
          pw.SizedBox(height: 4),
          pw.Text(
            label,
            style: pw.TextStyle(
              fontSize: 9,
              color: PdfColors.grey600,
            ),
          ),
        ],
      ),
    );
  }

  /// Stats for dashboard
  int get activeCount => activeLogs.length;
}
