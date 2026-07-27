import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { sendEmailOTP, verifyEmailOTP } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export default function OTPScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors, type } = useAppTheme();
  const setAuth = useAuthStore(s => s.setAuth);
  
  // Accept email address from previous screen
  const emailAddress = route.params?.email || route.params?.phone || '';
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await verifyEmailOTP({ email: emailAddress, otp, purpose: 'EmailVerification' });
      
      Alert.alert('Verified', response.message || 'Email verified successfully.');
      navigation.navigate('Login');
    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!emailAddress) {
      Alert.alert('Error', 'Email address is missing.');
      return;
    }

    try {
      setIsResending(true);
      const response = await sendEmailOTP({ email: emailAddress, purpose: 'EmailVerification' });
      Alert.alert('OTP Resent', response.message || 'OTP has been resent successfully.');
    } catch (error: any) {
      console.error('Resend OTP Error:', error);
      Alert.alert('Failed to resend', error.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>

          {/* ── Header ── */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* ── Logo ── */}
          <View style={styles.logoSection}>
            <PropSeekrLogo size={64} theme={type} />
          </View>

          {/* ── Headline ── */}
          <View style={styles.headlineSection}>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>Verify OTP</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Enter the code sent to{'\n'}
              <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>{emailAddress || 'your email'}</Text>
            </Text>
          </View>

          {/* ── OTP Input ── */}
          <View style={styles.inputSection}>
            <View style={[styles.inputWrap, { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg }]}>
              <TextInput
                style={[styles.otpInput, { color: colors.textPrimary }]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.textDim}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>

            {/* CTA Verify */}
            <TouchableOpacity onPress={handleVerify} activeOpacity={0.85} disabled={isLoading}>
              <LinearGradient
                colors={['#2563EB', '#1A8CD8', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.ctaBtn, { shadowColor: Brand.blue }]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaBtnText}>Verify & Proceed →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Resend link ── */}
          <TouchableOpacity
            style={styles.resendWrap}
            onPress={handleResendOTP}
            activeOpacity={0.75}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                Didn't receive code? <Text style={styles.resendLink}>Resend OTP</Text>
              </Text>
            )}
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },

  accentBar: {
    height: 3, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },

  content: { flex: 1, paddingHorizontal: 28, paddingTop: 8 },

  backBtn: { marginTop: 8, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: '#10B981', fontSize: 15, fontWeight: '600' },

  logoSection: { alignItems: 'center', marginBottom: 24 },

  headlineSection: { alignItems: 'center', marginBottom: 32 },
  headline: {
    fontSize: 28, fontWeight: '800', 
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 12,
  },
  sub: {
    fontSize: 15, textAlign: 'center', lineHeight: 22,
  },

  inputSection: { marginBottom: 24 },
  inputWrap: {
    borderRadius: 16, borderWidth: 1.5,
    overflow: 'hidden', marginBottom: 20,
    height: 64,
  },
  otpInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
  },

  ctaBtn: {
    borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8, height: 56,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  resendWrap: { alignItems: 'center', paddingVertical: 12 },
  resendText: { fontSize: 14 },
  resendLink: { color: '#10B981', fontWeight: '700' },
});
