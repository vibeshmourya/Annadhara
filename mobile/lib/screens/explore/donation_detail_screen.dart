import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/india_constants.dart';
import '../../models/donation_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/activity_provider.dart';

class DonationDetailScreen extends StatefulWidget {
  final DonationModel donation;

  const DonationDetailScreen({super.key, required this.donation});

  @override
  State<DonationDetailScreen> createState() => _DonationDetailScreenState();
}

class _DonationDetailScreenState extends State<DonationDetailScreen> {
  final _qtyController = TextEditingController(text: '10');
  final _notesController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _qtyController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _showReserveDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Reserve: ${widget.donation.title}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
              ),
              const SizedBox(height: 6),
              Text(
                'Available: ${widget.donation.availableQuantity} ${widget.donation.unit}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _qtyController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Requested Quantity (${widget.donation.unit})',
                ),
              ),
              const SizedBox(height: 12),

              TextField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Request Notes (Optional)',
                  hintText: 'e.g. For our evening shelter distribution in Indiranagar...',
                ),
              ),
              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: _submitting ? null : _submitReservation,
                child: _submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Confirm Reservation Request'),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _submitReservation() async {
    final qty = double.tryParse(_qtyController.text.trim()) ?? 0;
    if (qty <= 0 || qty > widget.donation.availableQuantity) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please request between 1 and ${widget.donation.availableQuantity} ${widget.donation.unit}'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    final activity = Provider.of<ActivityProvider>(context, listen: false);
    final success = await activity.createReservation(widget.donation.id, qty, _notesController.text.trim());
    setState(() => _submitting = false);

    if (mounted) {
      Navigator.pop(context); // Close bottom sheet
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Reservation submitted! Check My Activity tab for updates.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        Navigator.pop(context); // Return to list
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(activity.errorMessage.isNotEmpty ? activity.errorMessage : 'Failed to reserve food'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Widget _buildDietaryBadge(String dietaryType) {
    String label = 'Vegetarian';
    Color color = const Color(0xFF2E7D5B);
    Color bg = const Color(0xFFEAF4EE);
    String icon = '🟢';

    if (dietaryType == 'non_veg' || dietaryType == 'non-veg') {
      label = 'Non-Vegetarian';
      color = const Color(0xFFD9534F);
      bg = const Color(0xFFFDE8E8);
      icon = '🔴';
    } else if (dietaryType == 'vegan') {
      label = 'Vegan';
      color = const Color(0xFF205B43);
      bg = const Color(0xFFEAF4EE);
      icon = '🌱';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        '$icon $label',
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }

  String _formatFullAddress(DonationModel d) {
    final parts = [
      if (d.street.isNotEmpty) d.street,
      if (d.areaLocality.isNotEmpty) d.areaLocality,
      if (d.city.isNotEmpty) d.city,
      if (d.district.isNotEmpty && d.district != d.city) d.district,
      if (d.state.isNotEmpty) d.state,
      if (d.postalCode.isNotEmpty) 'PIN: ${d.postalCode}',
      'India',
    ];
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final don = widget.donation;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Food Details'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero Image
            SizedBox(
              height: 200,
              width: double.infinity,
              child: Image.network(
                ApiConstants.resolveImageUrl(don.imageUrl, don.category, don.title),
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 200,
                  color: AppColors.lightGreen,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.restaurant_rounded, size: 48, color: AppColors.primaryGreen.withValues(alpha: 0.6)),
                        const SizedBox(height: 6),
                        Text(
                          'Annadhara Food Rescue',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryGreen.withValues(alpha: 0.8),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Surplus Food • Shared Hope',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.secondaryText.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          _buildDietaryBadge(don.dietaryType),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.lightGreen,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              don.category.replaceAll('_', ' ').toUpperCase(),
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.darkGreen),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '${don.availableQuantity} ${don.unit} available',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.primaryGreen),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Text(
                    don.title,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primaryText),
                  ),
                  const SizedBox(height: 8),

                  Text(
                    don.description,
                    style: const TextStyle(fontSize: 13, color: AppColors.secondaryText, height: 1.4),
                  ),
                  const SizedBox(height: 20),

                  // Detail rows
                  _infoCard([
                    _infoRow(Icons.business_outlined, 'Donor', don.organizationName ?? don.donorName),
                    _infoRow(Icons.location_on_outlined, 'Pickup Location', _formatFullAddress(don)),
                    _infoRow(Icons.schedule, 'Pickup Window', '${IndiaConstants.formatIndianDate(don.pickupStartTime)} – ${IndiaConstants.formatIndianDate(don.pickupEndTime)}'),
                    _infoRow(Icons.thermostat_outlined, 'Storage Condition', don.storageHandling.replaceAll('_', ' ').toUpperCase()),
                    if (don.allergens.isNotEmpty)
                      _infoRow(Icons.warning_amber_rounded, 'Allergens', don.allergens.join(', ')),
                    if (don.fssaiNumber != null && don.fssaiNumber!.isNotEmpty)
                      _infoRow(Icons.verified_outlined, 'FSSAI License', don.fssaiNumber!),
                  ]),
                  const SizedBox(height: 16),

                  // Food safety disclaimer card
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.lightGreen,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.shield_outlined, color: AppColors.primaryGreen, size: 18),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            IndiaConstants.foodSafetyDisclaimer,
                            style: TextStyle(fontSize: 11, color: AppColors.darkGreen, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Request Food action
                  if (auth.user?.isRecipient == true && don.availableQuantity > 0 && don.status == 'available')
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: _showReserveDialog,
                        icon: const Icon(Icons.volunteer_activism_rounded),
                        label: const Text('Request Surplus Food Reservation'),
                      ),
                    )
                  else if (auth.user?.isRecipient == true && don.availableQuantity <= 0)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Center(
                        child: Text('This food donation has been fully claimed', style: TextStyle(color: AppColors.secondaryText, fontWeight: FontWeight.bold)),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoCard(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(children: children),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.primaryGreen),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
          ),
        ],
      ),
    );
  }
}
