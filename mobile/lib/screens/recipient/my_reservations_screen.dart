import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../models/reservation_model.dart';
import '../../providers/activity_provider.dart';

class MyReservationsScreen extends StatefulWidget {
  const MyReservationsScreen({super.key});

  @override
  State<MyReservationsScreen> createState() => _MyReservationsScreenState();
}

class _MyReservationsScreenState extends State<MyReservationsScreen> {
  final _cancelReasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ActivityProvider>(context, listen: false).fetchReservations();
    });
  }

  @override
  void dispose() {
    _cancelReasonController.dispose();
    super.dispose();
  }

  void _showQrDialog(ReservationModel res) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Handover Verification Code', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: QrImageView(
                data: 'ANNADHARA:${res.id}:${res.handoverCode}',
                version: QrVersions.auto,
                size: 180,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.lightGreen,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                res.handoverCode,
                style: const TextStyle(
                  fontSize: 22,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w900,
                  color: AppColors.darkGreen,
                  letterSpacing: 2,
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Show this QR code or 6-character code to the food donor at pickup.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog(ReservationModel res) {
    _cancelReasonController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Reservation?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Are you sure you want to cancel your reservation for "${res.donationTitle}"? The reserved quantity will be returned to the community surplus.',
              style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _cancelReasonController,
              decoration: const InputDecoration(
                labelText: 'Reason for cancellation (optional)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Keep Reservation'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              final reason = _cancelReasonController.text.trim();
              final messenger = ScaffoldMessenger.of(context);
              final activity = Provider.of<ActivityProvider>(context, listen: false);
              Navigator.pop(ctx);

              final success = await activity.cancelReservation(res.id, reason: reason);
              if (success) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Reservation cancelled successfully'), backgroundColor: AppColors.primaryGreen),
                );
              }
            },
            child: const Text('Cancel Reservation'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activity = Provider.of<ActivityProvider>(context);
    final dateFormat = DateFormat('MMM d, h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Food Reservations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => activity.fetchReservations(),
          ),
        ],
      ),
      body: activity.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : activity.reservations.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: const BoxDecoration(
                          color: AppColors.lightGreen,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.shopping_bag_outlined, size: 40, color: AppColors.primaryGreen),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No reservations requested yet',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Browse available surplus food and request a reservation',
                        style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primaryGreen,
                  onRefresh: () async => activity.fetchReservations(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: activity.reservations.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = activity.reservations[index];
                      final isApproved = item.status == 'approved';
                      final isPending = item.status == 'pending';
                      final isCompleted = item.status == 'completed';
                      final isCancelled = item.status == 'cancelled';

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isApproved
                                        ? AppColors.primaryGreen.withValues(alpha: 0.1)
                                        : isPending
                                            ? AppColors.warning.withValues(alpha: 0.15)
                                            : isCompleted
                                                ? AppColors.info.withValues(alpha: 0.1)
                                                : AppColors.error.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    item.status.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: isApproved
                                          ? AppColors.primaryGreen
                                          : isPending
                                              ? AppColors.warning
                                              : isCompleted
                                                  ? AppColors.info
                                                  : AppColors.error,
                                    ),
                                  ),
                                ),
                                Text(
                                  dateFormat.format(item.createdAt),
                                  style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              item.donationTitle,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(Icons.business_outlined, size: 14, color: AppColors.secondaryText),
                                const SizedBox(width: 4),
                                Text(
                                  'Donor: ${item.donorName}',
                                  style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Reserved Quantity: ${item.requestedQuantity} ${item.donationUnit}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                            ),

                            if (item.pickupStreet.isNotEmpty || item.pickupCity.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.location_on_outlined, size: 14, color: AppColors.primaryGreen),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${item.pickupStreet}, ${item.pickupCity}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.primaryText),
                                  ),
                                ],
                              ),
                            ],

                            // Handover Code & QR button when approved
                            if (isApproved && item.handoverCode.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.lightGreen,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('HANDOVER CODE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.secondaryText)),
                                        const SizedBox(height: 2),
                                        Text(
                                          item.handoverCode,
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                            color: AppColors.darkGreen,
                                            letterSpacing: 2,
                                            fontFamily: 'monospace',
                                          ),
                                        ),
                                      ],
                                    ),
                                    ElevatedButton.icon(
                                      onPressed: () => _showQrDialog(item),
                                      icon: const Icon(Icons.qr_code, size: 16),
                                      label: const Text('Show QR', style: TextStyle(fontSize: 12)),
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            if (!isCompleted && !isCancelled) ...[
                              const Divider(height: 20),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton.icon(
                                  style: TextButton.styleFrom(foregroundColor: AppColors.error),
                                  onPressed: () => _showCancelDialog(item),
                                  icon: const Icon(Icons.close, size: 16),
                                  label: const Text('Cancel Reservation', style: TextStyle(fontSize: 12)),
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
