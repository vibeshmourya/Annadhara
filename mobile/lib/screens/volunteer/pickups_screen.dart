import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../models/pickup_model.dart';
import '../../providers/activity_provider.dart';

class VolunteerPickupsScreen extends StatefulWidget {
  const VolunteerPickupsScreen({super.key});

  @override
  State<VolunteerPickupsScreen> createState() => _VolunteerPickupsScreenState();
}

class _VolunteerPickupsScreenState extends State<VolunteerPickupsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ActivityProvider>(context, listen: false).fetchPickups();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _claimMission(PickupModel task) async {
    final activity = Provider.of<ActivityProvider>(context, listen: false);
    final success = await activity.claimPickup(task.id);
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Mission claimed! Added to My Active Tasks.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        _tabController.animateTo(1);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(activity.errorMessage.isNotEmpty ? activity.errorMessage : 'Failed to claim task'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _advanceTaskStatus(PickupModel task, String nextStatus) async {
    final activity = Provider.of<ActivityProvider>(context, listen: false);
    final success = await activity.updatePickupStatus(task.id, nextStatus);
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Task updated to ${nextStatus.replaceAll('_', ' ')}!'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(activity.errorMessage.isNotEmpty ? activity.errorMessage : 'Failed to update task'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activity = Provider.of<ActivityProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Volunteer Missions'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primaryGreen,
          unselectedLabelColor: AppColors.secondaryText,
          indicatorColor: AppColors.primaryGreen,
          tabs: [
            Tab(text: 'Available (${activity.availablePickups.length})'),
            Tab(text: 'My Active Tasks (${activity.myPickups.length})'),
          ],
        ),
      ),
      body: activity.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : TabBarView(
              controller: _tabController,
              children: [
                // Available Unassigned Missions
                _buildAvailableList(activity),
                // My Active Tasks
                _buildActiveList(activity),
              ],
            ),
    );
  }

  Widget _buildAvailableList(ActivityProvider activity) {
    final dateFormat = DateFormat('MMM d, h:mm a');

    if (activity.availablePickups.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.lightGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline, size: 40, color: AppColors.primaryGreen),
            ),
            const SizedBox(height: 12),
            const Text(
              'No unassigned missions',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
            ),
            const SizedBox(height: 4),
            const Text(
              'All current pickups have been assigned to volunteers!',
              style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primaryGreen,
      onRefresh: () async => activity.fetchPickups(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: activity.availablePickups.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final task = activity.availablePickups[index];

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
                        color: AppColors.lightGreen,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'OPEN MISSION',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.darkGreen),
                      ),
                    ),
                    Text(
                      'Deadline: ${dateFormat.format(task.pickupWindowEnd)}',
                      style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  task.donationTitle,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                ),
                const SizedBox(height: 8),

                // Pickup location
                Row(
                  children: [
                    const Icon(Icons.storefront_outlined, size: 16, color: AppColors.primaryGreen),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'From: ${task.donorName} (${task.pickupStreet}, ${task.pickupCity})',
                        style: const TextStyle(fontSize: 12, color: AppColors.primaryText),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Delivery location
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 16, color: AppColors.darkGreen),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'To: ${task.recipientName} (${task.deliveryStreet})',
                        style: const TextStyle(fontSize: 12, color: AppColors.primaryText),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                SizedBox(
                  width: double.infinity,
                  height: 40,
                  child: ElevatedButton.icon(
                    onPressed: () => _claimMission(task),
                    icon: const Icon(Icons.handshake_outlined, size: 16),
                    label: const Text('Claim This Mission'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildActiveList(ActivityProvider activity) {
    if (activity.myPickups.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.lightGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.delivery_dining, size: 40, color: AppColors.primaryGreen),
            ),
            const SizedBox(height: 12),
            const Text(
              'No active pickup tasks',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
            ),
            const SizedBox(height: 4),
            const Text(
              'Claim available missions from the Available tab to start delivering',
              style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primaryGreen,
      onRefresh: () async => activity.fetchPickups(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: activity.myPickups.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final task = activity.myPickups[index];
          final status = task.status;

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
                        color: status == 'completed'
                            ? AppColors.primaryGreen.withValues(alpha: 0.1)
                            : AppColors.lightGreen,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        status.replaceAll('_', ' ').toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: status == 'completed' ? AppColors.primaryGreen : AppColors.darkGreen,
                        ),
                      ),
                    ),
                    Text(
                      '${task.requestedQuantity} ${task.donationUnit}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  task.donationTitle,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                ),
                const SizedBox(height: 8),

                // Route card
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.trip_origin, size: 14, color: AppColors.primaryGreen),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Pick up: ${task.pickupStreet}, ${task.pickupCity} (${task.donorName})',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryText),
                            ),
                          ),
                        ],
                      ),
                      const Padding(
                        padding: EdgeInsets.only(left: 6),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: SizedBox(
                            height: 14,
                            child: VerticalDivider(color: AppColors.border, thickness: 1.5),
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 14, color: AppColors.error),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Deliver to: ${task.deliveryStreet} (${task.recipientName})',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryText),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Lifecycle actions
                if (status != 'completed') ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (status == 'assigned')
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _advanceTaskStatus(task, 'in_progress'),
                            icon: const Icon(Icons.directions_bike, size: 16),
                            label: const Text('Start Trip (In Progress)'),
                          ),
                        ),
                      if (status == 'in_progress')
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _advanceTaskStatus(task, 'collected'),
                            icon: const Icon(Icons.inventory, size: 16),
                            label: const Text('Mark Collected from Donor'),
                          ),
                        ),
                      if (status == 'collected')
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _advanceTaskStatus(task, 'completed'),
                            icon: const Icon(Icons.check_circle, size: 16),
                            label: const Text('Mark Delivered to Recipient'),
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
    );
  }
}
