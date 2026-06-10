import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

class ForgotPasswordView extends StatefulWidget {
  const ForgotPasswordView({super.key});

  @override
  State<ForgotPasswordView> createState() => _ForgotPasswordViewState();
}

class _ForgotPasswordViewState extends State<ForgotPasswordView> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _isSubmitting = false.obs;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    _isSubmitting.value = true;
    try {
      final email = _emailController.text.trim();

      // Trigger Supabase password reset link
      await Supabase.instance.client.auth.resetPasswordForEmail(
        email,
        redirectTo: 'https://pinjamkuy.vercel.app',
      );

      Get.defaultDialog(
        title: 'Tautan Dikirim',
        middleText: 'Tautan pemulihan kata sandi telah dikirim ke surel Anda. Silakan ikuti instruksi pada surel tersebut.',
        textConfirm: 'Kembali Ke Login',
        confirmTextColor: Colors.black,
        buttonColor: AppTheme.accent,
        onConfirm: () {
          Get.back(); // close dialog
          Get.offAllNamed('/login');
        },
      );
    } on AuthException catch (err) {
      Get.snackbar(
        'Pemulihan Gagal',
        err.message,
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.dangerSurface,
        colorText: AppTheme.danger,
        margin: const EdgeInsets.all(16),
      );
    } catch (err) {
      Get.snackbar(
        'Pemulihan Gagal',
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
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.textPrimary),
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
                            Icons.lock_reset_rounded,
                            size: 36,
                            color: Color(0xFF003300),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'Lupa Kata Sandi',
                          style: GoogleFonts.inter(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                            letterSpacing: -1.0,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Masukkan surel untuk menerima tautan pemulihan kata sandi',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppTheme.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),

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
                    decoration: const InputDecoration(
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
                  const SizedBox(height: 36),

                  // Submit Button
                  Obx(() => SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isSubmitting.value ? null : _handleResetPassword,
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
                                  'Kirim Tautan',
                                  style: GoogleFonts.inter(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(Icons.send_rounded, size: 18),
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
