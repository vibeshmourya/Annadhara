import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/constants/colors.dart';
import 'providers/auth_provider.dart';
import 'providers/donation_provider.dart';
import 'providers/activity_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/admin_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main_navigation_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AnnadharaApp());
}

class AnnadharaApp extends StatelessWidget {
  const AnnadharaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DonationProvider()),
        ChangeNotifierProvider(create: (_) => ActivityProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => AdminProvider()),
      ],
      child: MaterialApp(
        title: 'Annadhara',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AuthGate(),
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    if (auth.isLoading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.volunteer_activism_rounded, color: AppColors.primaryGreen, size: 48),
              SizedBox(height: 12),
              Text(
                'Annadhara',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primaryText,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Surplus Food. Shared Hope. Zero Waste.',
                style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
              ),
              SizedBox(height: 18),
              CircularProgressIndicator(color: AppColors.primaryGreen),
            ],
          ),
        ),
      );
    }

    if (auth.isAuthenticated) {
      return const MainNavigationShell();
    }

    return const LoginScreen();
  }
}
