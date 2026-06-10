import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme/app_theme.dart';
import 'views/splash_view.dart';
import 'views/home_view.dart';
import 'views/login_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // System UI overlay style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AppTheme.surface,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://wrljckupuktfrlmjoqdc.supabase.co',
    publishableKey: const String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybGpja3VwdWt0ZnJsbWpvcWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODc1MTAsImV4cCI6MjA5NjU2MzUxMH0.7GBql9LizbCXpdw4AEgV2V9j5NJHA2WMisXPczLqfrQ',
    ),
    realtimeClientOptions: const RealtimeClientOptions(
      eventsPerSecond: 2,
    ),
  );

  runApp(const PinjamKuyApp());
}

class PinjamKuyApp extends StatelessWidget {
  const PinjamKuyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'PinjamKuy',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      defaultTransition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 300),
      initialRoute: '/',
      getPages: [
        GetPage(
          name: '/',
          page: () => const SplashView(),
        ),
        GetPage(
          name: '/home',
          page: () => const HomeView(),
        ),
        GetPage(
          name: '/login',
          page: () => const LoginView(),
        ),
      ],
    );
  }
}
