import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _isSubmitting = false.obs;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    _isSubmitting.value = true;
    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text;

      // Supabase Sign Up
      final response = await Supabase.instance.client.auth.signUp(
        email: email,
        password: password,
      );

      if (response.user != null) {
        // If email confirmation is required, user is created but session might be null.
        // If confirmation is disabled, user session is automatically active.
        if (response.session != null) {
          Get.snackbar(
            'Registrasi Berhasil',
            'Akun Anda berhasil didaftarkan.',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: AppTheme.accentSurface,
            colorText: AppTheme.accent,
            margin: const EdgeInsets.all(16),
          );
          Get.offAllNamed('/home');
        } else {
          Get.defaultDialog(
            title: 'Verifikasi Surel',
            middleText: 'Silakan periksa kotak masuk surel Anda untuk memverifikasi pendaftaran sebelum masuk.',
            textConfirm: 'Paham',
            confirmTextColor: Colors.black,
            buttonColor: AppTheme.accent,
            onConfirm: () {
              Get.back(); // close dialog
              Get.offAllNamed('/login');
            },
          );
        }
      } else {
        throw const AuthException('Gagal membuat akun.');
      }
    } on AuthException catch (err) {
      Get.snackbar(
        'Registrasi Gagal',
        err.message,
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.dangerSurface,
        colorText: AppTheme.danger,
        margin: const EdgeInsets.all(16),
      );
    } catch (err) {
      Get.snackbar(
        'Registrasi Gagal',
        'Terjadi kesalahan tidak terduga. Silakan coba kembali.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.dangerSurface,
        colorText: AppTheme.danger,
        margin: const EdgeInsets.all(16),
      );
    } finally {
      _isSubmitting.value = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: AppTheme.textPrimary),
          onPressed: () => Get.back(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Block
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            gradient: AppTheme.accentGradient,
                            borderRadius: BorderRadius.circular(AppTheme.radiusXLarge),
                            boxShadow: AppTheme.accentGlow,
                          ),
                          child: const Icon(
                            Icons.person_add_alt_1_rounded,
                            size: 36,
                            color: Color(0xFF003300),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'Buat Akun Baru',
                          style: GoogleFonts.inter(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                            letterSpacing: -1.0,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Daftar untuk meminjam barang dan ruangan',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Email Input
                  Text(
                    'Surel (Email)',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 15),
                    decoration: InputDecoration(
                      hintText: 'nama@surel.com',
                      prefixIcon: Icon(
                        Icons.mail_outline_rounded,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Alamat surel harus diisi';
                      }
                      if (!GetUtils.isEmail(value.trim())) {
                        return 'Alamat surel tidak valid';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  // Password Input
                  Text(
                    'Kata Sandi',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 15),
                    decoration: InputDecoration(
                      hintText: 'Minimal 6 karakter',
                      prefixIcon: Icon(
                        Icons.lock_outline_rounded,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Kata sandi harus diisi';
                      }
                      if (value.length < 6) {
                        return 'Kata sandi minimal 6 karakter';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  // Confirm Password Input
                  Text(
                    'Konfirmasi Kata Sandi',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: true,
                    style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 15),
                    decoration: InputDecoration(
                      hintText: 'Ulangi kata sandi',
                      prefixIcon: Icon(
                        Icons.lock_outline_rounded,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Konfirmasi kata sandi harus diisi';
                      }
                      if (value != _passwordController.text) {
                        return 'Konfirmasi kata sandi tidak cocok';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),

                  // Submit Button
                  Obx(() => SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isSubmitting.value ? null : _handleRegister,
                      child: _isSubmitting.value
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Color(0xFF003300),
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Daftar Sekarang',
                                  style: GoogleFonts.inter(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(Icons.arrow_forward_rounded, size: 18),
                              ],
                            ),
                    ),
                  )),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
