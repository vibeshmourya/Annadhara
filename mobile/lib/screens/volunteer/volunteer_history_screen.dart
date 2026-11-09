import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/activity_provider.dart';

class VolunteerHistoryScreen extends StatefulWidget {
  const VolunteerHistoryScreen({super.key});

  @override
  State<VolunteerHistoryScreen> createState() => _VolunteerHistoryScreenState();
}

class _VolunteerHistoryScreenState extends State<VolunteerHistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ActivityProvider>(context, listen: false).fetchPickups();
    });
  }

  @override
  Widget build(BuildContext context) {
    final activity = Provider.of<ActivityProvider>(context);
    final completedTasks = activity.myPickups.where((t) => t.status == 'completed').toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Volunteer Mission History'),
      ),
      body: activity.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : completedTasks.isEmpty
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
                        child: const Icon(Icons.history, size: 40, color: AppColors.primaryGreen),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No completed deliveries yet',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Complete pickup missions to build your rescue log',
                        style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: completedTasks.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final task = completedTasks[index];

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
                                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  'COMPLETED',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
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
                          const SizedBox(height: 6),
                          Text(
                            'Rescued from ${task.donorName} and safely delivered to ${task.recipientName}',
                            style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
