import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/donation_provider.dart';

class CreateDonationScreen extends StatefulWidget {
  const CreateDonationScreen({super.key});

  @override
  State<CreateDonationScreen> createState() => _CreateDonationScreenState();
}

class _CreateDonationScreenState extends State<CreateDonationScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _qtyController = TextEditingController(text: '20');
  final _streetController = TextEditingController(text: '425 Garden Way');
  final _cityController = TextEditingController(text: 'Metropolis');
  final _allergensController = TextEditingController();

  String _category = 'cooked_meals';
  String _unit = 'meals';
  String _storage = 'hot_held';
  bool _safetyAccepted = false;
  bool _loading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _qtyController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _allergensController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    final desc = _descController.text.trim();
    final qty = double.tryParse(_qtyController.text.trim()) ?? 0;

    if (title.isEmpty || desc.isEmpty || qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required donation fields')),
      );
      return;
    }

    if (!_safetyAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You must accept the food safety declaration')),
      );
      return;
    }

    setState(() => _loading = true);
    final now = DateTime.now();

    final payload = {
      'title': title,
      'category': _category,
      'description': desc,
      'totalQuantity': qty,
      'unit': _unit,
      'storageHandling': _storage,
      'allergens': _allergensController.text.isNotEmpty
          ? _allergensController.text.split(',').map((e) => e.trim()).toList()
          : [],
      'prepDateTime': now.subtract(const Duration(hours: 1)).toIso8601String(),
      'pickupStartTime': now.toIso8601String(),
      'pickupEndTime': now.add(const Duration(hours: 6)).toIso8601String(),
      'expiryDateTime': now.add(const Duration(hours: 12)).toIso8601String(),
      'pickupLocation': {
        'address': {
          'street': _streetController.text.trim(),
          'city': _cityController.text.trim(),
        },
        'location': {
          'type': 'Point',
          'coordinates': [-73.9912, 40.7258],
        },
      },
      'safetyGuidelinesAccepted': true,
      'imageUrl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    };

    final donProvider = Provider.of<DonationProvider>(context, listen: false);
    final success = await donProvider.createDonation(payload);
    setState(() => _loading = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Food donation published successfully! Visible to charities.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(donProvider.errorMessage.isNotEmpty ? donProvider.errorMessage : 'Failed to publish'),
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
        title: const Text('Donate Surplus Food'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Food Title *', hintText: 'e.g. 25 Trays Veggie Pasta'),
            ),
            const SizedBox(height: 12),

            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Category *'),
              items: const [
                DropdownMenuItem(value: 'cooked_meals', child: Text('🍲 Cooked Meals')),
                DropdownMenuItem(value: 'bakery_grains', child: Text('🥖 Bakery & Grains')),
                DropdownMenuItem(value: 'produce_fresh', child: Text('🥦 Fresh Produce')),
                DropdownMenuItem(value: 'packaged_groceries', child: Text('📦 Packaged Groceries')),
                DropdownMenuItem(value: 'dairy', child: Text('🥛 Dairy')),
              ],
              onChanged: (val) => setState(() => _category = val!),
            ),
            const SizedBox(height: 12),

            TextField(
              controller: _descController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description & Packaging *',
                hintText: 'Packaged in clean heat-sealed catering containers...',
              ),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _qtyController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Quantity *'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _unit,
                    decoration: const InputDecoration(labelText: 'Unit *'),
                    items: const [
                      DropdownMenuItem(value: 'meals', child: Text('Meals')),
                      DropdownMenuItem(value: 'portions', child: Text('Portions')),
                      DropdownMenuItem(value: 'kg', child: Text('kg')),
                      DropdownMenuItem(value: 'boxes', child: Text('Boxes')),
                    ],
                    onChanged: (val) => setState(() => _unit = val!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            DropdownButtonFormField<String>(
              value: _storage,
              decoration: const InputDecoration(labelText: 'Storage & Handling *'),
              items: const [
                DropdownMenuItem(value: 'hot_held', child: Text('🔥 Hot Held (Above 60°C)')),
                DropdownMenuItem(value: 'refrigerated', child: Text('❄️ Refrigerated (Below 4°C)')),
                DropdownMenuItem(value: 'room_temperature', child: Text('🍞 Room Temperature')),
              ],
              onChanged: (val) => setState(() => _storage = val!),
            ),
            const SizedBox(height: 12),

            TextField(
              controller: _allergensController,
              decoration: const InputDecoration(labelText: 'Allergens', hintText: 'e.g. Dairy, Gluten'),
            ),
            const SizedBox(height: 12),

            TextField(
              controller: _streetController,
              decoration: const InputDecoration(labelText: 'Pickup Street Address *'),
            ),
            const SizedBox(height: 12),

            TextField(
              controller: _cityController,
              decoration: const InputDecoration(labelText: 'City *'),
            ),
            const SizedBox(height: 16),

            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _safetyAccepted,
              onChanged: (val) => setState(() => _safetyAccepted = val ?? false),
              title: const Text(
                'I declare that this food is prepared hygienically and safe for human consumption.',
                style: TextStyle(fontSize: 12, color: AppColors.primaryText),
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
    );
  }
}

