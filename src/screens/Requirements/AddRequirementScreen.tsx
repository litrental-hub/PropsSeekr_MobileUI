import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { addRequirement } from '../../api/requirements';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { useAuthStore } from '../../store/authStore';
import { PROPERTY_TYPES, BHK_OPTIONS } from '../../constants';
import Geolocation from '@react-native-community/geolocation';
import { requestLocationPermissions } from '../../utils/location';

// ─── Constants ────────────────────────────────────────────────────────────────


const SIZE_UNITS: { label: string; value: string }[] = [
  { label: 'Sq Ft (Square Feet)', value: 'Sq Ft' },
  { label: 'Sq Yd (Square Yard)', value: 'Sq Yd' },
  { label: 'Sq M (Square Metre)', value: 'Sq M' },
  { label: 'Acre', value: 'Acre' },
  { label: 'Hectare', value: 'Hectare' },
];
const FURNISHING_OPTIONS = [
  { label: 'Furnished', value: 'FURNISHED' },
  { label: 'Semi-Furnished', value: 'SEMI_FURNISHED' },
  { label: 'Unfurnished', value: 'UNFURNISHED' },
] as const;
const FACING_OPTIONS = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateDDMMYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10);
}

function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

// ─── Pill Selector Component ──────────────────────────────────────────────────

