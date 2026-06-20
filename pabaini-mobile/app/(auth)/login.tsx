import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { firebaseAuthService } from '../../src/api/firebaseAuth';
import { Button } from '../../src/components/ui/Button';
import { PhoneIcon } from '../../src/components/ui/PhoneIcon';
import { GoogleIcon } from '../../src/components/ui/GoogleIcon';
import { getIdToken } from '@react-native-firebase/auth';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { setGuest, login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'initial' | 'phone' | 'otp'>('initial');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<any>(null);

  const handlePhoneLogin = () => {
    setStep('phone');
  };

  const handleSendOtp = async () => {
    
    if (!phoneNumber.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Validate phone number format (Pakistan: +92 followed by 10 digits starting with 3)
      if (!formattedPhone.match(/^\+92[3-9]\d{9}$/)) {
        throw new Error('Invalid Pakistan phone number. Format: +92 3XX XXXXXXX');
      }
      
      const confirmationResult = await firebaseAuthService.sendOtp(formattedPhone);
      
      setConfirmation(confirmationResult);
      setStep('otp');
    } catch (err: any) {
      console.error('Error sending OTP - Full error:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    
    if (!confirmation || !otp.trim()) {
      return;
    }

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
      const serverMessage = err.response?.data?.message || err.message || 'Invalid OTP';
      setError(serverMessage);
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
      console.error('Error signing in with Google - Full error:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error stack:', err.stack);
      const serverMessage = err.response?.data?.message || err.message || 'Google Sign-In failed';
      setError(serverMessage);
      Alert.alert('Error', serverMessage);
    } finally {
      setLoading(false);
    }
  };
   
  const handleGuest = () => {
    setGuest();
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    setStep('initial');
    setPhoneNumber('');
    setOtp('');
    setConfirmation(null);
    setError(null);
  };

  function formatPhoneNumber(phoneNumber: string): string {
    
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If already has +92 at start, just clean it
    if (cleaned.startsWith('+92')) {
      return cleaned;
    }
    
    // If starts with + but not +92, assume it's wrong and remove +
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Remove leading 0
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add Pakistan country code
    const formatted = '+92' + cleaned;
    return formatted;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
          {step === 'initial' ? (
            <>
              <View style={styles.header}>
                <View
                  style={[
                    styles.logoBadge,
                    {
                      backgroundColor: theme.colors.surface,
                      shadowColor: '#000',
                    },
                  ]}
                >
                  <Text style={[styles.logoText, { color: theme.colors.primary }]}>Pabaini</Text>
                </View>
              </View>

              <View style={styles.main}>
                <Text style={[styles.heading, { color: theme.colors.primary }]}>
                  Connecting the Pabaini Community
                </Text>

                <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>
                  Stay updated with official village announcements and community news.
                </Text>

                <View style={styles.actions}>
                  <Button
                    title="Continue with Phone Number"
                    onPress={handlePhoneLogin}
                    variant="primary"
                    style={styles.button}
                    leftIcon={<PhoneIcon color={theme.colors.onPrimary} />}
                  />

                  <Button
                    title="Continue with Google"
                    onPress={handleGoogleLogin}
                    variant="secondary"
                    style={styles.button}
                    leftIcon={<GoogleIcon />}
                  />

                  <View style={styles.dividerContainer}>
                    <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                    <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>OR</Text>
                    <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                  </View>

                  <TouchableOpacity onPress={handleGuest} style={styles.guestButton}>
                    <Text style={[styles.guestText, { color: theme.colors.primary }]}>
                      Continue as Guest
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  By continuing, you agree to Pabaini's{' '}
                  <Text style={[styles.linkText, { color: theme.colors.link }]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[styles.linkText, { color: theme.colors.link }]}>Privacy Policy</Text>.
                </Text>
                <Text style={[styles.copyrightText, { color: theme.colors.textSecondary }]}>
                  © 2026 Pabaini Village Square.
                </Text>
              </View>
            </>
          ) : step === 'phone' ? (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
                </TouchableOpacity>

                <ScrollView
                  contentContainerStyle={{ flexGrow: 1 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.phoneContainer}>
                    <Text style={[styles.phoneHeading, { color: theme.colors.primary }]}>
                      Enter your phone number
                    </Text>
                    <Text style={[styles.phoneSubtext, { color: theme.colors.textSecondary }]}>
                      We'll send you a verification code
                    </Text>

                    <TextInput
                      style={[
                        styles.phoneInput,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      placeholder="+92 3XX XXXXXXX"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      maxLength={15}
                    />

                    {error && <Text style={[styles.errorText, { color: '#D32F2F' }]}>{error}</Text>}

                    <Button
                      title={loading ? 'Sending...' : 'Send Code'}
                      onPress={handleSendOtp}
                      variant="primary"
                      style={styles.phoneButton}
                      disabled={loading || !phoneNumber.trim()}
                    />
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          ) : (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
                </TouchableOpacity>

                <ScrollView
                  contentContainerStyle={{ flexGrow: 1 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.otpContainer}>
                    <Text style={[styles.otpHeading, { color: theme.colors.primary }]}>
                      Enter verification code
                    </Text>
                    <Text style={[styles.otpSubtext, { color: theme.colors.textSecondary }]}>
                      Code sent to {phoneNumber}
                    </Text>

                    <TextInput
                      style={[
                        styles.otpInput,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                    />

                    {error && <Text style={[styles.errorText, { color: '#D32F2F' }]}>{error}</Text>}

                    <Button
                      title={loading ? 'Verifying...' : 'Verify'}
                      onPress={handleVerifyOtp}
                      variant="primary"
                      style={styles.otpButton}
                      disabled={loading || !otp.trim()}
                    />
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
  },
  logoBadge: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
  },
  main: {
    flex: 1,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    maxWidth: 320,
  },
  actions: {
    width: '100%',
  },
  button: {
    width: '100%',
    marginBottom: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  guestText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  linkText: {
    fontWeight: '600',
  },
  copyrightText: {
    fontSize: 11,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Align form to the top to reduce empty space and keep elements above the keyboard
  phoneContainer: {
    flex: 1,
    paddingTop: 20,
  },
  phoneHeading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  phoneSubtext: {
    fontSize: 16,
    marginBottom: 32,
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  phoneButton: {
    width: '100%',
  },
  // Align form to the top to reduce empty space and keep elements above the keyboard
  otpContainer: {
    flex: 1,
    paddingTop: 20,
  },
  otpHeading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  otpSubtext: {
    fontSize: 16,
    marginBottom: 32,
  },
  otpInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    marginBottom: 16,
    letterSpacing: 8,
  },
  otpButton: {
    width: '100%',
  },
});
