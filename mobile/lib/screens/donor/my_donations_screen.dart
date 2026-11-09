import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../models/donation_model.dart';
import '../../providers/donation_provider.dart';
import '../../providers/activity_provider.dart';
import 'create_donation_screen.dart';

class MyDonationsScreen extends StatefulWidget {
  const MyDonationsScreen({super.key});

  @override
  State<MyDonationsScreen> createState() => _MyDonationsScreenState();
}

class _MyDonationsScreenState extends State<MyDonationsScreen> {
  final _handoverCodeController = TextEditingController();
  final _handoverNotesController = TextEditingController();
  final _editTitleController = TextEditingController();
  final _editDescController = TextEditingController();
  final _editQtyController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DonationProvider>(context, listen: false).fetchMyDonations();
    });
  }

  @override
  void dispose() {
    _handoverCodeController.dispose();
    _handoverNotesController.dispose();
    _editTitleController.dispose();
    _editDescController.dispose();
    _editQtyController.dispose();
    super.dispose();
  }

  void _showHandoverModal() {
    _handoverCodeController.clear();
    _handoverNotesController.clear();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Verify Handover Code', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Enter the 6-character code presented by the recipient or volunteer:',
              style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _handoverCodeController,
              textAlign: TextAlign.center,
              textCapitalization: TextCapitalization.characters,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 3, color: AppColors.primaryGreen),
              decoration: const InputDecoration(
                hintText: 'e.g. FB-8392',
                hintStyle: TextStyle(letterSpacing: 1),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _handoverNotesController,
              decoration: const InputDecoration(
                labelText: 'Handover Notes (Optional)',
                hintText: 'e.g. Handed over 15 containers...',
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
            onPressed: () async {
              final code = _handoverCodeController.text.trim();
              if (code.isEmpty) return;

              final messenger = ScaffoldMessenger.of(context);
              final donProv = Provider.of<DonationProvider>(context, listen: false);
              final activity = Provider.of<ActivityProvider>(context, listen: false);
              Navigator.pop(ctx);

              final success = await activity.confirmHandover(
                'by_code',
                code,
                notes: _handoverNotesController.text.trim(),
              );

              if (success) {
                donProv.fetchMyDonations();
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Handover verified! Food rescue marked as complete 🎉'),
                    backgroundColor: AppColors.primaryGreen,
                  ),
                );
              } else {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(activity.errorMessage.isNotEmpty ? activity.errorMessage : 'Invalid handover code'),
                    backgroundColor: AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Confirm Handover'),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog(DonationModel donation) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Food Listing?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to cancel "${donation.title}"? Any unreserved quantity will be removed from the discovery feed.',
          style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Keep Listing'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              final donProvider = Provider.of<DonationProvider>(context, listen: false);
              Navigator.pop(ctx);

              final success = await donProvider.cancelDonation(donation.id);
              if (success) {
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Donation listing cancelled successfully'),
                    backgroundColor: AppColors.primaryGreen,
                  ),
                );
              } else {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(donProvider.errorMessage.isNotEmpty ? donProvider.errorMessage : 'Failed to cancel listing'),
                    backgroundColor: AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Cancel Listing'),
          ),
        ],
      ),
    );
  }

  void _showEditModal(DonationModel donation) {
    _editTitleController.text = donation.title;
    _editDescController.text = donation.description;
    _editQtyController.text = donation.availableQuantity.toStringAsFixed(0);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Edit Food Listing', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
            const SizedBox(height: 12),
            TextField(
              controller: _editTitleController,
              decoration: const InputDecoration(labelText: 'Food Title'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _editDescController,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _editQtyController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: 'Available Quantity (${donation.unit})'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                final qty = double.tryParse(_editQtyController.text.trim()) ?? 0;
                if (qty <= 0) return;

                final messenger = ScaffoldMessenger.of(context);
                final donProvider = Provider.of<DonationProvider>(context, listen: false);
                Navigator.pop(ctx);

                final success = await donProvider.updateDonation(donation.id, {
                  'title': _editTitleController.text.trim(),
                  'description': _editDescController.text.trim(),
                  'availableQuantity': qty,
                });

                if (success) {
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Donation updated successfully!'), backgroundColor: AppColors.primaryGreen),
                  );
                }
              },
              child: const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final donProvider = Provider.of<DonationProvider>(context);
    final dateFormat = DateFormat('MMM d, h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Published Donations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'Verify Handover Code',
            onPressed: _showHandoverModal,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => donProvider.fetchMyDonations(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Post Food'),
        onPressed: () {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CreateDonationScreen()));
        },
      ),
      body: donProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : donProvider.myDonations.isEmpty
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
                        child: const Icon(Icons.inventory_2_outlined, size: 40, color: AppColors.primaryGreen),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No donations published yet',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'List surplus meals to connect with local charities',
                        style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CreateDonationScreen()));
                        },
                        icon: const Icon(Icons.add, color: Colors.white),
                        label: const Text('Publish Your First Donation'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primaryGreen,
                  onRefresh: () async => donProvider.fetchMyDonations(),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    itemCount: donProvider.myDonations.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = donProvider.myDonations[index];
                      final isCancelled = item.status == 'cancelled';
                      final isCompleted = item.status == 'completed';

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
                                    color: isCancelled
                                        ? AppColors.error.withValues(alpha: 0.1)
                                        : isCompleted
                                            ? AppColors.primaryGreen.withValues(alpha: 0.1)
                                            : AppColors.lightGreen,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    item.status.replaceAll('_', ' ').toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: isCancelled
                                          ? AppColors.error
                                          : isCompleted
                                              ? AppColors.primaryGreen
                                              : AppColors.darkGreen,
                                    ),
                                  ),
                                ),
                                Text(
                                  '${item.availableQuantity} of ${item.totalQuantity} ${item.unit}',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              item.title,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                            ),
                            const SizedBox(height: 10),

                            // Inventory Progress Bar
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: item.totalQuantity > 0 ? (item.totalQuantity - item.availableQuantity) / item.totalQuantity : 0,
                                backgroundColor: AppColors.lightGreen,
                                color: AppColors.primaryGreen,
                                minHeight: 6,
                              ),
                            ),
                            const SizedBox(height: 10),

                            Row(
                              children: [
                                const Icon(Icons.schedule, size: 14, color: AppColors.secondaryText),
                                const SizedBox(width: 4),
                                Text(
                                  'Deadline: ${dateFormat.format(item.pickupEndTime)}',
                                  style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                                ),
                              ],
                            ),

                            if (!isCancelled && !isCompleted) ...[
                              const Divider(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton.icon(
                                    onPressed: () => _showEditModal(item),
                                    icon: const Icon(Icons.edit_outlined, size: 16),
                                    label: const Text('Edit', style: TextStyle(fontSize: 12)),
                                  ),
                                  const SizedBox(width: 8),
                                  TextButton.icon(
                                    style: TextButton.styleFrom(foregroundColor: AppColors.error),
                                    onPressed: () => _showCancelDialog(item),
                                    icon: const Icon(Icons.close, size: 16),
                                    label: const Text('Cancel', style: TextStyle(fontSize: 12)),
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
