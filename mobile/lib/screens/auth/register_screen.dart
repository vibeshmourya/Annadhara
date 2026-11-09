import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/auth_provider.dart';
import '../main_navigation_shell.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _orgNameController = TextEditingController();
  final _regNumberController = TextEditingController();
  final _cityController = TextEditingController();

  String _selectedRole = 'DONOR';
  String _selectedOrgType = 'Restaurant';
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _orgNameController.dispose();
    _regNumberController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text.trim();
    final orgName = _orgNameController.text.trim();

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters')),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.register(
      name: name,
      email: email,
      password: password,
      role: _selectedRole,
      phone: phone,
      organizationName: _selectedRole != 'VOLUNTEER' ? orgName : null,
      organizationType: _selectedRole != 'VOLUNTEER' ? _selectedOrgType : null,
      registrationNumber: _regNumberController.text.trim(),
      city: _cityController.text.trim(),
    );

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainNavigationShell()),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage.isNotEmpty ? auth.errorMessage : 'Registration failed'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Join FoodBridge Network'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Role Segment
              const Text('I want to register as a:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryText)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _roleButton('Donor', 'DONOR', Icons.restaurant),
                  const SizedBox(width: 8),
                  _roleButton('Recipient', 'RECIPIENT', Icons.shield),
                  const SizedBox(width: 8),
                  _roleButton('Volunteer', 'VOLUNTEER', Icons.delivery_dining),
                ],
              ),
              const SizedBox(height: 20),

              // Inputs
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full Name / Contact Person *'),
              ),
              const SizedBox(height: 12),

              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email Address *'),
              ),
              const SizedBox(height: 12),

              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone Number *'),
              ),
              const SizedBox(height: 12),

              if (_selectedRole != 'VOLUNTEER') ...[
                TextField(
                  controller: _orgNameController,
                  decoration: InputDecoration(
                    labelText: _selectedRole == 'DONOR' ? 'Business / Restaurant Name *' : 'NGO / Shelter Name *',
                  ),
                ),
                const SizedBox(height: 12),

                DropdownButtonFormField<String>(
                  initialValue: _selectedOrgType,
                  decoration: const InputDecoration(labelText: 'Organization Type *'),
                  items: (_selectedRole == 'DONOR'
                          ? const [
                              DropdownMenuItem(value: 'Restaurant', child: Text('Restaurant')),
                              DropdownMenuItem(value: 'Hotel', child: Text('Hotel')),
                              DropdownMenuItem(value: 'College Canteen', child: Text('College Canteen')),
                              DropdownMenuItem(value: 'Event Organizer', child: Text('Event Organizer')),
                            ]
                          : const [
                              DropdownMenuItem(value: 'NGO', child: Text('Non-Profit NGO')),
                              DropdownMenuItem(value: 'Food Distribution Organization', child: Text('Food Distribution Organization')),
                            ])
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedOrgType = val);
                  },
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: _regNumberController,
                  decoration: const InputDecoration(labelText: 'Registration / Tax Number (Optional)'),
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: _cityController,
                  decoration: const InputDecoration(labelText: 'City *'),
                ),
                const SizedBox(height: 12),
              ],

              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Password (min 6 characters) *',
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      color: AppColors.secondaryText,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: auth.isLoading ? null : _submit,
                  child: auth.isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Create Account'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _roleButton(String label, String roleValue, IconData icon) {
    final isSelected = _selectedRole == roleValue;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedRole = roleValue;
            if (roleValue == 'DONOR') _selectedOrgType = 'Restaurant';
            if (roleValue == 'RECIPIENT') _selectedOrgType = 'NGO';
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryGreen : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? AppColors.primaryGreen : AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, size: 20, color: isSelected ? Colors.white : AppColors.secondaryText),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : AppColors.primaryText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
