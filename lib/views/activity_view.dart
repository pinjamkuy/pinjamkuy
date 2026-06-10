import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/supabase_service.dart';
import '../models/borrow_log_model.dart';
import '../theme/app_theme.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/empty_state_widget.dart';

class ActivityView extends StatefulWidget {
  const ActivityView({super.key});

  @override
  State<ActivityView> createState() => _ActivityViewState();
}

class _ActivityViewState extends State<ActivityView> {
  late Future<List<BorrowLogModel>> _logsFuture;
  StreamSubscription? _realtimeSubscription;

  @override
  void initState() {
    super.initState();
    _refreshLogs();
    _subscribeToRealtime();
  }

  @override
  void dispose() {
    _realtimeSubscription?.cancel();
    super.dispose();
  }

  void _subscribeToRealtime() {
    _realtimeSubscription = Supabase.instance.client
        .from('borrow_logs')
        .stream(primaryKey: ['id'])
        .listen((_) {
          _refreshLogs();
        });
  }

  void _refreshLogs() {
    setState(() {
      _logsFuture = SupabaseService.fetchBorrowLogs();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            _refreshLogs();
          },
          color: AppTheme.accent,
          backgroundColor: AppTheme.surface,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Aktivitas Kampus',
                        style: GoogleFonts.inter(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Daftar log peminjaman barang & ruangan aktif',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // FutureBuilder list
              FutureBuilder<List<BorrowLogModel>>(
                future: _logsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 4),
                        child: ShimmerList(),
                      ),
                    );
                  }

                  if (snapshot.hasError) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Text(
                          'Gagal memuat riwayat: ${snapshot.error}',
                          style: GoogleFonts.inter(color: AppTheme.dangerColor),
                        ),
                      ),
                    );
                  }

                  final logs = snapshot.data ?? [];
                  if (logs.isEmpty) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: EmptyStateWidget(
                          icon: Icons.history_edu_rounded,
                          title: 'Belum Ada Aktivitas',
                          subtitle: 'Riwayat peminjaman kampus Anda masih kosong.',
                        ),
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final log = logs[index];
                          return _buildLogCard(log);
                        },
                        childCount: logs.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLogCard(BorrowLogModel log) {
    final isDipinjam = log.status == 'Dipinjam';
    
    // Parse date safely
    String formattedDate = '';
    try {
      final parsedDate = log.borrowDate.toLocal();
      formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(parsedDate);
    } catch (_) {
      formattedDate = log.borrowDate.toIso8601String();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        border: Border.all(color: AppTheme.surfaceBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon Box based on status
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDipinjam 
                  ? AppTheme.accentSurface
                  : AppTheme.surfaceLight,
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
            ),
            child: Icon(
              isDipinjam 
                  ? Icons.schedule_rounded
                  : Icons.task_alt_rounded,
              color: isDipinjam ? AppTheme.accent : AppTheme.textSecondary,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),

          // Log Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  log.itemName ?? 'Barang / Ruangan',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Peminjam: ${log.borrowerName}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  formattedDate,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppTheme.textTertiary,
                  ),
                ),
              ],
            ),
          ),

          // Status Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isDipinjam 
                  ? AppTheme.accentSurface
                  : AppTheme.surfaceLight,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDipinjam 
                    ? AppTheme.accent.withValues(alpha: 0.2)
                    : AppTheme.surfaceBorder,
              ),
            ),
            child: Text(
              log.status,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: isDipinjam ? AppTheme.accent : AppTheme.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
