import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/constants/colors.dart';
import '../../models/reservation_model.dart';
import '../../models/pickup_model.dart';
import '../../providers/activity_provider.dart';
import '../../providers/auth_provider.dart';

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _handoverCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  void _loadData() {
    final activity = Provider.of<ActivityProvider>(context, listen: false);
    activity.fetchReservations();
    activity.fetchPickups();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _handoverCodeController.dispose();
    super.dispose();
  }

  void _showQrModal(ReservationModel res) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Pickup Handover Code', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
                data: 'FOODBRIDGE:${res.id}:${res.handoverCode}',
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
              'Present this verification code to the donor at pickup.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showConfirmHandoverDialog(ReservationModel res) {
    _handoverCodeController.clear();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Confirm Food Handover', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Enter the 6-character code from the recipient for "${res.donationTitle}":', style: const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
            const SizedBox(height: 12),
            TextField(
              controller: _handoverCodeController,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2),
              decoration: const InputDecoration(hintText: 'e.g. FB-7294'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final code = _handoverCodeController.text.trim();
              if (code.isEmpty) return;
              final activity = Provider.of<ActivityProvider>(context, listen: false);
              final success = await activity.confirmHandover(res.id, code, notes: 'Verified via mobile app');
              if (mounted) {
                Navigator.pop(context);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Handover confirmed! Zero waste achieved 🎉'), backgroundColor: AppColors.primaryGreen),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(activity.errorMessage.isNotEmpty ? activity.errorMessage : 'Invalid handover code'), backgroundColor: AppColors.error),
                  );
                }
              }
            },
            child: const Text('Verify Handover'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activity = Provider.of<ActivityProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Activity'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primaryGreen,
          unselectedLabelColor: AppColors.secondaryText,
          indicatorColor: AppColors.primaryGreen,
          tabs: [
            Tab(text: 'Reservations (${activity.reservations.length})'),
            Tab(text: 'Pickups (${activity.pickups.length})'),
          ],
        ),
      ),
      body: activity.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : TabBarView(
              controller: _tabController,
              children: [
                // 1. Reservations List
                RefreshIndicator(
                  onRefresh: () async => _loadData(),
                  color: AppColors.primaryGreen,
                  child: activity.reservations.isEmpty
                      ? const Center(child: Text('No active reservations', style: TextStyle(color: AppColors.secondaryText)))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: activity.reservations.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final res = activity.reservations[index];
                            return _reservationCard(res, user?.isDonor == true);
                          },
                        ),
                ),

                // 2. Pickups List
                RefreshIndicator(
                  onRefresh: () async => _loadData(),
                  color: AppColors.primaryGreen,
                  child: activity.pickups.isEmpty
                      ? const Center(child: Text('No pickup missions in queue', style: TextStyle(color: AppColors.secondaryText)))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: activity.pickups.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final task = activity.pickups[index];
                            return _pickupCard(task, user?.isVolunteer == true);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _reservationCard(ReservationModel res, bool isDonor) {
    final isApproved = res.status == 'approved';

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
              _statusChip(res.status),
              Text(
                '${res.requestedQuantity} ${res.donationUnit}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(res.donationTitle, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
          const SizedBox(height: 4),
          Text(
            isDonor ? 'Recipient: ${res.recipientName}' : 'Donor: ${res.donorName}',
            style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
          ),
          const SizedBox(height: 12),

          // Code display & Action
          if (isApproved) ...[
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
                      const Text('HANDOVER CODE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.darkGreen)),
                      Text(res.handoverCode, style: const TextStyle(fontSize: 16, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: AppColors.darkGreen)),
                    ],
                  ),
                  if (!isDonor)
                    IconButton(
                      icon: const Icon(Icons.qr_code_2, color: AppColors.primaryGreen),
                      onPressed: () => _showQrModal(res),
                      tooltip: 'Show QR Code',
                    )
                  else
                    ElevatedButton(
                      onPressed: () => _showConfirmHandoverDialog(res),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      child: const Text('Confirm Handover', style: TextStyle(fontSize: 11)),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _pickupCard(PickupModel task, bool isVolunteer) {
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
              _statusChip(task.status),
              Text('${task.requestedQuantity} ${task.donationUnit}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
            ],
          ),
          const SizedBox(height: 8),
          Text(task.donationTitle, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.location_on, size: 14, color: AppColors.primaryGreen),
              const SizedBox(width: 4),
              Expanded(child: Text('${task.pickupStreet}, ${task.pickupCity}', style: const TextStyle(fontSize: 11, color: AppColors.secondaryText))),
            ],
          ),
          const SizedBox(height: 12),

          // Volunteer actions
          if (isVolunteer && task.status == 'assigned')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final activity = Provider.of<ActivityProvider>(context, listen: false);
                  await activity.updatePickupStatus(task.id, 'in_progress');
                },
                child: const Text('Start Transport (In Progress)'),
              ),
            ),
          if (isVolunteer && task.status == 'in_progress')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final activity = Provider.of<ActivityProvider>(context, listen: false);
                  await activity.updatePickupStatus(task.id, 'collected');
                },
                child: const Text('Mark Collected from Donor'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _statusChip(String status) {
    Color bg = AppColors.lightGreen;
    Color text = AppColors.darkGreen;
    if (status == 'pending') {
      bg = const Color(0xFFFEF3C7);
      text = const Color(0xFF92400E);
    } else if (status == 'in_progress') {
      bg = const Color(0xFFE0E7FF);
      text = const Color(0xFF3730A3);
    } else if (status == 'cancelled' || status == 'rejected') {
      bg = const Color(0xFFFEE2E2);
      text = const Color(0xFF991B1B);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: text),
      ),
    );
  }
}

