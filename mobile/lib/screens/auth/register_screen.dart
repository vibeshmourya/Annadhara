import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/india_constants.dart';
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
  final _fssaiController = TextEditingController();
  final _streetController = TextEditingController();
  final _areaController = TextEditingController();
  final _cityController = TextEditingController();
  final _districtController = TextEditingController();
  final _pinController = TextEditingController();

  String _selectedRole = 'DONOR';
  String _selectedOrgType = 'Restaurant';
  String _selectedState = 'Karnataka';
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _orgNameController.dispose();
    _regNumberController.dispose();
    _fssaiController.dispose();
    _streetController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _districtController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  void _onRoleChanged(String newRole) {
    setState(() {
      _selectedRole = newRole;
      if (newRole == 'DONOR') {
        _selectedOrgType = 'Restaurant';
      } else if (newRole == 'RECIPIENT') {
        _selectedOrgType = 'Registered NGO';
      }
    });
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text.trim();
    final orgName = _orgNameController.text.trim();
    final city = _cityController.text.trim();
    final pin = _pinController.text.trim();

    if (name.isEmpty || email.isEmpty || phone.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required contact and account fields')),
      );
      return;
    }

    if (!IndiaConstants.isValidIndianPhone(phone)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit Indian phone number')),
      );
      return;
    }

    if (_selectedRole != 'VOLUNTEER') {
      if (orgName.isEmpty || city.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Organization name and city are required')),
        );
        return;
      }

      if (pin.isNotEmpty && !IndiaConstants.isValidPINCode(pin)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter a valid 6-digit Indian PIN code (e.g. 560001)')),
        );
        return;
      }
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
      fssaiNumber: _selectedRole == 'DONOR' ? _fssaiController.text.trim() : null,
      street: _streetController.text.trim(),
      areaLocality: _areaController.text.trim(),
      city: city,
      district: _districtController.text.trim(),
      state: _selectedState,
      postalCode: pin,
    );

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainNavigationShell()),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage.isNotEmpty ? auth.errorMessage : 'Registration failed. Please check inputs.'),
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
        title: const Text('Join Annadhara Network (India)'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Role Segment
              const Text(
                'I want to register as a:',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryText),
              ),
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
                decoration: const InputDecoration(
                  labelText: 'Phone Number (India) *',
                  prefixText: '+91 ',
                  hintText: '98765 43210',
                ),
              ),
              const SizedBox(height: 12),

              if (_selectedRole != 'VOLUNTEER') ...[
                TextField(
                  controller: _orgNameController,
                  decoration: InputDecoration(
                    labelText: _selectedRole == 'DONOR'
                        ? 'Business / Restaurant Name *'
                        : 'NGO / Trust / Shelter Name *',
                  ),
                ),
                const SizedBox(height: 12),

                DropdownButtonFormField<String>(
                  initialValue: _selectedOrgType,
                  decoration: const InputDecoration(labelText: 'Organization Category *'),
                  items: (_selectedRole == 'DONOR'
                          ? IndiaConstants.donorOrgTypes
                          : IndiaConstants.recipientOrgTypes)
                      .map((type) => DropdownMenuItem(value: type, child: Text(type)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedOrgType = val);
                  },
                ),
                const SizedBox(height: 12),

                if (_selectedRole == 'DONOR') ...[
                  TextField(
                    controller: _fssaiController,
                    keyboardType: TextInputType.number,
                    maxLength: 14,
                    decoration: const InputDecoration(
                      labelText: 'FSSAI License / Registration No. (Optional)',
                      hintText: '14-digit number',
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                TextField(
                  controller: _regNumberController,
                  decoration: InputDecoration(
                    labelText: _selectedRole == 'DONOR'
                        ? 'GSTIN / Trade License (Optional)'
                        : 'NGO Darpan / Trust Reg. No. (Optional)',
                  ),
                ),
                const SizedBox(height: 12),

                // Indian Address Sub-section
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 4),
                  child: Text(
                    'Location Details (India)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                  ),
                ),
                TextField(
                  controller: _streetController,
                  decoration: const InputDecoration(labelText: 'House / Building / Street'),
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: _areaController,
                  decoration: const InputDecoration(labelText: 'Area / Locality'),
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _cityController,
                        decoration: const InputDecoration(labelText: 'City / Town *'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _pinController,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        decoration: const InputDecoration(labelText: 'PIN Code (6 digits)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                DropdownButtonFormField<String>(
                  initialValue: _selectedState,
                  decoration: const InputDecoration(labelText: 'State / Union Territory *'),
                  items: IndiaConstants.indianStates
                      .map((st) => DropdownMenuItem(value: st, child: Text(st)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedState = val);
                  },
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
              const SizedBox(height: 16),

              // Food Safety Disclaimer Note
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.lightGreen.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, size: 16, color: AppColors.primaryGreen),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Food Safety: In compliance with FSSAI guidelines, donors ensure food is hygienically prepared. Annadhara provides logistics and discovery coordination.',
                        style: TextStyle(fontSize: 10, color: AppColors.darkGreen, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: auth.isLoading ? null : _submit,
                child: auth.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Create Account & Join Network'),
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
        onTap: () => _onRoleChanged(roleValue),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryGreen : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.primaryGreen : AppColors.border,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? Colors.white : AppColors.secondaryText, size: 20),
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