function PillGroup<T extends string>({
  options,
  selected,
  onSelect,
  labelKey,
  valueKey,
  colors,
}: {
  options: readonly T[] | readonly { label: string; value: T }[];
  selected: T | '';
  onSelect: (v: T) => void;
  labelKey?: never;
  valueKey?: never;
  colors: any;
}) {
  const isObjArray = typeof options[0] === 'object';
  return (
    <View style={pillStyles.wrap}>
      {(options as any[]).map((opt: any) => {
        const label = isObjArray ? opt.label : opt;
        const value = isObjArray ? opt.value : opt;
        const isActive = selected === value;
        return (
          <TouchableOpacity
            key={value}
            activeOpacity={0.8}
            onPress={() => onSelect(value)}
            style={[
              pillStyles.pill,
              { borderColor: isActive ? Brand.teal : colors.borderFaint },
              isActive && { backgroundColor: Brand.teal },
            ]}
          >
            <Text style={[pillStyles.pillText, { color: isActive ? '#FFF' : colors.textSecondary }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pillStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillText: { fontSize: 13, fontWeight: '600' },
});

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.line} />
      <Text style={[sectionStyles.label, { color: colors.textSecondary }]}>{title}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(37,99,235,0.15)' },
  label: { marginHorizontal: 10, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddRequirementScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark, type } = useAppTheme();
  const user = useAuthStore(s => s.user);

  // ── Mandatory state ──────────────────────────────────────────────────────
  const [senderName, setSenderName] = useState(user?.name || '');
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [propertyType, setPropertyType] = useState<string>('');
  const [location, setLocation] = useState('');

  // ── Optional state ───────────────────────────────────────────────────────
  const [configuration, setConfiguration] = useState<string>('');
  const [size, setSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState<string>('Sq Ft');
  const [price, setPrice] = useState('');
  const [facing, setFacing] = useState<string>('');
  const [furnishing, setFurnishing] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');

  const route = useRoute<any>();
  const editData = route.params?.initialData;

  useEffect(() => {
    if (editData) {
      if (editData.locality || editData.location || editData.city) {
        let loc = (editData.locality || editData.location || editData.city || '').toString();
        // Clean up location if it contains bullets like " · 5 km radius"
        loc = loc.split('·')[0].trim();
        setLocation(loc);
      }
      if (editData.propertyType || editData.category) {
        setPropertyType(editData.propertyType || editData.category || 'Flat / Apartment');
      } else if (editData.lookingFor || editData.description) {
        const text = (editData.lookingFor || editData.description || '').toLowerCase();
        if (text.includes('flat') || text.includes('apartment') || text.includes('studio') || text.includes('bhk')) {
          setPropertyType('Flat / Apartment');
        } else if (text.includes('house') || text.includes('villa') || text.includes('bungalow')) {
          setPropertyType('Independent House');
        } else if (text.includes('plot') || text.includes('land')) {
          setPropertyType('Plot / Land');
        } else if (text.includes('office') || text.includes('shop')) {
          setPropertyType('Commercial Office');
        } else {
          setPropertyType('Flat / Apartment');
        }
      }
      if (editData.configuration || editData.bhk) {
        setConfiguration((editData.configuration || editData.bhk || '').toString());
      } else if (editData.lookingFor || editData.description) {
        const text = (editData.lookingFor || editData.description || '').toString();
        const match = text.match(/\b(\d+)\s*(BHK|RK)\b/i);
        if (match) setConfiguration(`${match[1]} ${match[2].toUpperCase()}`);
      }
      if (editData.budgetMax || editData.budget || editData.price) {
        const rawBudget = (editData.budgetMax || editData.budget || editData.price || '').toString();
        const numOnly = rawBudget.replace(/[^0-9.]/g, '');
        if (numOnly) {
          setPrice(rawBudget.includes('Lakhs') || rawBudget.includes('L') || rawBudget.includes('Cr') ? rawBudget : numOnly);
        } else {
          setPrice(rawBudget);
        }
      }
      if (editData.minimumSize || editData.size) {
        setSize((editData.minimumSize || editData.size || '').toString());
      }
      if (editData.description || editData.lookingFor || editData.additionalNotes) {
        setDescription((editData.description || editData.lookingFor || editData.additionalNotes || '').toString());
      }
      if (editData.projectName || editData.buildingName || editData.title) {
        setProjectName((editData.projectName || editData.buildingName || editData.title || '').toString());
      }
    }
  }, [editData]);

  // ── Validation errors ────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Submission state ─────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Unit dropdown ────────────────────────────────────────────────────────
  const [sizeUnitDropdownOpen, setSizeUnitDropdownOpen] = useState(false);

  // ── Refs for keyboard next ───────────────────────────────────────────────
  const contactRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  const projectRef = useRef<TextInput>(null);
  const sizeRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!senderName.trim()) newErrors.senderName = 'Name is required.';
    const normalizedPhone = normalizePhone(contactNumber);
    if (!isValidIndianPhone(normalizedPhone)) {
      newErrors.contactNumber = 'Enter a valid 10-digit mobile number (starts with 6–9).';
    }
    if (!propertyType) newErrors.propertyType = 'Please select a property type.';
    if (!location.trim()) newErrors.location = 'Location is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    Keyboard.dismiss();
    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setIsSubmitting(true);
    const hasPerm = await requestLocationPermissions();
    if (!hasPerm) {
      setIsSubmitting(false);
      Alert.alert('Location Permission Denied', 'Location permission is required to obtain valid GPS coordinates for matching. Please grant access in device settings.');
      return;
    }

    let lat = 0;
    let lng = 0;
    try {
      const coords = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      });
      lat = coords.latitude;
      lng = coords.longitude;
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('GPS Unavailable', 'Could not obtain valid GPS coordinates. Please ensure GPS/location services are turned on and try again.');
      return;
    }

    if (!lat || !lng || (lat === 0 && lng === 0)) {
      setIsSubmitting(false);
      Alert.alert('Invalid Coordinates', 'Obtained invalid GPS coordinates. Please check your GPS signal and try again.');
      return;
    }

    const normalizedPhone = normalizePhone(contactNumber);
    const payload: Record<string, any> = {
      transactionType: 'RENTAL', // Defaulting for now
      category: 'Residential',
      description: description.trim() || undefined,
      minimumSize: size ? Number(size) : undefined,
      budgetMax: price ? Number(price) : undefined,
      city: location.trim().split(',').pop()?.trim() || 'Unknown',
      locality: location.trim(),
      lat,
      lng,
      radiusKm: 5.0,
      propertyType,
      configuration,
    };

    try {
      const data = await addRequirement(payload);

      if (data) {
        Alert.alert(
          '✅ Requirement Submitted!',
          'Requirement submitted successfully. Matching has started.',
          [{ text: 'Done', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Not Saved', 'Requirement could not be saved. Please try again.');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Network error. Please check your connection.';
      Alert.alert(`Submission Failed`, msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Field component ───────────────────────────────────────────────────────

  function FieldWrap({ label, required, error, children }: {
    label: string; required?: boolean; error?: string; children: React.ReactNode;
  }) {
    return (
      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
          {required && <Text style={{ color: '#EF4444' }}> *</Text>}
        </Text>
        {children}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  function inputStyle(hasError: boolean) {
    return [
      styles.input,
      {
        backgroundColor: colors.inputBg,
        color: colors.textPrimary,
        borderColor: hasError ? '#EF4444' : Brand.blueBorder,
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      {/* Background gradient */}
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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Requirement</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Post what your client is looking for</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              {/* ── MANDATORY FIELDS ── */}
              <SectionHeader title="Basic Details  (Required)" colors={colors} />

              <FieldWrap label="Your Name" required error={errors.senderName}>
                <TextInput
                  style={inputStyle(!!errors.senderName)}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={colors.textDim}
                  value={senderName}
                  onChangeText={v => { setSenderName(v); if (errors.senderName) setErrors(p => ({ ...p, senderName: '' })); }}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => contactRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </FieldWrap>

              <FieldWrap label="Contact Number" required error={errors.contactNumber}>
                <TextInput
                  ref={contactRef}
                  style={inputStyle(!!errors.contactNumber)}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textDim}
                  value={contactNumber}
                  onChangeText={v => { setContactNumber(v); if (errors.contactNumber) setErrors(p => ({ ...p, contactNumber: '' })); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={() => locationRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </FieldWrap>

              <FieldWrap label="Property Type" required error={errors.propertyType}>
                <PillGroup
                  options={PROPERTY_TYPES}
                  selected={propertyType as any}
                  onSelect={v => { setPropertyType(v); if (errors.propertyType) setErrors(p => ({ ...p, propertyType: '' })); }}
                  colors={colors}
                />
              </FieldWrap>

              <FieldWrap label="Preferred Location" required error={errors.location}>
                <TextInput
                  ref={locationRef}
                  style={inputStyle(!!errors.location)}
                  placeholder="e.g. Vijay Nagar, Indore"
                  placeholderTextColor={colors.textDim}
                  value={location}
                  onChangeText={v => { setLocation(v); if (errors.location) setErrors(p => ({ ...p, location: '' })); }}
                  returnKeyType="next"
                  onSubmitEditing={() => projectRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </FieldWrap>

              {/* ── OPTIONAL FIELDS ── */}
              <SectionHeader title="More Details  (Optional)" colors={colors} />

              <FieldWrap label="Configuration">
                <PillGroup
                  options={BHK_OPTIONS}
                  selected={configuration as any}
                  onSelect={setConfiguration}
                  colors={colors}
                />
              </FieldWrap>

              <FieldWrap label="Furnishing Preference">
                <PillGroup
                  options={FURNISHING_OPTIONS}
                  selected={furnishing as any}
                  onSelect={setFurnishing}
                  colors={colors}
                />
              </FieldWrap>

              <FieldWrap label="Preferred Facing">
                <PillGroup
                  options={FACING_OPTIONS as any}
                  selected={facing as any}
                  onSelect={setFacing}
                  colors={colors}
                />
              </FieldWrap>

              {/* Size row */}
              <FieldWrap label="Required Area">
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  {/* Numeric area input */}
                  <TextInput
                    ref={sizeRef}
                    style={[inputStyle(false), { flex: 1 }]}
                    placeholder="e.g. 1200"
                    placeholderTextColor={colors.textDim}
                    value={size}
                    onChangeText={setSize}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => priceRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  {/* Unit dropdown trigger */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { Keyboard.dismiss(); setSizeUnitDropdownOpen(true); }}
                    style={[
                      styles.dropdownTrigger,
                      { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg },
                    ]}
                  >
                    <Text style={[styles.dropdownTriggerText, { color: colors.textPrimary }]}>{sizeUnit}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Unit dropdown modal */}
                <Modal
                  visible={sizeUnitDropdownOpen}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setSizeUnitDropdownOpen(false)}
                >
                  <TouchableWithoutFeedback onPress={() => setSizeUnitDropdownOpen(false)}>
                    <View style={styles.modalOverlay}>
                      <TouchableWithoutFeedback>
                        <View style={[
                          styles.dropdownMenu,
                          { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder },
                        ]}>
                          <Text style={[styles.dropdownMenuTitle, { color: colors.textSecondary }]}>Select Unit</Text>
                          {SIZE_UNITS.map(u => {
                            const isSelected = sizeUnit === u.value;
                            return (
                              <TouchableOpacity
                                key={u.value}
                                activeOpacity={0.8}
                                onPress={() => { setSizeUnit(u.value); setSizeUnitDropdownOpen(false); }}
                                style={[
                                  styles.dropdownItem,
                                  { borderBottomColor: colors.borderFaint },
                                  isSelected && { backgroundColor: 'rgba(16,185,129,0.12)' },
                                ]}
                              >
                                <Text style={[styles.dropdownItemText, { color: isSelected ? Brand.teal : colors.textPrimary }]}>
                                  {u.label}
                                </Text>
                                {isSelected && (
                                  <MaterialCommunityIcons name="check-circle" size={18} color={Brand.teal} />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </FieldWrap>

              <FieldWrap label="Budget (₹)">
                <TextInput
                  ref={priceRef}
                  style={inputStyle(false)}
                  placeholder="e.g. 5000000"
                  placeholderTextColor={colors.textDim}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => projectRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {!!price && Number(price) > 0 && (
                  <Text style={[styles.priceHint, { color: Brand.teal }]}>
                    ≈ ₹{(Number(price) / 100000).toFixed(1)} L
                  </Text>
                )}
              </FieldWrap>

              <FieldWrap label="Project / Society Name">
                <TextInput
                  ref={projectRef}
                  style={inputStyle(false)}
                  placeholder="e.g. Omaxe Hills (optional)"
                  placeholderTextColor={colors.textDim}
                  value={projectName}
                  onChangeText={setProjectName}
                  returnKeyType="next"
                  onSubmitEditing={() => descRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </FieldWrap>

              <FieldWrap label="Additional Notes">
                <TextInput
                  ref={descRef}
                  style={[inputStyle(false), styles.textArea]}
                  placeholder="Any specific requirements, preferred floor, etc."
                  placeholderTextColor={colors.textDim}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </FieldWrap>

              {/* ── SUBMIT ── */}
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={isSubmitting}
                style={{ marginTop: 8, marginBottom: 24 }}
              >
                <LinearGradient
                  colors={['#2563EB', '#1A8CD8', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Requirement →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  accentBar: { height: 3, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 12, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 5, marginLeft: 2 },
  priceHint: { fontSize: 12, fontWeight: '600', marginTop: 5, marginLeft: 2 },

  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  // ── Dropdown styles ──
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    minWidth: 88,
    justifyContent: 'space-between',
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dropdownMenu: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownMenuTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
