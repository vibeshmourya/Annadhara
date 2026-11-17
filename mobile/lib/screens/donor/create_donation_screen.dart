import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/india_constants.dart';
import '../../providers/donation_provider.dart';

class CreateDonationScreen extends StatefulWidget {
  const CreateDonationScreen({super.key});

  @override
  State<CreateDonationScreen> createState() => _CreateDonationScreenState();
}

class _CreateDonationScreenState extends State<CreateDonationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _qtyController = TextEditingController(text: '25');
  final _streetController = TextEditingController(text: '124, 1st Cross, Indiranagar');
  final _areaController = TextEditingController(text: 'Indiranagar');
  final _cityController = TextEditingController(text: 'Bengaluru');
  final _districtController = TextEditingController(text: 'Bengaluru Urban');
  final _pinController = TextEditingController(text: '560038');
  final _fssaiController = TextEditingController();
  final _allergensController = TextEditingController();

  String _category = 'rice_meals';
  String _dietaryType = 'veg';
  String _unit = 'meals';
  String _storage = 'hot_held';
  String _selectedState = 'Karnataka';
  bool _safetyAccepted = false;
  bool _loading = false;

  final List<Map<String, String>> _dietaryOptions = const [
    {'value': 'veg', 'label': 'Vegetarian', 'icon': '🟢'},
    {'value': 'non_veg', 'label': 'Non-Veg', 'icon': '🔴'},
    {'value': 'vegan', 'label': 'Vegan', 'icon': '🌱'},
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _qtyController.dispose();
    _streetController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _districtController.dispose();
    _pinController.dispose();
    _fssaiController.dispose();
    _allergensController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_safetyAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the food safety & hygiene declaration'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final title = _titleController.text.trim();
    final desc = _descController.text.trim();
    final qty = double.tryParse(_qtyController.text.trim()) ?? 0;
    final fssaiNum = _fssaiController.text.trim();

    if (fssaiNum.isNotEmpty && (fssaiNum.length != 14 || !RegExp(r'^\d{14}$').hasMatch(fssaiNum))) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('FSSAI number must be exactly 14 digits if provided'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _loading = true);
    final now = DateTime.now();

    final payload = {
      'title': title,
      'category': _category,
      'dietaryType': _dietaryType,
      'description': desc,
      'totalQuantity': qty,
      'unit': _unit,
      'storageHandling': _storage,
      'allergens': _allergensController.text.isNotEmpty
          ? _allergensController.text.split(',').map((e) => e.trim()).toList()
          : [],
      if (fssaiNum.isNotEmpty) 'fssaiNumber': fssaiNum,
      'fssaiDeclaration': true,
      'safetyGuidelinesAccepted': true,
      'prepDateTime': now.subtract(const Duration(hours: 1)).toIso8601String(),
      'pickupStartTime': now.toIso8601String(),
      'pickupEndTime': now.add(const Duration(hours: 6)).toIso8601String(),
      'expiryDateTime': now.add(const Duration(hours: 12)).toIso8601String(),
      'pickupLocation': {
        'address': {
          'street': _streetController.text.trim(),
          'areaLocality': _areaController.text.trim(),
          'city': _cityController.text.trim(),
          'district': _districtController.text.trim(),
          'state': _selectedState,
          'postalCode': _pinController.text.trim(),
          'country': 'India',
        },
        'location': {
          'type': 'Point',
          'coordinates': [77.6412, 12.9719], // Default Bengaluru coordinates
        },
      },
      'imageUrl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    };

    final donProvider = Provider.of<DonationProvider>(context, listen: false);
    final success = await donProvider.createDonation(payload);
    setState(() => _loading = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Surplus food published successfully! Visible to Indian NGOs.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(donProvider.errorMessage.isNotEmpty ? donProvider.errorMessage : 'Failed to publish food donation'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Donate Surplus Food (India)'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Advisory banner
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
              const SizedBox(height: 16),

              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Food Title *',
                  hintText: 'e.g. 25 Fresh Thali Meals / 40 Veg Puffs',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Please enter food title' : null,
              ),
              const SizedBox(height: 12),

              DropdownButtonFormField<String>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Food Category *'),
                items: IndiaConstants.foodCategories.map((c) {
                  return DropdownMenuItem<String>(
                    value: c['id']!,
                    child: Text('${c['icon']} ${c['label']}'),
                  );
                }).toList(),
                onChanged: (val) => setState(() => _category = val!),
              ),
              const SizedBox(height: 12),

              // Dietary type selection
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Dietary Classification *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.secondaryText)),
                  const SizedBox(height: 6),
                  Row(
                    children: _dietaryOptions.map((d) {
                      final isSelected = _dietaryType == d['value'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(
                            '${d['icon']} ${d['label']}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : AppColors.primaryText,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: AppColors.primaryGreen,
                          backgroundColor: AppColors.lightGreen.withValues(alpha: 0.5),
                          onSelected: (selected) {
                            if (selected) setState(() => _dietaryType = d['value']!);
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _descController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description & Food Details *',
                  hintText: 'Prepared cleanly in commercial kitchen, packed in food-grade containers...',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Please provide food description' : null,
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _qtyController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Quantity *'),
                      validator: (val) {
                        final n = double.tryParse(val ?? '');
                        if (n == null || n <= 0) return 'Invalid qty';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _unit,
                      decoration: const InputDecoration(labelText: 'Unit *'),
                      items: IndiaConstants.measurementUnits.map((u) {
                        return DropdownMenuItem<String>(
                          value: u,
                          child: Text(u),
                        );
                      }).toList(),
                      onChanged: (val) => setState(() => _unit = val!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              DropdownButtonFormField<String>(
                initialValue: _storage,
                decoration: const InputDecoration(labelText: 'Storage & Handling Condition *'),
                items: const [
                  DropdownMenuItem(value: 'hot_held', child: Text('🔥 Hot Held (Above 60°C)')),
                  DropdownMenuItem(value: 'refrigerated', child: Text('❄️ Refrigerated (Below 4°C)')),
                  DropdownMenuItem(value: 'room_temperature', child: Text('🍞 Room Temperature')),
                  DropdownMenuItem(value: 'frozen', child: Text('🧊 Frozen (Below -18°C)')),
                ],
                onChanged: (val) => setState(() => _storage = val!),
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _allergensController,
                decoration: const InputDecoration(
                  labelText: 'Allergens (Optional)',
                  hintText: 'e.g. Dairy, Nuts, Gluten',
                ),
              ),
              const SizedBox(height: 16),

              const Text(
                'Pickup Location (India)',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryText),
              ),
              const SizedBox(height: 8),

              TextFormField(
                controller: _streetController,
                decoration: const InputDecoration(
                  labelText: 'Building / Street Address *',
                  hintText: 'e.g. 124, 1st Cross, Indiranagar',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Address required' : null,
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _areaController,
                      decoration: const InputDecoration(
                        labelText: 'Area / Locality',
                        hintText: 'e.g. Indiranagar',
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _cityController,
                      decoration: const InputDecoration(labelText: 'City / Town *'),
                      validator: (val) => val == null || val.trim().isEmpty ? 'City required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _districtController,
                      decoration: const InputDecoration(
                        labelText: 'District',
                        hintText: 'e.g. Bengaluru Urban',
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _pinController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'PIN Code (6 digits) *',
                        hintText: '560038',
                      ),
                      validator: (val) {
                        if (val == null || !IndiaConstants.isValidPINCode(val.trim())) {
                          return 'Enter valid 6-digit PIN';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              DropdownButtonFormField<String>(
                initialValue: _selectedState,
                decoration: const InputDecoration(labelText: 'State / Union Territory *'),
                items: IndiaConstants.indianStates.map((s) {
                  return DropdownMenuItem<String>(
                    value: s,
                    child: Text(s, overflow: TextOverflow.ellipsis),
                  );
                }).toList(),
                onChanged: (val) => setState(() => _selectedState = val!),
              ),
              const SizedBox(height: 14),

              TextFormField(
                controller: _fssaiController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'FSSAI License / Registration No. (Optional)',
                  hintText: '14-digit FSSAI number if applicable',
                ),
              ),
              const SizedBox(height: 16),

              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _safetyAccepted,
                onChanged: (val) => setState(() => _safetyAccepted = val ?? false),
                title: const Text(
                  'I declare that this surplus food is prepared hygienically under clean conditions and is safe for human consumption as per FSSAI advisory principles.',
                  style: TextStyle(fontSize: 12, color: AppColors.primaryText, height: 1.3),
                ),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              const SizedBox(height: 20),

              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Publish Food Listing'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
