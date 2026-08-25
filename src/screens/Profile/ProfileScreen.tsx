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
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppTheme, Brand, BtnStyle } from '../../theme/useAppTheme';
import { Card, Shadow, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, updateProfile, uploadProfilePhoto } from '../../api/profile';

// ── Validation ─────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().optional().or(z.literal('')),
  companyGst: z.string().optional(),
  companyAddress: z.string().optional().or(z.literal('')),
  email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const logout = useAuthStore(s => s.logout);
  const { colors, type, isDark } = useAppTheme();
  const user = useAuthStore(s => s.user);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();

  // Local state for photo just to show UI interaction
  const [photoUrl, setPhotoUrl] = useState<string>('/uploads/profile-photos/default-avatar.png');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      companyName: '',
      companyGst: '',
      companyAddress: '',
      email: '',
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          if (!user?.brokerId) {
            console.error('No brokerId found');
            return;
          }
          const targetId = user.brokerId;
          const profile = await getProfile(targetId);
          if (profile) {
            reset({
              name: profile.name || profile.fullName || '',
              companyName: profile.companyName || (profile as any).agencyName || (profile as any).brokerage_name || '',
              companyGst: profile.companyGst || (profile as any).gstNumber || '',
              companyAddress: profile.companyAddress || (profile as any).officeAddress || '',
              email: profile.email || '',
            });
            if (profile.profilePhotoUrl || (profile as any).avatarUrl) {
              const url = profile.profilePhotoUrl || (profile as any).avatarUrl;
              setPhotoUrl(url);
              if (url && url !== '/uploads/profile-photos/default-avatar.png') {
                setPhotoUri(url);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch profile:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }, [reset, user?.id])
  );

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      const targetId = user?.brokerId || user?.id || '';
      await updateProfile(targetId, {
        name: data.name,
        fullName: data.name,
        email: data.email,
        profilePhotoUrl: photoUrl || '/uploads/profile-photos/default-avatar.png',
        companyName: data.companyName,
        agencyName: data.companyName,
        companyGst: data.companyGst,
        gstNumber: data.companyGst,
        companyAddress: data.companyAddress,
        officeAddress: data.companyAddress,
      });
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to update profile.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const processAndUploadPhoto = async (uri: string, fileName: string, fileType: string) => {
    setPhotoUri(uri);
    try {
      setSaving(true);
      const res = await uploadProfilePhoto(uri, fileName, fileType);
      const newUrl = res?.profilePhotoUrl || res?.url || (res as any)?.data?.profilePhotoUrl || (res as any)?.data?.url || uri;
      setPhotoUrl(newUrl);

      // Save updated photo to profile
      const currentValues = control._formValues;
      const targetId = user?.brokerId || user?.id || '';
      await updateProfile(targetId, {
        name: currentValues.name || 'User',
        email: currentValues.email || '',
        profilePhotoUrl: newUrl,
        companyName: currentValues.companyName || '',
        agencyName: currentValues.companyName || '',
      });
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (err: any) {
      console.log('Upload error:', err?.message, err?.response?.data);
      setPhotoUrl(uri);
      Alert.alert('Notice', 'Photo updated locally! Tap "Save Profile" to save all profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = () => {
    Alert.alert(
      'Update Profile Photo',
      'Select an option to pick a photo:',
      [
        {
          text: 'Take Photo (Camera)',
          onPress: async () => {
            try {
              if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.CAMERA,
                  {
                    title: 'Camera Permission',
                    message: 'PropSeekr needs access to your camera to capture a profile avatar.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                  }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                  Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
                  return;
                }
              }
              const res = await launchCamera({ mediaType: 'photo', quality: 0.8, cameraType: 'front', saveToPhotos: false });
              if (res.didCancel || res.errorCode || !res.assets || res.assets.length === 0) {
                if (res.errorMessage) Alert.alert('Error', res.errorMessage);
                return;
              }
              const asset = res.assets[0];
              if (asset.uri) {
                await processAndUploadPhoto(asset.uri, asset.fileName || 'profile_photo.jpg', asset.type || 'image/jpeg');
              }
            } catch (err: any) {
              console.log('Camera error:', err?.message);
              Alert.alert('Error', 'Could not launch camera: ' + (err?.message || 'Unknown error'));
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
              if (res.didCancel || res.errorCode || !res.assets || res.assets.length === 0) {
                if (res.errorMessage) Alert.alert('Error', res.errorMessage);
                return;
              }
              const asset = res.assets[0];
              if (asset.uri) {
                await processAndUploadPhoto(asset.uri, asset.fileName || 'profile_photo.jpg', asset.type || 'image/jpeg');
              }
            } catch (err: any) {
              console.log('Gallery error:', err?.message);
              Alert.alert('Error', 'Could not open gallery: ' + (err?.message || 'Unknown error'));
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      {/* Removed the dark background gradient, using safe area directly with a clean background */}

      {/* Top accent bar */}
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.navy }]} edges={['top', 'bottom']}>
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
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.headline, { color: colors.textPrimary }]}>{t('profile.myProfile', 'My Profile')}</Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>{t('profile.manageDetails', 'Manage your broker details')}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
                <MaterialCommunityIcons name="cog" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Profile Photo Section */}
            <View style={styles.photoContainer}>
              <View style={[styles.photoWrap, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint }]}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <MaterialCommunityIcons name="account" size={56} color={Brand.blue} />
                )}
                <TouchableOpacity
                  style={styles.editPhotoBadge}
                  activeOpacity={0.8}
                  onPress={handlePhotoChange}
                >
                  <MaterialCommunityIcons name="camera" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Broker Name */}
              <Field label="Broker Name *" error={errors.name?.message}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                     <InputBox
                       iconName="account"
                       placeholder="e.g. Test User"
                       hasError={!!errors.name}
                       value={value}
                       onBlur={onBlur}
                       onChangeText={onChange}
                     />
                  )}
                />
              </Field>

              {/* Email */}
              <Field label={t('profile.emailAddress', 'Email Address')} error={errors.email?.message}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                     <InputBox
                       iconName="email-outline"
                       placeholder="e.g. name@company.com"
                       hasError={!!errors.email}
                       value={value}
                       onBlur={onBlur}
                       onChangeText={onChange}
                       keyboardType="email-address"
                     />
                  )}
                />
              </Field>

              <SectionDivider title={t('profile.companyDetails', 'COMPANY DETAILS')} Brand={Brand} />

              {/* Company Name */}
              <Field label={t('profile.companyName', 'Company Name *')} error={errors.companyName?.message}>
                <Controller
                  control={control}
                  name="companyName"
                  render={({ field: { onChange, onBlur, value } }) => (
                     <InputBox
                       iconName="office-building"
                       placeholder="e.g. PropSeekr Realty"
                       hasError={!!errors.companyName}
                       value={value}
                       onBlur={onBlur}
                       onChangeText={onChange}
                     />
                  )}
                />
              </Field>

              {/* GST */}
              <Field label={t('profile.companyGst', 'Company GST (Optional)')} error={errors.companyGst?.message}>
                <Controller
                  control={control}
                  name="companyGst"
                  render={({ field: { onChange, onBlur, value } }) => (
                     <InputBox
                       iconName="receipt"
                       placeholder="e.g. 23ABCDE..."
                       hasError={!!errors.companyGst}
                       value={value ?? ''}
                       onBlur={onBlur}
                       onChangeText={onChange}
                       autoCapitalize="characters"
                     />
                  )}
                />
              </Field>

              {/* Address */}
              <Field label={t('profile.companyAddress', 'Company Address *')} error={errors.companyAddress?.message}>
                <Controller
                  control={control}
                  name="companyAddress"
                  render={({ field: { onChange, onBlur, value } }) => (
                     <InputBox
                       iconName="map-marker-outline"
                       placeholder="e.g. Vijay Nagar, Indore"
                       hasError={!!errors.companyAddress}
                       value={value}
                       onBlur={onBlur}
                       onChangeText={onChange}
                     />
                  )}
                />
              </Field>

              {/* Save Button */}
              <TouchableOpacity onPress={handleSubmit(onSubmit)} activeOpacity={0.85} style={{ marginTop: 24 }} disabled={saving || loading}>
                <LinearGradient
                  colors={[Brand.blue, '#1A8CD8', Brand.teal]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.ctaBtn, { shadowColor: Brand.blue }]}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.ctaBtnText}>
                      {isDirty ? t('profile.saveChanges') : t('profile.saved')}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity testID="profile-logout" onPress={logout} activeOpacity={0.75} style={[styles.logoutBtn, { backgroundColor: colors.errorFaint, borderColor: colors.errorText }]}>
                <Text style={[styles.logoutText, { color: colors.errorText }]}>{t('profile.logout')}</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── Form Helpers (Reusable internal components) ───────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>}
    </View>
  );
}

