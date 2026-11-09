import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../models/reservation_model.dart';
import '../../providers/activity_provider.dart';

class DonorRequestsScreen extends StatefulWidget {
  const DonorRequestsScreen({super.key});

  @override
  State<DonorRequestsScreen> createState() => _DonorRequestsScreenState();
}

class _DonorRequestsScreenState extends State<DonorRequestsScreen> {
  final _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ActivityProvider>(context, listen: false).fetchReservations();
    });
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  void _showRejectDialog(ReservationModel res) {
    _reasonController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Decline Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Specify reason for declining ${res.recipientName}\'s request for "${res.donationTitle}":',
              style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _reasonController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Reason for decline',
                hintText: 'e.g. Schedule conflict or quantity committed elsewhere...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              final reason = _reasonController.text.trim();
              final messenger = ScaffoldMessenger.of(context);
              final activity = Provider.of<ActivityProvider>(context, listen: false);
              Navigator.pop(ctx);

              final success = await activity.updateReservationStatus(
                res.id,
                'rejected',
                notes: reason.isNotEmpty ? reason : 'Declined by donor',
              );

              if (success) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Reservation request declined'), backgroundColor: AppColors.secondaryText),
                );
              }
            },
            child: const Text('Confirm Decline'),
          ),
        ],
      ),
    );
  }

  void _showApproveDialog(ReservationModel res) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Approve Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Text(
          'Approve reservation of ${res.requestedQuantity} ${res.donationUnit} of "${res.donationTitle}" for ${res.recipientName}?\n\nA 6-character Handover Code will be issued to coordinate pickup.',
          style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              final activity = Provider.of<ActivityProvider>(context, listen: false);
              Navigator.pop(ctx);

              final success = await activity.updateReservationStatus(res.id, 'approved');
              if (success) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Reservation approved! Awaiting pickup.'), backgroundColor: AppColors.primaryGreen),
                );
              }
            },
            child: const Text('Approve Reservation'),
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
        title: const Text('Reservation Requests'),
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
                        child: const Icon(Icons.mark_email_unread_outlined, size: 40, color: AppColors.primaryGreen),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No pending reservation requests',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Incoming requests from charities will appear here',
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
                      final isPending = item.status == 'pending';
                      final isApproved = item.status == 'approved';

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
                                    color: isPending
                                        ? AppColors.warning.withValues(alpha: 0.15)
                                        : isApproved
                                            ? AppColors.primaryGreen.withValues(alpha: 0.1)
                                            : AppColors.lightGreen,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    item.status.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: isPending
                                          ? AppColors.warning
                                          : isApproved
                                              ? AppColors.primaryGreen
                                              : AppColors.secondaryText,
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
                                const Icon(Icons.shield_outlined, size: 14, color: AppColors.primaryGreen),
                                const SizedBox(width: 4),
                                Text(
                                  item.recipientOrgName.isNotEmpty ? item.recipientOrgName : item.recipientName,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Requested: ${item.requestedQuantity} ${item.donationUnit}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.darkGreen),
                            ),
                            if (item.requestNotes.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.background,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Note: "${item.requestNotes}"',
                                  style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.secondaryText),
                                ),
                              ),
                            ],

                            if (isPending) ...[
                              const Divider(height: 20),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton(
                                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error)),
                                      onPressed: () => _showRejectDialog(item),
                                      child: const Text('Decline'),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () => _showApproveDialog(item),
                                      child: const Text('Approve'),
                                    ),
                                  ),
                                ],
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
