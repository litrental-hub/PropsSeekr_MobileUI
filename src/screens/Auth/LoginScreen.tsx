import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { login } from '../../api/auth';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { checkBiometricSupport, hasSavedCredentials, getSavedCredentials, saveCredentials } from '../../utils/biometrics';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────
// LoginScreen
// ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const setAuth = useAuthStore(s => s.setAuth);
  const navigation = useNavigation<any>();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { t } = useTranslation();
  
  const { colors, type, isDark } = useAppTheme();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Validation Error', 'Please enter both identifier and password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await login({ identifier, password });
      
      // Extract user info from either `user` or `broker` payload
      const userId = res.user?.id || res.broker?.broker_id || '';
      const brokerId = res.user?.brokerId || res.broker?.broker_id || '';
      const userName = res.user?.name || res.broker?.name || '';
      const userPhone = res.user?.mobileNumber || res.broker?.mobile || '';
      const userEmail = res.user?.email || res.broker?.email || '';

      console.log('--- LOGIN RESPONSE ---');
      console.log('res.user.brokerId:', res.user?.brokerId);
      console.log('Extracted brokerId:', brokerId);

      // Save token and user details to store
      setAuth(
        {
          id: String(userId),
          brokerId: brokerId,
          name: userName,
          phone: userPhone,
          email: userEmail,
          isAadhaarVerified: false,
          isReraVerified: false,
        },
        res.token,
        res.refreshToken
      );
      // NOTE: Navigation is typically handled automatically by the RootNavigator listening to auth state
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      console.error(`Login API Error [HTTP ${status || 'Unknown'}]:`, data || error.message);

      let errorMessage = 'Something went wrong during login.';
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data === 'object') {
          errorMessage = data.message || data.error || data.title || JSON.stringify(data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(`Login Error ${status ? `(${status})` : ''}`, errorMessage);
    } finally {
      setIsLoading(false);
    }
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
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.content}>

                {/* ── Logo ── */}
                <View style={styles.logoSection}>
                  <PropSeekrLogo size={88} theme={type} />

                  {/* FIND. MATCH. CLOSE. tagline */}
                  <View style={styles.taglineRow}>
                    <View style={styles.taglineLine} />
                    <Text style={styles.taglineFind}>{t('loginScreen.taglineFind')}</Text>
                    <Text style={styles.taglineMatch}>{t('loginScreen.taglineMatch')}</Text>
                    <Text style={styles.taglineClose}>{t('loginScreen.taglineClose')}</Text>
                    <View style={[styles.taglineLine, { backgroundColor: Brand.teal }]} />
                  </View>
                </View>

                {/* ── Headline ── */}
                <View style={styles.headlineSection}>
                  <Text style={[styles.headline, { color: colors.textPrimary }]}>{t('loginScreen.headline')}</Text>
                  <Text style={[styles.sub, { color: colors.textSecondary }]}>
                    Connect with other brokers, match properties &amp; requirements,{'\n'}and close deals faster.
                  </Text>
                </View>

                {/* ── Inputs ── */}
                <View style={styles.inputSection}>
                  <View style={[styles.inputWrap, { borderColor: Brand.blueBorder }]}>
                    <LinearGradient
                      colors={type === 'dark' ? ['rgba(37,99,235,0.15)', 'rgba(16,185,129,0.08)'] : ['#FFFFFF', '#FFFFFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.inputInner}
                    >
                      <TextInput
                        testID="login-identifier"
                        style={[styles.phoneInput, { color: colors.textPrimary }]}
                        placeholder="Mobile Number or Email"
                        placeholderTextColor={colors.textDim}
                        value={identifier}
                        onChangeText={setIdentifier}
                        autoCapitalize="none"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 180, animated: true });
                          }, 100);
                        }}
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                      />
                    </LinearGradient>
                  </View>

                  <View style={[styles.inputWrap, { borderColor: Brand.blueBorder }]}>
                    <LinearGradient
                      colors={type === 'dark' ? ['rgba(37,99,235,0.15)', 'rgba(16,185,129,0.08)'] : ['#FFFFFF', '#FFFFFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.inputInner}
                    >
                      <TextInput
                        testID="login-password"
                        ref={passwordInputRef}
                        style={[styles.phoneInput, { color: colors.textPrimary }]}
                        placeholder="Password"
                        placeholderTextColor={colors.textDim}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 220, animated: true });
                          }, 100);
                        }}
                        onSubmitEditing={handleLogin}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialCommunityIcons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={22}
                          color={colors.textDim}
                        />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* CTA */}
                  <TouchableOpacity testID="login-submit" onPress={handleLogin} activeOpacity={0.85} disabled={isLoading}>
                    <LinearGradient
                      colors={['#2563EB', '#1A8CD8', '#10B981']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.ctaBtn, { shadowColor: Brand.blue }]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.ctaBtnText}>{t('loginScreen.loginBtn')}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={[styles.legal, { color: colors.textDim }]}>
                    By continuing, you agree to PropSeekr's{' '}
                    <Text style={styles.legalLink}>{t('loginScreen.terms')}</Text>
                  </Text>
                </View>

                {/* ── Register link ── */}
                <TouchableOpacity
                  style={styles.registerWrap}
                  onPress={() => navigation.navigate('Registration')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                    {t('loginScreen.newHere')} <Text style={styles.registerLink}>{t('loginScreen.createAccount')}</Text>
                  </Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  accentBar: {
    height: 3, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },

  content: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'flex-start', paddingTop: 60 },

  // ── Logo
  logoSection: { alignItems: 'center', marginBottom: 12 },

  // Tagline
  taglineRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 0,
  },
  taglineLine:  { width: 18, height: 1.5, backgroundColor: Brand.blue, marginHorizontal: 6 },
  taglineFind:  { fontSize: 11, fontWeight: '700', color: Brand.blue,  letterSpacing: 1.5 },
  taglineMatch: { fontSize: 11, fontWeight: '700', color: '#4FA3E8',   letterSpacing: 1.5 },
  taglineClose: { fontSize: 11, fontWeight: '700', color: Brand.teal,  letterSpacing: 1.5 },

  // Headline
  headlineSection: { alignItems: 'center', marginBottom: 24 },
  headline: {
    fontSize: 28, fontWeight: '800', 
    textAlign: 'center', letterSpacing: -0.5, lineHeight: 36, marginBottom: 8,
  },
  sub: {
    fontSize: 13.5, textAlign: 'center', lineHeight: 20,
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
