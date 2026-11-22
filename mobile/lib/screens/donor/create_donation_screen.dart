import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/india_constants.dart';
import '../../core/network/api_service.dart';
import '../../providers/donation_provider.dart';

class CreateDonationScreen extends StatefulWidget {
  const CreateDonationScreen({super.key});

  @override
  State<CreateDonationScreen> createState() => _CreateDonationScreenState();
}

class _CreateDonationScreenState extends State<CreateDonationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController(text: '30 Plates Veg Biryani & Dal');
  final _descController = TextEditingController(text: 'Prepared fresh in commercial kitchen, packed in sealed trays');
  final _qtyController = TextEditingController(text: '30');
  final _streetController = TextEditingController(text: '124, 1st Cross, Indiranagar');
  final _areaController = TextEditingController(text: 'Indiranagar');
  final _cityController = TextEditingController(text: 'Bengaluru');
  final _districtController = TextEditingController(text: 'Bengaluru Urban');
  final _pinController = TextEditingController(text: '560038');
  final _fssaiController = TextEditingController();
  final _allergensController = TextEditingController(text: 'Dairy');
  final _imageUrlController = TextEditingController();

  String _category = 'rice_meals';
  String _dietaryType = 'veg';
  String _unit = 'plates';
  String _storage = 'hot_held';
  String _selectedState = 'Karnataka';
  bool _safetyAccepted = true;
  bool _loading = false;

  // Pickup availability window
  late DateTime _pickupStart;
  late DateTime _pickupEnd;

  // Image upload and selection state
  File? _selectedImageFile;
  String _imageUrl =
      'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80';
  bool _uploadingImage = false;
  final ImagePicker _picker = ImagePicker();

  final List<Map<String, String>> _dietaryOptions = const [
    {'value': 'veg', 'label': 'Vegetarian', 'icon': '🟢'},
    {'value': 'non_veg', 'label': 'Non-Veg', 'icon': '🔴'},
    {'value': 'vegan', 'label': 'Vegan', 'icon': '🌱'},
  ];

  static const List<Map<String, String>> _foodPresets = [
    {
      'label': 'Rice & Meals',
      'url': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
      'icon': '🍚',
    },
    {
      'label': 'Roti & Chapati',
      'url': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80',
      'icon': '🫓',
    },
    {
      'label': 'Dum Biryani',
      'url': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      'icon': '🍲',
    },
    {
      'label': 'Idli & Sambar',
      'url': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      'icon': '🥞',
    },
    {
      'label': 'Crispy Dosa',
      'url': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
      'icon': '🥞',
    },
    {
      'label': 'Paneer Dishes',
      'url': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
      'icon': '🍛',
    },
    {
      'label': 'Bakery Breads',
      'url': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      'icon': '🍞',
    },
    {
      'label': 'Fresh Fruits',
      'url': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
      'icon': '🍎',
    },
  ];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _pickupStart = now;
    _pickupEnd = now.add(const Duration(hours: 6));
  }

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
    _imageUrlController.dispose();
    super.dispose();
  }

  // Dietary mismatch detection
  String? _checkDietaryMismatch() {
    if (_dietaryType == 'veg' || _dietaryType == 'vegan') {
      final text = '${_titleController.text} ${_descController.text}'.toLowerCase();
      final nonVegPattern = RegExp(
        r'\b(egg|eggs|chicken|mutton|fish|meat|beef|pork|prawn|prawns|seafood|bacon|ham|crab|crabs|duck|keema|gosht|murgh)\b',
        caseSensitive: false,
      );
      final match = nonVegPattern.firstMatch(text);
      if (match != null) {
        return match.group(0);
      }
    }
    return null;
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (picked != null) {
        final file = File(picked.path);
        setState(() {
          _selectedImageFile = file;
          _uploadingImage = true;
        });

        // Upload to backend
        final res = await ApiService.uploadImage(file);
        if (mounted) {
          if (res.success && res.data != null && res.data['url'] != null) {
            setState(() {
              _imageUrl = res.data['url'];
              _uploadingImage = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Food image uploaded successfully!'),
                backgroundColor: AppColors.primaryGreen,
                duration: Duration(seconds: 2),
              ),
            );
          } else {
            setState(() => _uploadingImage = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(res.message.isNotEmpty ? res.message : 'Upload failed. Using local preview.'),
                backgroundColor: AppColors.warning,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _uploadingImage = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error selecting image: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showImageOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Select Food Image',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                ),
                const SizedBox(height: 12),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.lightGreen,
                    child: Icon(Icons.camera_alt, color: AppColors.primaryGreen),
                  ),
                  title: const Text('Take Photo from Camera'),
                  subtitle: const Text('Capture live food preparation'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.lightGreen,
                    child: Icon(Icons.photo_library, color: AppColors.primaryGreen),
                  ),
                  title: const Text('Choose from Gallery'),
                  subtitle: const Text('Pick existing photo from device'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.gallery);
                  },
                ),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.lightGreen,
                    child: Icon(Icons.auto_awesome, color: AppColors.primaryGreen),
                  ),
                  title: const Text('Choose from Food Presets'),
                  subtitle: const Text('Select a high-quality food photo'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showPresetsDialog();
                  },
                ),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.lightGreen,
                    child: Icon(Icons.link, color: AppColors.primaryGreen),
                  ),
                  title: const Text('Enter Image URL'),
                  subtitle: const Text('Paste direct web link to image'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showUrlDialog();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showPresetsDialog() {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Choose Food Preset'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: _foodPresets.map((p) {
                return ListTile(
                  leading: Text(p['icon']!, style: const TextStyle(fontSize: 24)),
                  title: Text(p['label']!),
                  onTap: () {
                    setState(() {
                      _selectedImageFile = null;
                      _imageUrl = p['url']!;
                    });
                    Navigator.pop(ctx);
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }

  void _showUrlDialog() {
    _imageUrlController.text = _imageUrl.startsWith('http') ? _imageUrl : '';
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Enter Image URL'),
          content: TextField(
            controller: _imageUrlController,
            decoration: const InputDecoration(
              hintText: 'https://...',
              labelText: 'Image Link',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final val = _imageUrlController.text.trim();
                if (val.isNotEmpty) {
                  setState(() {
                    _selectedImageFile = null;
                    _imageUrl = val;
                  });
                }
                Navigator.pop(ctx);
              },
              child: const Text('Apply'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _selectPickupTime(bool isStart) async {
    final initialDate = isStart ? _pickupStart : _pickupEnd;
    final pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initialDate),
    );

    if (pickedTime != null) {
      final now = DateTime.now();
      final newDt = DateTime(
        now.year,
        now.month,
        now.day,
        pickedTime.hour,
        pickedTime.minute,
      );

      setState(() {
        if (isStart) {
          _pickupStart = newDt;
          if (_pickupEnd.isBefore(_pickupStart)) {
            _pickupEnd = _pickupStart.add(const Duration(hours: 4));
          }
        } else {
          _pickupEnd = newDt;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_safetyAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the food quality and handling declaration'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_pickupEnd.isBefore(_pickupStart) || _pickupEnd.isAtSameMomentAs(_pickupStart)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pickup deadline must be after pickup start time'),
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

    // Completely simplified payload: NO prepDateTime and NO expiryDateTime!
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
      'pickupStartTime': _pickupStart.toIso8601String(),
      'pickupEndTime': _pickupEnd.toIso8601String(),
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
      'imageUrl': _imageUrl,
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
            content: Text(donProvider.errorMessage.isNotEmpty
                ? donProvider.errorMessage
                : 'Failed to publish food donation'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final mismatchWord = _checkDietaryMismatch();

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

              // Food Title
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Food Title *',
                  hintText: 'e.g. 25 Plates Fresh Thali Meals / 40 Veg Puffs',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Please enter food title' : null,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),

              // Category Selector
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
                  const Text(
                    'Dietary Classification *',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.secondaryText),
                  ),
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

              // Dietary Mismatch Warning Banner
              if (mismatchWord != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Dietary Notice: You selected $_dietaryType, but your text contains "$mismatchWord". Please ensure this food is strictly vegetarian.',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 12),

              // Description
              TextFormField(
                controller: _descController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description & Ingredients *',
                  hintText: 'Prepared cleanly in commercial kitchen, packed in food-grade trays...',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Please provide food description' : null,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),

              // Quantity & Unit
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

              // Storage Condition
              DropdownButtonFormField<String>(
                initialValue: _storage,
                decoration: const InputDecoration(labelText: 'Storage & Handling Condition *'),
                items: const [
                  DropdownMenuItem(value: 'hot_held', child: Text('🔥 Hot Held (Above 60°C)')),
                  DropdownMenuItem(value: 'refrigerated', child: Text('❄️ Refrigerated (Below 4°C)')),
                  DropdownMenuItem(value: 'room_temperature', child: Text('🍞 Room Temperature')),
                  DropdownMenuItem(value: 'frozen', child: Text('🧊 Frozen (Below -18°C)')),
                  DropdownMenuItem(value: 'other', child: Text('🍽️ Other')),
                ],
                onChanged: (val) => setState(() => _storage = val!),
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _allergensController,
                decoration: const InputDecoration(
                  labelText: 'Allergens (Optional)',
                  hintText: 'e.g. Dairy, Nuts, Gluten (or None)',
                ),
              ),
              const SizedBox(height: 16),

              // Food Photo Selection
              const Text(
                'Food Photo',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryText),
              ),
              const SizedBox(height: 8),

              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    // Thumbnail Preview
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: 90,
                        height: 70,
                        color: Colors.grey.shade200,
                        child: _uploadingImage
                            ? const Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen),
                                ),
                              )
                            : _selectedImageFile != null
                                ? Image.file(
                                    _selectedImageFile!,
                                    fit: BoxFit.cover,
                                  )
                                : Image.network(
                                    ApiConstants.resolveImageUrl(_imageUrl, _category, _foodNameController.text),
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => const Icon(Icons.fastfood, color: Colors.grey),
                                  ),
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Actions
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ElevatedButton.icon(
                            onPressed: _uploadingImage ? null : _showImageOptions,
                            icon: const Icon(Icons.add_a_photo_outlined, size: 16),
                            label: const Text('Add / Change Photo'),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Camera, Gallery, or Preset',
                            style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Pickup Availability Window
              const Text(
                'Pickup Availability Window',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryText),
              ),
              const SizedBox(height: 8),

              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _selectPickupTime(true),
                      icon: const Icon(Icons.access_time, size: 16, color: AppColors.primaryGreen),
                      label: Text(
                        'From: ${TimeOfDay.fromDateTime(_pickupStart).format(context)}',
                        style: const TextStyle(fontSize: 12, color: AppColors.primaryText),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _selectPickupTime(false),
                      icon: const Icon(Icons.timer_off_outlined, size: 16, color: AppColors.warning),
                      label: Text(
                        'Until: ${TimeOfDay.fromDateTime(_pickupEnd).format(context)}',
                        style: const TextStyle(fontSize: 12, color: AppColors.primaryText),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Pickup Location
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

              // Updated declaration checkbox
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _safetyAccepted,
                onChanged: (val) => setState(() => _safetyAccepted = val ?? false),
                title: const Text(
                  'I confirm that the food information provided is accurate and that the food has been handled responsibly in accordance with food safety standards.',
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
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
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
