import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/colors.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import 'home/home_dashboard_screen.dart';
import 'donor/my_donations_screen.dart';
import 'donor/requests_screen.dart';
import 'explore/find_food_screen.dart';
import 'recipient/my_reservations_screen.dart';
import 'volunteer/pickups_screen.dart';
import 'volunteer/volunteer_history_screen.dart';
import 'admin/admin_organizations_screen.dart';
import 'admin/admin_donations_screen.dart';
import 'admin/admin_reports_screen.dart';
import 'notifications/notifications_screen.dart';
import 'profile/profile_screen.dart';

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final notifProvider = Provider.of<NotificationProvider>(context);
    final user = auth.user;

    List<Widget> screens = [];
    List<BottomNavigationBarItem> items = [];

    final notifItem = BottomNavigationBarItem(
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          const Icon(Icons.notifications_none_rounded),
          if (notifProvider.unreadCount > 0)
            Positioned(
              top: -2,
              right: -4,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '${notifProvider.unreadCount}',
                  style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
      activeIcon: const Icon(Icons.notifications),
      label: 'Notifications',
    );

    const profileItem = BottomNavigationBarItem(
      icon: Icon(Icons.person_outline),
      activeIcon: Icon(Icons.person),
      label: 'Profile',
    );

    if (user?.isDonor == true) {
      screens = const [
        HomeDashboardScreen(),
        MyDonationsScreen(),
        DonorRequestsScreen(),
        NotificationsScreen(),
        ProfileScreen(),
      ];
      items = [
        const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
        const BottomNavigationBarItem(icon: Icon(Icons.inventory_2_outlined), activeIcon: Icon(Icons.inventory_2), label: 'My Donations'),
        const BottomNavigationBarItem(icon: Icon(Icons.mail_outline), activeIcon: Icon(Icons.mail), label: 'Requests'),
        notifItem,
        profileItem,
      ];
    } else if (user?.isVolunteer == true) {
      screens = const [
        HomeDashboardScreen(),
        VolunteerPickupsScreen(),
        VolunteerHistoryScreen(),
        NotificationsScreen(),
        ProfileScreen(),
      ];
      items = [
        const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
        const BottomNavigationBarItem(icon: Icon(Icons.delivery_dining_outlined), activeIcon: Icon(Icons.delivery_dining), label: 'Pickups'),
        const BottomNavigationBarItem(icon: Icon(Icons.history), activeIcon: Icon(Icons.history_toggle_off), label: 'History'),
        notifItem,
        profileItem,
      ];
    } else if (user?.isAdmin == true) {
      screens = const [
        HomeDashboardScreen(),
        AdminOrganizationsScreen(),
        AdminDonationsScreen(),
        AdminReportsScreen(),
        ProfileScreen(),
      ];
      items = [
        const BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Dashboard'),
        const BottomNavigationBarItem(icon: Icon(Icons.business_outlined), activeIcon: Icon(Icons.business), label: 'Organizations'),
        const BottomNavigationBarItem(icon: Icon(Icons.inventory_2_outlined), activeIcon: Icon(Icons.inventory_2), label: 'Donations'),
        const BottomNavigationBarItem(icon: Icon(Icons.assessment_outlined), activeIcon: Icon(Icons.assessment), label: 'Reports'),
        profileItem,
      ];
    } else {
      // Recipient (default)
      screens = const [
        HomeDashboardScreen(),
        FindFoodScreen(),
        MyReservationsScreen(),
        NotificationsScreen(),
        ProfileScreen(),
      ];
      items = [
        const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
        const BottomNavigationBarItem(icon: Icon(Icons.search), activeIcon: Icon(Icons.manage_search), label: 'Find Food'),
        const BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_outlined), activeIcon: Icon(Icons.shopping_bag), label: 'My Activity'),
        notifItem,
        profileItem,
      ];
    }

    final safeIndex = _currentIndex < screens.length ? _currentIndex : 0;

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: safeIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: items,
      ),
    );
  }
}
