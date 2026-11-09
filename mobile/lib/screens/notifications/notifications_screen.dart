import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../providers/notification_provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final notif = Provider.of<NotificationProvider>(context);
    final dateFormat = DateFormat('MMM d, h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notif.unreadCount > 0)
            TextButton(
              onPressed: () => notif.markAllAsRead(),
              child: const Text('Mark all read', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => notif.fetchNotifications(),
          ),
        ],
      ),
      body: notif.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : notif.notifications.isEmpty
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
                        child: const Icon(Icons.notifications_none, size: 40, color: AppColors.primaryGreen),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No notifications yet',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Alerts regarding donations, requests, and pickups will show here',
                        style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primaryGreen,
                  onRefresh: () async => notif.fetchNotifications(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: notif.notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = notif.notifications[index];

                      return InkWell(
                        onTap: () {
                          if (!item.isRead) {
                            notif.markAsRead(item.id);
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: item.isRead ? Colors.white : AppColors.lightGreen.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: item.isRead ? AppColors.border : AppColors.primaryGreen.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: item.isRead ? AppColors.background : AppColors.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.notifications_active_outlined,
                                  size: 18,
                                  color: item.isRead ? AppColors.secondaryText : Colors.white,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            item.title,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: item.isRead ? FontWeight.bold : FontWeight.w900,
                                              color: AppColors.primaryText,
                                            ),
                                          ),
                                        ),
                                        Text(
                                          dateFormat.format(item.createdAt),
                                          style: const TextStyle(fontSize: 10, color: AppColors.secondaryText),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item.message,
                                      style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
