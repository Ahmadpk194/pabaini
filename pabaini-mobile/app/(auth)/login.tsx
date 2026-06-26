import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { firebaseAuthService } from '../../src/api/firebaseAuth';
import { GoogleIcon } from '../../src/components/ui/GoogleIcon';
const pabainiLogoImage = require('../../assets/images/pabaini_logo.png');
import { getIdToken, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_SECTION_HEIGHT = SCREEN_HEIGHT * 0.42;

// Light-mode top section uses a deep forest-green tint.
// When a real village photo is added, pass it as source= to ImageBackground
// and keep this overlay. Nothing else in the layout needs to change.
const LIGHT_TOP_BG = '#052E16';

export default function LoginScreen() {
  const { theme, mode } = useTheme();
  const { setGuest, login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'initial' | 'phone' | 'otp'>('initial');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const [resendTimer, setResendTimer] = useState(60);
  const otpInputRef = useRef<TextInput>(null);
  const [isOtpFocused, setIsOtpFocused] = useState(false);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleOtpBoxPress = () => {
    otpInputRef.current?.focus();
  };

  // ─── Auth logic (unchanged) ───────────────────────────────────────────────

  function formatPhoneNumber(raw: string): string {
    // 1. Remove all spaces, dashes, parentheses, etc. Keep digits and plus sign.
    let cleaned = raw.replace(/[^\d+]/g, '');

    // 2. If it starts with +92 or 92, strip the prefix temporarily
    if (cleaned.startsWith('+92')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('92')) {
      cleaned = cleaned.substring(2);
    }

    // 3. Remove leading 0 if present (e.g. 03001234567 -> 3001234567)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // 4. Return formatted number with standard +92 prefix
    return '+92' + cleaned;
  }

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const formatted = formatPhoneNumber(phoneNumber);
      if (!formatted.match(/^\+92[3-9]\d{9}$/)) {
        throw new Error('Invalid Pakistan phone number. Format: +92 3XX XXXXXXX');
      }
      const confirmationResult = await firebaseAuthService.sendOtp(formatted);
      setConfirmation(confirmationResult);
      setStep('otp');
      setResendTimer(60); // reset countdown timer on send
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmation || !otp.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const userCredential = await firebaseAuthService.confirmOtp(confirmation, otp);
      const idToken = await getIdToken(userCredential.user);
      const dbUser = await login(idToken);
      if (!dbUser?.name || dbUser.name.trim() === '') {
        router.replace('/(onboarding)/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await firebaseAuthService.signInWithGoogle();
      const idToken = await getIdToken(userCredential.user);
      const dbUser = await login(idToken);
      if (!dbUser?.name || dbUser.name.trim() === '') {
        router.replace('/(onboarding)/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Google Sign-In failed';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    try {
      await setGuest();
      router.replace('/(tabs)');
    } catch {
      /* noop */
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
      setError(null);
    } else {
      setStep('initial');
      setPhoneNumber('');
      setOtp('');
      setConfirmation(null);
      setError(null);
    }
  };

  // ─── Derived styles (theme-aware) ────────────────────────────────────────

  const c = theme.colors;
  const topBg = mode === 'dark' ? c.background : LIGHT_TOP_BG;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (step === 'phone' || step === 'otp') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={[
                styles.subStepScroll,
                { paddingBottom: insets.bottom + 40 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Back */}
              <TouchableOpacity onPress={handleBack} style={styles.backRow} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color={c.primary} />
                <Text style={[styles.backText, { color: c.primary }]}>Back</Text>
              </TouchableOpacity>

              {/* Heading */}
              <Text style={[styles.subStepHeading, { color: c.textPrimary }]}>
                {step === 'phone' ? 'Enter your number' : 'Enter the code'}
              </Text>
              
              <View style={styles.subStepSubRow}>
                <Text style={[styles.subStepSub, { color: c.textSecondary }]}>
                  {step === 'phone'
                    ? "We'll send you a one-time code"
                    : `Code sent to ${phoneNumber}`}
                </Text>
                {step === 'otp' && (
                  <TouchableOpacity onPress={() => setStep('phone')} activeOpacity={0.7}>
                    <Text style={[styles.editLink, { color: c.primary }]}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Input */}
              {step === 'phone' ? (
                <View
                  style={[
                    styles.phoneInputWrapper,
                    {
                      backgroundColor: c.input ?? c.surface,
                      borderColor: error ? c.danger : c.borderStrong ?? c.border,
                    },
                  ]}
                >
                  <View style={styles.prefixContainer}>
                    <Text style={[styles.prefixText, { color: c.textPrimary }]}>🇵🇰 +92</Text>
                    <View style={[styles.prefixDivider, { backgroundColor: c.border }]} />
                  </View>
                  <TextInput
                    style={[styles.phoneInput, { color: c.textPrimary }]}
                    placeholder="3XX XXXXXXX"
                    placeholderTextColor={c.textTertiary ?? c.textSecondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={11}
                    autoFocus
                  />
                </View>
              ) : (
                <View style={styles.otpOuterContainer}>
                  {/* Hidden TextInput for full keyboard and copy-paste support */}
                  <TextInput
                    ref={otpInputRef}
                    style={styles.hiddenInput}
                    value={otp}
                    onChangeText={(val) => setOtp(val.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setIsOtpFocused(true)}
                    onBlur={() => setIsOtpFocused(false)}
                    autoFocus
                  />

                  {/* Split box displays */}
                  <TouchableOpacity
                    style={styles.otpBoxesRow}
                    activeOpacity={1}
                    onPress={handleOtpBoxPress}
                  >
                    {Array.from({ length: 6 }).map((_, index) => {
                      const char = otp[index] || '';
                      const isFocused = isOtpFocused && index === otp.length;

                      return (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            {
                              backgroundColor: c.input ?? c.surface,
                              borderColor: isFocused
                                ? c.primary
                                : error
                                ? c.danger
                                : c.borderStrong ?? c.border,
                            },
                          ]}
                        >
                          <Text style={[styles.otpChar, { color: c.textPrimary }]}>
                            {char}
                          </Text>
                        </View>
                      );
                    })}
                  </TouchableOpacity>
                </View>
              )}

              {error ? (
                <Text style={[styles.errorMsg, { color: c.danger ?? '#EF4444' }]}>{error}</Text>
              ) : null}

              {/* Resend Countdown under OTP boxes */}
              {step === 'otp' && (
                <View style={styles.resendContainer}>
                  {resendTimer > 0 ? (
                    <Text style={[styles.resendText, { color: c.textSecondary }]}>
                      Resend code in <Text style={{ color: c.primary, fontWeight: '600' }}>{resendTimer}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} disabled={loading} activeOpacity={0.7}>
                      <Text style={[styles.resendLink, { color: c.primary }]}>
                        Resend Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* CTA */}
              <TouchableOpacity
                style={[
                  styles.ctaBtn,
                  {
                    backgroundColor:
                      loading ||
                      (step === 'phone' ? !phoneNumber.trim() : otp.length !== 6)
                        ? (c.borderStrong ?? c.border)
                        : c.primary,
                  },
                ]}
                onPress={step === 'phone' ? handleSendOtp : handleVerifyOtp}
                disabled={
                  loading ||
                  (step === 'phone' ? !phoneNumber.trim() : otp.length !== 6)
                }
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaBtnText}>
                    {step === 'phone' ? 'Send Code' : 'Verify'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // ─── INITIAL / WELCOME STEP ───────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Translucent status bar — icons show white over the dark top section */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── TOP HERO SECTION ── */}
      {/*
        Structured as ImageBackground so adding a real photo later is one prop change.
        For now the solid-colour backgroundColor provides the visual.
      */}
      <ImageBackground
        source={undefined}          // ← swap to require('./village.jpg') or a URI later
        style={[styles.topSection, { backgroundColor: topBg, height: TOP_SECTION_HEIGHT }]}
        resizeMode="cover"
      >
        {/* Modern LinearGradient overlay to give deep rich colors and keep any future background image readable */}
        <LinearGradient
          colors={
            mode === 'dark'
              ? ['rgba(22, 163, 74, 0.15)', 'rgba(15, 15, 15, 0.95)'] // Subtle emerald-tinted dark gradient
              : ['rgba(22, 163, 74, 0.25)', 'rgba(5, 46, 22, 0.95)'] // Vibrant deep green gradient
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Centred logo mark + wordmark */}
        <View style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <Image
              source={pabainiLogoImage}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.wordmark}>Pabaini</Text>
        </View>
      </ImageBackground>

      {/* ── BOTTOM SHEET ── */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: c.surface,
            // Sheet extends to screen bottom — paddingBottom accounts for home-bar
            paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 32,
          },
        ]}
      >
        {/* Bottom sheet slide handle/indicator */}
        <View style={[styles.sheetHandle, { backgroundColor: c.borderStrong ?? c.border }]} />

        {/* Tagline / Welcome Section */}
        <View style={styles.taglineSection}>
          <Text style={[styles.taglineTitle, { color: c.textPrimary }]}>
            Connecting Pabaini
          </Text>
          <Text style={[styles.taglineSub, { color: c.textSecondary }]}>
            Together as one community
          </Text>
        </View>

        {/* Phone button */}
        <TouchableOpacity
          style={[styles.authBtn, styles.authBtnPrimary, { backgroundColor: c.primary }]}
          onPress={() => setStep('phone')}
          activeOpacity={0.85}
        >
          <View style={styles.btnIcon}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </View>
          <Text style={[styles.authBtnText, { color: '#FFFFFF' }]}>
            Continue with Phone
          </Text>
        </TouchableOpacity>

        {/* Google button */}
        <TouchableOpacity
          style={[
            styles.authBtn,
            styles.authBtnGoogle,
            {
              backgroundColor: c.surface,
              borderColor: c.borderStrong ?? c.border,
              marginTop: 12,
            },
          ]}
          onPress={handleGoogleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={c.primary} style={styles.btnIcon} />
          ) : (
            <View style={styles.btnIcon}>
              <GoogleIcon size={18} />
            </View>
          )}
          <Text style={[styles.authBtnText, { color: c.textPrimary }]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          <Text style={[styles.dividerText, { color: c.textTertiary ?? c.textSecondary }]}>
            or
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
        </View>

        {/* Guest */}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={handleGuest}
          activeOpacity={0.7}
        >
          <Text style={[styles.guestText, { color: c.primary }]}>
            Continue as guest
          </Text>
        </TouchableOpacity>

        {/* Footer — pushed to bottom with flex spacer */}
        <View style={styles.footerSpacer} />
        <Text style={[styles.footer, { color: c.textTertiary ?? c.textSecondary }]}>
          By continuing you agree to our{' '}
          <Text style={{ fontWeight: '600' }}>Terms & Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Top hero ──
  topSection: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    alignItems: 'center',
    gap: 4,
  },
  wordmark: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // ── Bottom sheet ──
  sheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  taglineSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  taglineTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  taglineSub: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Buttons
  authBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  authBtnPrimary: {
    // shadow for the primary CTA
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  authBtnGoogle: {
    borderWidth: 1.25,
  },
  btnIcon: {
    marginRight: 8,
  },
  authBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '500',
  },

  // Guest
  guestBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Footer
  footerSpacer: {
    flex: 1,
  },
  footer: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    paddingBottom: 4,
  },

  // ── Phone / OTP sub-steps ──
  subStepScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 2,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subStepHeading: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: -0.3,
  },
  subStepSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 8,
  },
  subStepSub: {
    fontSize: 15,
    lineHeight: 22,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    height: '100%',
    paddingVertical: 0,
  },
  otpOuterContainer: {
    width: '100%',
    marginVertical: 12,
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpChar: {
    fontSize: 22,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorMsg: {
    fontSize: 13,
    marginBottom: 16,
  },
  ctaBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