function InputBox({
  iconName,
  placeholder,
  hasError,
  value,
  onBlur,
  onChangeText,
  keyboardType,
  maxLength,
  autoCapitalize,
}: {
  iconName?: string;
  placeholder: string;
  hasError?: boolean;
  value: string;
  onBlur: () => void;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: any;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.inputBox, { backgroundColor: colors.cardBgLight, borderColor: colors.borderFaint }, hasError && { borderColor: colors.errorText, backgroundColor: colors.errorFaint }]}>
      {iconName && (
        <View style={styles.inputIconBox}>
          <MaterialCommunityIcons name={iconName} size={22} color={Brand.blue} />
        </View>
      )}
      <View style={[styles.inputDivider, { backgroundColor: colors.borderFaint }]} />
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

function SectionDivider({ title, desc, Brand }: { title: string; desc?: string; Brand: any }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionDividerWrap}>
      <View style={styles.sectionDividerLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {desc && <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>{desc}</Text>}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },

  accentBar: {
    height: 4,
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },

  headerRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
  },
  headline: {
    fontSize: FontSize.h1,      // 28dp — H1 token
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: {
    fontSize: FontSize.body,    // 14dp — body token
    color: '#64748B',
  },
  settingsBtn: {
    padding: 8,
  },

  photoContainer: {
    alignItems: 'center',
    marginVertical: 12,
    marginBottom: 32,
  },
  photoWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: Brand.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Brand.teal,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  form: {},

  fieldWrap: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },

  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Card.radius,  // 16dp — standardised token
    height: 56,
    paddingHorizontal: 8,
  },
  inputBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    padding: 0, // override android default padding
  },
  errorText: { fontSize: FontSize.caption, marginTop: 6, fontWeight: FontWeight.medium, color: '#EF4444' },

  sectionDividerWrap: { marginTop: Spacing.md, marginBottom: Spacing.xxl },
  sectionDividerLine: { height: 1.5, backgroundColor: Brand.teal, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.h2, fontWeight: '800', color: Brand.teal, letterSpacing: 1.2 },
  sectionDesc: { fontSize: FontSize.caption, color: '#64748B' },

  ctaBtn: {
    borderRadius: Radius.lg,  // 16dp token
    height: 56,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.teal,
  },
  ctaBtnText: { fontSize: FontSize.cardTitle, fontWeight: FontWeight.bold, color: '#FFFFFF', letterSpacing: 0.3 },

  logoutBtn: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
