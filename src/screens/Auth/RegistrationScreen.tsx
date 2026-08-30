import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { register } from '../../api/auth';
import { useAppAlert } from '../../components/alerts/AppAlertProvider';

// ── Validation ─────────────────────────────────────────────
const registrationSchema = z.object({
  name:         z.string().min(2, 'Name must be at least 2 characters'),
  mobile:       z.string().regex(/^[0-9]{10}$/, 'Must be a valid 10-digit mobile number'),
  email:        z.string().email('Must be a valid email address'),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  addressLine1: z.string().min(3, 'Address Line 1 is required'),
  addressLine2: z.string().optional(),
  city:         z.string().min(2, 'City is required'),
  state:        z.string().min(2, 'State is required'),
  pincode:      z.string().regex(/^[0-9]{6}$/, 'Must be a valid 6-digit pincode'),
  aadhaar:      z.string().regex(/^[0-9]{12}$/, 'Must be a valid 12-digit Aadhaar number'),
  pan:          z.string().regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, 'Must be a valid 10-character PAN'),
  gst:          z.string().optional(),
  rera:         z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function RegistrationScreen() {
  const { alert: showAlert } = useAppAlert();
  const navigation = useNavigation<any>();
  const { colors, type } = useAppTheme();

  const { control, handleSubmit, formState: { errors } } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '', mobile: '', email: '', password: '',
      addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
      aadhaar: '', pan: '', gst: '', rera: '',
    },
  });

  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setIsLoading(true);
      const payload: any = {
        name: data.name.trim(),
        mobile: data.mobile.trim(),
        email: data.email.trim(),
        password: data.password,
        addressLine1: data.addressLine1.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        pincode: data.pincode.trim(),
        aadharNumber: data.aadhaar.trim(),
        panCard: data.pan.trim()
      };
      
      const response = await register(payload);

      showAlert('Success', response.message || 'Registration successful.');

      if (response.verificationRequired && response.verificationChannel === 'email') {
        navigation.navigate('OTP', { email: data.email });
      } else {
        navigation.navigate('Login');
      }
    } catch (error: any) {
      console.warn('Registration Attempt Failed:', error.response?.data || error.message);
      let errorMessage = 'Something went wrong. Please try again.';
      const resData = error.response?.data;
      if (resData) {
        if (resData.errors && typeof resData.errors === 'object') {
          const firstErrKey = Object.keys(resData.errors)[0];
          if (firstErrKey && Array.isArray(resData.errors[firstErrKey])) {
            errorMessage = resData.errors[firstErrKey][0];
          }
        } else if (resData.message && typeof resData.message === 'string') {
          errorMessage = resData.message;
        } else if (resData.title && typeof resData.title === 'string') {
          errorMessage = resData.title;
        }
      }
      showAlert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      {/* Background */}
      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.5, 1]}
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
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Header ── */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            {/* Mini logo */}
            <View style={{ alignSelf: 'center', marginBottom: 20 }}>
              <PropSeekrLogo size={64} theme={type} />
            </View>

            {/* Headline */}
            <Text style={[styles.headline, { color: colors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>Join India's smartest broker network.</Text>

            {/* ── Step indicator ── */}
            <View style={styles.stepRow}>
              <LinearGradient colors={[Brand.blue, Brand.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.stepActive} />
              <View style={[styles.stepInactive, { backgroundColor: colors.borderFaint }]} />
            </View>

            {/* ── Form ── */}
            <View style={styles.form}>

              {/* Name */}
              <Field label="Full Name *" error={errors.name?.message} colors={colors}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="👤"
                      placeholder="e.g. Rahul Kumar"
                      hasError={!!errors.name}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* Mobile */}
              <Field label="Mobile Number *" error={errors.mobile?.message} colors={colors}>
                <Controller
                  control={control}
                  name="mobile"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🇮🇳 +91"
                      placeholder="9876543210"
                      hasError={!!errors.mobile}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      maxLength={10}
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* Email */}
              <Field label="Email Address *" error={errors.email?.message} colors={colors}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="✉️"
                      placeholder="e.g. user@example.com"
                      hasError={!!errors.email}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* Password */}
              <Field label="Password *" error={errors.password?.message} colors={colors}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🔒"
                      placeholder="Minimum 8 characters"
                      hasError={!!errors.password}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      secureTextEntry
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* Address divider */}
              <SectionDivider title="Office / Address Details" desc="Required for local market discovery and compliance." colors={colors} Brand={Brand} />

              {/* Address Line 1 */}
              <Field label="Address Line 1 *" error={errors.addressLine1?.message} colors={colors}>
                <Controller
                  control={control}
                  name="addressLine1"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="📍"
                      placeholder="e.g. 102, Sun Heights, MG Road"
                      hasError={!!errors.addressLine1}
                      value={value ?? ''}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* Address Line 2 */}
              <Field label="Address Line 2 (Optional)" error={errors.addressLine2?.message} colors={colors}>
                <Controller
                  control={control}
                  name="addressLine2"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🏢"
                      placeholder="e.g. Suite 10, Commercial Tower"
                      value={value ?? ''}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* City & State Row */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="City *" error={errors.city?.message} colors={colors}>
                    <Controller
                      control={control}
                      name="city"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <InputBox
                          prefix="🏙️"
                          placeholder="e.g. Mumbai"
                          hasError={!!errors.city}
                          value={value ?? ''}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          colors={colors}
                          Brand={Brand}
                        />
                      )}
                    />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="State *" error={errors.state?.message} colors={colors}>
                    <Controller
                      control={control}
                      name="state"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <InputBox
                          prefix="🗺️"
                          placeholder="e.g. Maharashtra"
                          hasError={!!errors.state}
                          value={value ?? ''}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          colors={colors}
                          Brand={Brand}
                        />
                      )}
                    />
                  </Field>
                </View>
              </View>

              {/* Pincode */}
              <Field label="Pincode *" error={errors.pincode?.message} colors={colors}>
                <Controller
                  control={control}
                  name="pincode"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="📮"
                      placeholder="e.g. 400053"
                      hasError={!!errors.pincode}
                      value={value ?? ''}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      maxLength={6}
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* KYC divider */}
              <SectionDivider title="KYC Verification" desc="Both Aadhaar and PAN are mandatory for verified brokers." colors={colors} Brand={Brand} />

              {/* Aadhaar */}
              <Field label="Aadhaar Number *" error={errors.aadhaar?.message} colors={colors}>
                <Controller
                  control={control}
                  name="aadhaar"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🆔"
                      placeholder="12-digit Aadhaar"
                      hasError={!!errors.aadhaar}
                      value={value ?? ''}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      maxLength={12}
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* PAN */}
              <Field label="PAN Number *" error={errors.pan?.message} colors={colors}>
                <Controller
                  control={control}
                  name="pan"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🗂️"
                      placeholder="10-character PAN"
                      hasError={!!errors.pan}
                      value={value ?? ''}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="characters"
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* Business divider */}
              <SectionDivider title="Business Details" desc="Optional — helps build broker trust." colors={colors} Brand={Brand} />

              {/* GST */}
              <Field label="GST Number" colors={colors}>
                <Controller
                  control={control}
                  name="gst"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🧾"
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      value={value ?? ''}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="characters"
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* RERA */}
              <Field label="RERA Registration Number" colors={colors}>
                <Controller
                  control={control}
                  name="rera"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🏅"
                      placeholder="RERA Registration ID"
                      value={value ?? ''}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="characters"
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* CTA */}
              <TouchableOpacity onPress={handleSubmit(onSubmit)} activeOpacity={0.85} style={{ marginTop: 8 }} disabled={isLoading}>
                <LinearGradient
                  colors={[Brand.blue, '#1A8CD8', Brand.teal]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.ctaBtn, { shadowColor: Brand.blue }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.ctaBtnText}>Create My Account →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Login link */}
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.goBack()}
                activeOpacity={0.75}
              >
                <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
                  Already have an account?{' '}
                  <Text style={styles.loginLinkBold}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────

