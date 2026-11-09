import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../providers/donation_provider.dart';

class AdminDonationsScreen extends StatefulWidget {
  const AdminDonationsScreen({super.key});

  @override
  State<AdminDonationsScreen> createState() => _AdminDonationsScreenState();
}

class _AdminDonationsScreenState extends State<AdminDonationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DonationProvider>(context, listen: false).fetchDonations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final donProvider = Provider.of<DonationProvider>(context);
    final dateFormat = DateFormat('MMM d, h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Network Donations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => donProvider.fetchDonations(),
          ),
        ],
      ),
      body: donProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : donProvider.donations.isEmpty
              ? const Center(child: Text('No donations in network', style: TextStyle(color: AppColors.secondaryText)))
              : RefreshIndicator(
                  color: AppColors.primaryGreen,
                  onRefresh: () async => donProvider.fetchDonations(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: donProvider.donations.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = donProvider.donations[index];

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
                                  child: Text(
                                    item.status.replaceAll('_', ' ').toUpperCase(),
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.darkGreen),
                                  ),
                                ),
                                Text(
                                  '${item.availableQuantity} / ${item.totalQuantity} ${item.unit}',
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
                              'Donor: ${item.donorName} (${item.street}, ${item.city})',
                              style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Expires: ${dateFormat.format(item.pickupEndTime)}',
                              style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
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

