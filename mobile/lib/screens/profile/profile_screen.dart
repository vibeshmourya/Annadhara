import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _orgNameController = TextEditingController();
  final _orgRegController = TextEditingController();
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();

  String _orgType = 'NGO';

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _orgNameController.dispose();
    _orgRegController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  void _showEditProfileModal(String currentName, String currentPhone) {
    _nameController.text = currentName;
    _phoneController.text = currentPhone;

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
            const Text('Edit Profile Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
            const SizedBox(height: 14),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Phone Number'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                final auth = Provider.of<AuthProvider>(context, listen: false);
                Navigator.pop(ctx);

                final success = await auth.updateProfile(
                  name: _nameController.text.trim(),
                  phone: _phoneController.text.trim(),
                );

                if (success) {
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Profile updated successfully!'), backgroundColor: AppColors.primaryGreen),
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

  void _showRegisterOrgModal(String role) {
    _orgType = role == 'DONOR' ? 'Restaurant' : 'NGO';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
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
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Register Organization', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
                const SizedBox(height: 12),
                TextField(
                  controller: _orgNameController,
                  decoration: const InputDecoration(labelText: 'Organization Name *'),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: _orgType,
                  decoration: const InputDecoration(labelText: 'Organization Type *'),
                  items: role == 'DONOR'
                      ? const [
                          DropdownMenuItem(value: 'Restaurant', child: Text('Restaurant')),
                          DropdownMenuItem(value: 'Hotel', child: Text('Hotel')),
                          DropdownMenuItem(value: 'College Canteen', child: Text('College Canteen')),
                          DropdownMenuItem(value: 'Event Organizer', child: Text('Event Organizer')),
                        ]
                      : const [
                          DropdownMenuItem(value: 'NGO', child: Text('NGO')),
                          DropdownMenuItem(value: 'Food Distribution Organization', child: Text('Food Distribution Organization')),
                        ],
                  onChanged: (val) => setModalState(() => _orgType = val!),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _orgRegController,
                  decoration: const InputDecoration(labelText: 'Registration / Tax Number'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _streetController,
                  decoration: const InputDecoration(labelText: 'Street Address'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _cityController,
                  decoration: const InputDecoration(labelText: 'City'),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    final orgName = _orgNameController.text.trim();
                    if (orgName.isEmpty) return;

                    final messenger = ScaffoldMessenger.of(context);
                    final auth = Provider.of<AuthProvider>(context, listen: false);
                    Navigator.pop(ctx);

                    final success = await auth.createOrganization(
                      name: orgName,
                      type: _orgType,
                      registrationNumber: _orgRegController.text.trim(),
                      street: _streetController.text.trim(),
                      city: _cityController.text.trim(),
                    );

                    if (success) {
                      messenger.showSnackBar(
                        const SnackBar(content: Text('Organization registered! Submitted for review.'), backgroundColor: AppColors.primaryGreen),
                      );
                    }
                  },
                  child: const Text('Submit Organization Profile'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar Card
            Container(
              padding: const EdgeInsets.all(20),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AppColors.lightGreen,
                    child: Text(
                      user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'U',
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.darkGreen),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? 'User',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? '',
                    style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                  ),
                  if (user?.phone.isNotEmpty == true) ...[
                    const SizedBox(height: 2),
                    Text(
                      user!.phone,
                      style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.lightGreen,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      (user?.role ?? 'DONOR').toUpperCase(),
                      style: const TextStyle(color: AppColors.darkGreen, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    onPressed: () => _showEditProfileModal(user?.name ?? '', user?.phone ?? ''),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Edit Profile'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Organization Card
            if (user?.organizationName != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                width: double.infinity,
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
                        const Text('ORGANIZATION PROFILE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.secondaryText)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: user!.verificationStatus == 'VERIFIED'
                                ? AppColors.primaryGreen.withValues(alpha: 0.1)
                                : user.verificationStatus == 'PENDING'
                                    ? AppColors.warning.withValues(alpha: 0.15)
                                    : AppColors.error.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            user.verificationStatus ?? 'PENDING',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: user.verificationStatus == 'VERIFIED'
                                  ? AppColors.primaryGreen
                                  : user.verificationStatus == 'PENDING'
                                      ? AppColors.warning
                                      : AppColors.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(user.organizationName!, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
                    const SizedBox(height: 4),
                    Text('Type: ${user.organizationType ?? 'N/A'}', style: const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                    if (user.reviewerNotes != null && user.reviewerNotes!.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text('Reviewer Notes: ${user.reviewerNotes}', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.warning)),
                    ],
                  ],
                ),
              ),
            ] else if (user?.isDonor == true || user?.isRecipient == true) ...[
              Container(
                padding: const EdgeInsets.all(16),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    const Text('No Organization Attached', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
                    const SizedBox(height: 4),
                    const Text('Attach an organization profile to publish or request food', style: TextStyle(fontSize: 11, color: AppColors.secondaryText)),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: () => _showRegisterOrgModal(user!.role),
                      child: const Text('Add Organization'),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                ),
                onPressed: () async {
                  await auth.logout();
                  if (context.mounted) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  }
                },
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Sign Out'),
              ),
            ),
            const SizedBox(height: 20),

            // About / App Information Footer
            Container(
              padding: const EdgeInsets.all(14),
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.lightGreen.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.2)),
              ),
              child: const Column(
                children: [
                  Text(
                    'Annadhara v1.0.0',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.darkGreen),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Surplus Food. Shared Hope. Zero Waste.',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryGreen),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Developed by Team Seva Shakti • MERNOVA X 2026',
                    style: TextStyle(fontSize: 10, color: AppColors.secondaryText),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
