import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';
import '../../models/organization_model.dart';
import '../../providers/admin_provider.dart';

class AdminOrganizationsScreen extends StatefulWidget {
  const AdminOrganizationsScreen({super.key});

  @override
  State<AdminOrganizationsScreen> createState() => _AdminOrganizationsScreenState();
}

class _AdminOrganizationsScreenState extends State<AdminOrganizationsScreen> {
  final _rejectReasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AdminProvider>(context, listen: false).fetchOrganizations();
    });
  }

  @override
  void dispose() {
    _rejectReasonController.dispose();
    super.dispose();
  }

  void _showVerifyDialog(OrganizationModel org, bool approve) {
    _rejectReasonController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          approve ? 'Approve Organization' : 'Reject Organization',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              approve
                  ? 'Verify "${org.name}" as an active ${org.type}? They will be permitted to reserve food donations.'
                  : 'Specify reason for rejecting "${org.name}":',
              style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
            ),
            if (!approve) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _rejectReasonController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Reviewer Reason *',
                  hintText: 'e.g. Incomplete registration documents...',
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: approve ? AppColors.primaryGreen : AppColors.error,
            ),
            onPressed: () async {
              final reason = _rejectReasonController.text.trim();
              if (!approve && reason.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a rejection reason')),
                );
                return;
              }

              final messenger = ScaffoldMessenger.of(context);
              final admin = Provider.of<AdminProvider>(context, listen: false);
              Navigator.pop(ctx);

              final success = await admin.verifyOrganization(
                org.id,
                approve ? 'VERIFIED' : 'REJECTED',
                reason: reason,
              );

              if (success) {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text('Organization ${approve ? 'verified' : 'rejected'} successfully'),
                    backgroundColor: approve ? AppColors.primaryGreen : AppColors.secondaryText,
                  ),
                );
              }
            },
            child: Text(approve ? 'Verify Organization' : 'Reject Organization'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = Provider.of<AdminProvider>(context);
    final dateFormat = DateFormat('MMM d, yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Organization Verifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => admin.fetchOrganizations(),
          ),
        ],
      ),
      body: admin.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : admin.organizations.isEmpty
              ? const Center(child: Text('No organizations registered', style: TextStyle(color: AppColors.secondaryText)))
              : RefreshIndicator(
                  color: AppColors.primaryGreen,
                  onRefresh: () async => admin.fetchOrganizations(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: admin.organizations.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final org = admin.organizations[index];
                      final isPending = org.verificationStatus == 'PENDING';
                      final isVerified = org.verificationStatus == 'VERIFIED';

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
                                    color: isVerified
                                        ? AppColors.primaryGreen.withValues(alpha: 0.1)
                                        : isPending
                                            ? AppColors.warning.withValues(alpha: 0.15)
                                            : AppColors.error.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    org.verificationStatus,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: isVerified
                                          ? AppColors.primaryGreen
                                          : isPending
                                              ? AppColors.warning
                                              : AppColors.error,
                                    ),
                                  ),
                                ),
                                Text(
                                  dateFormat.format(org.createdAt),
                                  style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              org.name,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Type: ${org.type} • Reg: ${org.registrationNumber.isNotEmpty ? org.registrationNumber : 'N/A'}',
                              style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Contact: ${org.email} ${org.phone.isNotEmpty ? '• ${org.phone}' : ''}',
                              style: const TextStyle(fontSize: 12, color: AppColors.primaryText),
                            ),

                            if (isPending) ...[
                              const Divider(height: 20),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton(
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: AppColors.error,
                                        side: const BorderSide(color: AppColors.error),
                                      ),
                                      onPressed: () => _showVerifyDialog(org, false),
                                      child: const Text('Reject'),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () => _showVerifyDialog(org, true),
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
