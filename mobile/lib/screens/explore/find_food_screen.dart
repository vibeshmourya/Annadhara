import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../models/donation_model.dart';
import '../../providers/donation_provider.dart';
import 'donation_detail_screen.dart';

class FindFoodScreen extends StatefulWidget {
  const FindFoodScreen({super.key});

  @override
  State<FindFoodScreen> createState() => _FindFoodScreenState();
}

class _FindFoodScreenState extends State<FindFoodScreen> {
  String _selectedCategory = 'all';
  final _searchController = TextEditingController();

  final List<Map<String, String>> _categories = const [
    {'label': 'All Food', 'value': 'all'},
    {'label': '🍲 Cooked Meals', 'value': 'cooked_meals'},
    {'label': '🥖 Bakery', 'value': 'bakery_grains'},
    {'label': '🥦 Produce', 'value': 'produce_fresh'},
    {'label': '📦 Groceries', 'value': 'packaged_groceries'},
    {'label': '🥛 Dairy', 'value': 'dairy'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() {
    Provider.of<DonationProvider>(context, listen: false).fetchDonations(
      category: _selectedCategory,
      search: _searchController.text.trim(),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final donProvider = Provider.of<DonationProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Available Food'),
      ),
      body: Column(
        children: [
          // Search & Filter header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Column(
              children: [
                // Search bar
                TextField(
                  controller: _searchController,
                  onChanged: (_) => _loadData(),
                  decoration: InputDecoration(
                    hintText: 'Search food or city...',
                    prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.secondaryText),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _loadData();
                            },
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 10),

                // Category chips
                SizedBox(
                  height: 36,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = _selectedCategory == cat['value'];
                      return ChoiceChip(
                        label: Text(
                          cat['label']!,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : AppColors.primaryText,
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: AppColors.primaryGreen,
                        backgroundColor: AppColors.lightGreen.withValues(alpha: 0.5),
                        side: BorderSide(color: isSelected ? AppColors.primaryGreen : AppColors.border),
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _selectedCategory = cat['value']!);
                            _loadData();
                          }
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Donation list
          Expanded(
            child: donProvider.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
                : donProvider.donations.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inventory_2_outlined, size: 48, color: AppColors.secondaryText.withValues(alpha: 0.5)),
                            const SizedBox(height: 8),
                            const Text('No surplus food found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
                            const SizedBox(height: 4),
                            const Text('Try changing search or category filter', style: TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () async => _loadData(),
                        color: AppColors.primaryGreen,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: donProvider.donations.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final item = donProvider.donations[index];
                            return _donationCard(item);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _donationCard(DonationModel item) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => DonationDetailScreen(donation: item)),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Image or banner
            Container(
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.lightGreen,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                image: item.imageUrl.isNotEmpty
                    ? DecorationImage(image: NetworkImage(item.imageUrl), fit: BoxFit.cover)
                    : null,
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        item.status.toUpperCase(),
                        style: const TextStyle(color: AppColors.darkGreen, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  if (item.distanceKm != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.location_on, size: 10, color: Colors.white),
                            const SizedBox(width: 2),
                            Text(
                              '${item.distanceKm!.toStringAsFixed(1)} km',
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Card Body
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item.category.replaceAll('_', ' ').toUpperCase(),
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
                      ),
                      Text(
                        '${item.availableQuantity} ${item.unit} available',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.darkGreen),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      const Icon(Icons.business_outlined, size: 14, color: AppColors.secondaryText),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          item.organizationName ?? item.donorName,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondaryText),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Icon(Icons.location_on_outlined, size: 14, color: AppColors.secondaryText),
                      const SizedBox(width: 2),
                      Text(
                        item.city,
                        style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                      ),
                    ],
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
