import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../providers/notification_provider.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifProvider = Provider.of<NotificationProvider>(context);
    final dateFormat = DateFormat('MMM d, h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: notifProvider.isLoading && notifProvider.notifications.isEmpty
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : notifProvider.notifications.isEmpty
              ? const Center(
                  child: Text(
                    'No notifications yet',
                    style: TextStyle(color: AppColors.secondaryText),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () async {
                    await notifProvider.fetchNotifications();
                  },
                  color: AppColors.primaryGreen,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: notifProvider.notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final notif = notifProvider.notifications[index];
                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: notif.isRead ? Colors.white : AppColors.lightGreen.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: notif.isRead ? AppColors.border : AppColors.primaryGreen.withOpacity(0.3)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.notifications_none, size: 18, color: AppColors.primaryGreen),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        notif.title,
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                                      ),
                                      Text(
                                        dateFormat.format(notif.createdAt),
                                        style: const TextStyle(fontSize: 10, color: AppColors.secondaryText),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    notif.message,
                                    style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

