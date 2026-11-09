import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_service.dart';
import '../../providers/auth_provider.dart';
import '../donor/create_donation_screen.dart';

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({super.key});

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    setState(() => _loading = true);
    final res = await ApiService.get(ApiConstants.dashboardStats);
    if (res.success && res.data is Map<String, dynamic>) {
      setState(() {
        _stats = res.data;
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.volunteer_activism_rounded, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            const Text('FoodBridge', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchStats,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : RefreshIndicator(
              onRefresh: _fetchStats,
              color: AppColors.primaryGreen,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Greeting Card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primaryGreen, AppColors.darkGreen],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryGreen.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
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
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  '${user?.role.toUpperCase()} PORTAL',
                                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                                ),
                              ),
                              const Icon(Icons.eco_rounded, color: Colors.white, size: 20),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Welcome back, ${user?.name ?? 'User'}!',
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user?.organizationName != null
                                ? '${user!.organizationName} • Zero Waste Active'
                                : 'Surplus Food Rescue & Shared Hope',
                            style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Quick Actions
                    if (user?.isDonor == true) ...[
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const CreateDonationScreen()),
                            );
                          },
                          icon: const Icon(Icons.add_circle_outline, color: Colors.white),
                          label: const Text('Publish Surplus Food Donation'),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    const Text(
                      'Platform Activity & Metrics',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                    ),
                    const SizedBox(height: 12),

                    // Grid metrics depending on role
                    if (_stats != null) ...[
                      if (user?.isDonor == true) ...[
                        Row(
                          children: [
                            _statBox('Published', '${_stats!['totalDonations'] ?? 0}', Icons.inventory_2_outlined),
                            const SizedBox(width: 12),
                            _statBox('Active', '${_stats!['activeDonations'] ?? 0}', Icons.schedule, highlight: true),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _statBox('Pending Requests', '${_stats!['pendingRequests'] ?? 0}', Icons.notifications_active_outlined),
                            const SizedBox(width: 12),
                            _statBox('Food Rescued', '${_stats!['totalCollected'] ?? 0} units', Icons.volunteer_activism),
                          ],
                        ),
                      ] else if (user?.isRecipient == true) ...[
                        Row(
                          children: [
                            _statBox('Community Surplus', '${_stats!['availableFoodCount'] ?? 0}', Icons.restaurant),
                            const SizedBox(width: 12),
                            _statBox('My Reservations', '${_stats!['activeReservations'] ?? 0}', Icons.check_circle_outline, highlight: true),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _statBox('Upcoming Pickups', '${_stats!['upcomingPickups'] ?? 0}', Icons.delivery_dining),
                            const SizedBox(width: 12),
                            _statBox('Meals Received', '${_stats!['totalMealsReceived'] ?? 0}', Icons.favorite_border),
                          ],
                        ),
                      ] else if (user?.isVolunteer == true) ...[
                        Row(
                          children: [
                            _statBox('Active Pickups', '${_stats!['assignedPickups'] ?? 0}', Icons.delivery_dining, highlight: true),
                            const SizedBox(width: 12),
                            _statBox('Available Tasks', '${_stats!['pendingTasks'] ?? 0}', Icons.list_alt),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _statBox('Completed Deliveries', '${_stats!['completedPickups'] ?? 0}', Icons.task_alt),
                      ] else ...[
                        // Admin
                        Row(
                          children: [
                            _statBox('Total Users', '${_stats!['totalUsers'] ?? 0}', Icons.people),
                            const SizedBox(width: 12),
                            _statBox('Organizations', '${_stats!['registeredOrganizations'] ?? 0}', Icons.business),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _statBox('Pending Reviews', '${_stats!['pendingVerifications'] ?? 0}', Icons.verified_user, highlight: true),
                            const SizedBox(width: 12),
                            _statBox('Handovers Done', '${_stats!['completedHandovers'] ?? 0}', Icons.done_all),
                          ],
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _statBox(String label, String value, IconData icon, {bool highlight = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: highlight ? AppColors.primaryGreen.withOpacity(0.4) : AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.secondaryText)),
                Icon(icon, size: 18, color: highlight ? AppColors.primaryGreen : AppColors.secondaryText),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: highlight ? AppColors.darkGreen : AppColors.primaryText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

