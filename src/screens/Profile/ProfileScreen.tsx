import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { useAuthStore } from '../../store/authStore';

// ── Validation ─────────────────────────────────────────────
const profileSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  companyGst: z.string().optional(),
  companyAddress: z.string().min(5, 'Address is too short'),
  email: z.string().email('Must be a valid email address'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const logout = useAuthStore(s => s.logout);
  const { colors, type, isDark } = useAppTheme();

  // Local state for photo just to show UI interaction
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: 'PropSeekr Realty',
      companyGst: '23ABCDE1234F1Z5',
      companyAddress: 'Vijay Nagar, Indore, MP',
      email: 'broker@propseekr.in',
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    console.log('Saved Profile Data:', data);
    // TODO: Call API to save profile updates
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
            {/* Header */}
            <Text style={[styles.headline, { color: colors.textPrimary }]}>My Profile</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>Manage your broker details</Text>

            {/* Profile Photo Section */}
            <View style={styles.photoContainer}>
              <View style={[styles.photoWrap, { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg }]}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <Text style={{ fontSize: 40 }}>👤</Text>
                )}
                <TouchableOpacity 
                  style={styles.editPhotoBadge} 
                  activeOpacity={0.8}
                  onPress={() => console.log('Open image picker')}
                >
                  <Text style={{ fontSize: 12 }}>📷</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email */}
              <Field label="Email Address" error={errors.email?.message} colors={colors}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="✉️"
                      placeholder="e.g. name@company.com"
                      hasError={!!errors.email}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              <SectionDivider title="COMPANY DETAILS" colors={colors} Brand={Brand} />

              {/* Company Name */}
              <Field label="Company Name *" error={errors.companyName?.message} colors={colors}>
                <Controller
                  control={control}
                  name="companyName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🏢"
                      placeholder="e.g. PropSeekr Realty"
                      hasError={!!errors.companyName}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* GST */}
              <Field label="Company GST (Optional)" error={errors.companyGst?.message} colors={colors}>
                <Controller
                  control={control}
                  name="companyGst"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="🧾"
                      placeholder="e.g. 23ABCDE..."
                      hasError={!!errors.companyGst}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="characters"
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* Address */}
              <Field label="Company Address *" error={errors.companyAddress?.message} colors={colors}>
                <Controller
                  control={control}
                  name="companyAddress"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputBox
                      prefix="📍"
                      placeholder="e.g. Vijay Nagar, Indore"
                      hasError={!!errors.companyAddress}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      colors={colors}
                      Brand={Brand}
                    />
                  )}
                />
              </Field>

              {/* Save Button */}
              <TouchableOpacity onPress={handleSubmit(onSubmit)} activeOpacity={0.85} style={{ marginTop: 10 }}>
                <LinearGradient
                  colors={[Brand.blue, '#1A8CD8', Brand.teal]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.ctaBtn, { shadowColor: Brand.blue }]}
                >
                  <Text style={styles.ctaBtnText}>
                    {isDirty ? 'Save Changes' : 'Saved'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity onPress={logout} activeOpacity={0.75} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── Form Helpers (Reusable internal components) ───────────────

function Field({ label, error, children, colors }: { label: string; error?: string; children: React.ReactNode; colors: any }) {
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
  colors: any;
  Brand: any;
}) {
  return (
    <View
      style={[
        styles.inputBox,
        { backgroundColor: colors.inputBg, borderColor: Brand.blueBorder },
        hasError && { borderColor: colors.errorText, backgroundColor: colors.errorFaint },
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
  scrollContent: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 20 },

  accentBar: {
    height: 3,
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },

  headline: {
    fontSize: 30, fontWeight: '800',
    letterSpacing: -0.5, marginBottom: 6,
  },
  sub: {
    fontSize: 14, marginBottom: 20,
  },

  photoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#050D1F', // Gives it a cutout look against dark background
  },

  form: {},

  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },

  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5,
    borderRadius: 14, paddingHorizontal: 16, height: 54,
  },
  inputPrefix: { fontSize: 14, fontWeight: '600' },
  inputDivider: { width: 1, height: 18 },
  inputText: { flex: 1, fontSize: 15, padding: 0 },

  errorText: { fontSize: 12, marginTop: 5, fontWeight: '500' },

  sectionDividerWrap: { marginVertical: 24 },
  sectionDividerLine: { height: 1.5, borderRadius: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#10B981', marginBottom: 3, letterSpacing: 1.5 },
  sectionDesc: { fontSize: 12 },

  ctaBtn: {
    borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  logoutBtn: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '700',
  },
});