function Field({
  label,
  error,
  children,
  colors,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>}
    </View>
  );
}

function InputBox({
  prefix,
  placeholder,
  hasError,
  value,
  onBlur,
  onChangeText,
  keyboardType,
  maxLength,
  autoCapitalize,
  secureTextEntry,
  colors,
  Brand,
}: {
  prefix?: string;
  placeholder: string;
  hasError?: boolean;
  value: string;
  onBlur: () => void;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  colors: any;
  Brand: any;
}) {
  return (
    <View
      style={[
        styles.inputBox,
        { backgroundColor: colors.inputBg, borderColor: Brand.blueBorder },
        hasError && [styles.inputBoxError, { borderColor: colors.errorText, backgroundColor: colors.errorFaint }],
      ]}
    >
      {prefix && (
        <>
          <Text style={[styles.inputPrefix, { color: colors.textPrimary }]}>{prefix}</Text>
          <View style={[styles.inputDivider, { backgroundColor: Brand.blueBorder }]} />
        </>
      )}
      <TextInput
        style={[styles.inputText, { color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        value={value}
        onBlur={onBlur}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? 'none'}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

function SectionDivider({ title, desc, colors, Brand }: { title: string; desc?: string; colors: any; Brand: any }) {
  return (
    <View style={styles.sectionDividerWrap}>
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.sectionDividerLine}
      />
      <Text style={styles.sectionTitle}>{title}</Text>
      {desc && <Text style={[styles.sectionDesc, { color: colors.textDim }]}>{desc}</Text>}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 8 },

  accentBar: {
    height: 3,
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },

  backBtn: { marginTop: 8, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: '#10B981', fontSize: 15, fontWeight: '600' },



  headline: {
    fontSize: 30, fontWeight: '800',
    letterSpacing: -0.5, marginBottom: 6,
  },
  sub: {
    fontSize: 14, marginBottom: 20,
  },

  stepRow: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  stepActive: { flex: 2, height: 4, borderRadius: 2 },
  stepInactive: { flex: 1, height: 4, borderRadius: 2 },

  form: {},

  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },

  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5,
    borderRadius: 14, paddingHorizontal: 16, height: 54,
  },
  inputBoxError: {
  },
  inputPrefix: { fontSize: 14, fontWeight: '600' },
  inputDivider: { width: 1, height: 18 },
  inputText: { flex: 1, fontSize: 15, padding: 0 },

  errorText: { fontSize: 12, marginTop: 5, fontWeight: '500' },

  sectionDividerWrap: { marginVertical: 20 },
  sectionDividerLine: { height: 1.5, borderRadius: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#10B981', marginBottom: 3 },
  sectionDesc: { fontSize: 12 },

  ctaBtn: {
    borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  loginLink: { alignItems: 'center', paddingVertical: 20 },
  loginLinkText: { fontSize: 14 },
  loginLinkBold: { color: '#10B981', fontWeight: '700' },
});
