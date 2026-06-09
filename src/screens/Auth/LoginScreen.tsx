import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';

// ─────────────────────────────────────────────────────────────
// LoginScreen
// ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const setAuth = useAuthStore(s => s.setAuth);
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  
  const { colors, type, isDark } = useAppTheme();

  const handleMockLogin = () => {
    setAuth(
      {
        id: '1',
        name: 'Rahul Kumar',
        phone: '+91 98765 43210',
        agency: 'PropSeekr Realty',
        isAadhaarVerified: true,
        isReraVerified: false,
        locality: 'Vijay Nagar, Indore',
        ratingScore: 4.7,
      },
      'mock-access-token',
      'mock-refresh-token',
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      {/* Background gradient */}
      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top accent bar */}
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>

          {/* ── Logo ── */}
          <View style={styles.logoSection}>
            <PropSeekrLogo size={88} theme={type} />

            {/* FIND. MATCH. CLOSE. tagline */}
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Text style={styles.taglineFind}>FIND.</Text>
              <Text style={styles.taglineMatch}> MATCH.</Text>
              <Text style={styles.taglineClose}> CLOSE.</Text>
              <View style={[styles.taglineLine, { backgroundColor: Brand.teal }]} />
            </View>
          </View>

          {/* ── Headline ── */}
          <View style={styles.headlineSection}>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>India's Smartest{'\n'}Broker Platform</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Connect with other brokers, match properties &amp; requirements,{'\n'}and close deals faster.
            </Text>
          </View>

          {/* ── Phone input ── */}
          <View style={styles.inputSection}>
            <View style={[styles.inputWrap, { borderColor: Brand.blueBorder }]}>
              <LinearGradient
                colors={type === 'dark' ? ['rgba(37,99,235,0.15)', 'rgba(16,185,129,0.08)'] : ['#FFFFFF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.inputInner}
              >
                <Text style={[styles.flagPrefix, { color: colors.textPrimary }]}>🇮🇳 +91</Text>
                <View style={[styles.inputDivider, { backgroundColor: Brand.blueBorder }]} />
                <TextInput
                  style={[styles.phoneInput, { color: colors.textPrimary }]}
                  placeholder="Enter your mobile number"
                  placeholderTextColor={colors.textDim}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="done"
                  onSubmitEditing={handleMockLogin}
                />
              </LinearGradient>
            </View>

            {/* CTA */}
            <TouchableOpacity onPress={handleMockLogin} activeOpacity={0.85}>
              <LinearGradient
                colors={['#2563EB', '#1A8CD8', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.ctaBtn, { shadowColor: Brand.blue }]}
              >
                <Text style={styles.ctaBtnText}>Send OTP →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.legal, { color: colors.textDim }]}>
              By continuing, you agree to PropSeekr's{' '}
              <Text style={styles.legalLink}>Terms &amp; Privacy Policy</Text>
            </Text>
          </View>

          {/* ── Register link ── */}
          <TouchableOpacity
            style={styles.registerWrap}
            onPress={() => navigation.navigate('Registration')}
            activeOpacity={0.75}
          >
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              New here? <Text style={styles.registerLink}>Create an account</Text>
            </Text>
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

  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },

  // ── Logo
  logoSection: { alignItems: 'center', marginBottom: 28 },

  // Tagline
  taglineRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
  },
  taglineLine:  { width: 18, height: 1.5, backgroundColor: Brand.blue, marginHorizontal: 6 },
  taglineFind:  { fontSize: 11, fontWeight: '700', color: Brand.blue,  letterSpacing: 1.5 },
  taglineMatch: { fontSize: 11, fontWeight: '700', color: '#4FA3E8',   letterSpacing: 1.5 },
  taglineClose: { fontSize: 11, fontWeight: '700', color: Brand.teal,  letterSpacing: 1.5 },

  // Headline
  headlineSection: { alignItems: 'center', marginBottom: 32 },
  headline: {
    fontSize: 30, fontWeight: '800', 
    textAlign: 'center', letterSpacing: -0.5, lineHeight: 38, marginBottom: 12,
  },
  sub: {
    fontSize: 14, textAlign: 'center', lineHeight: 22,
  },

  // Input
  inputSection: { marginBottom: 24 },
  inputWrap: {
    borderRadius: 16, borderWidth: 1.5,
    overflow: 'hidden', marginBottom: 14,
  },
  inputInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  flagPrefix:      { fontSize: 15, fontWeight: '600' },
  inputDivider:    { width: 1, height: 20 },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },

  ctaBtn: {
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8, marginBottom: 16,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  legal:     { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  legalLink: { color: '#10B981' },

  // Register link
  registerWrap: { alignItems: 'center', paddingVertical: 12 },
  registerText: { fontSize: 14 },
  registerLink: { color: '#10B981', fontWeight: '700' },
});
