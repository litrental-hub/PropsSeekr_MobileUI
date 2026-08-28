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
import { PROPERTY_TYPES, BHK_OPTIONS } from '../../constants';
import { forwardGeocode, reverseGeocode } from '../../utils/location';

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

function propertyCategory(propertyType: string): string {
  if (propertyType.startsWith('Commercial') || propertyType === 'Warehouse') return 'COMMERCIAL';
  if (propertyType === 'Plot / Land') return 'LAND';
  return 'RESIDENTIAL';
}

function backendPropertyType(propertyType: string): string {
  const values: Record<string, string> = {
    'Flat / Apartment': 'APARTMENT',
    'Independent House': 'INDEPENDENT_HOUSE',
    Villa: 'BUNGALOW',
    'Plot / Land': 'PLOT',
    'Commercial Office': 'OFFICE',
    'Commercial Shop': 'SHOP',
    Warehouse: 'WAREHOUSE',
    'PG / Hostel': 'PG',
  };
  return values[propertyType] ?? propertyType.trim().toUpperCase().replace(/[ /]+/g, '_');
}

function areaInSquareFeet(value: string, unit: string): number {
  const factors: Record<string, number> = {
    'Sq Ft': 1,
    'Sq Yd': 9,
    'Sq M': 10.7639,
    Acre: 43560,
    Hectare: 107639,
  };
  return Math.round(Number(value) * (factors[unit] ?? 1));
}

// ─── Pill Selector Component ──────────────────────────────────────────────────

function PillGroup<T extends string>({
  options,
  selected,
  onSelect,
  colors,
}: {
  options: readonly T[] | readonly { label: string; value: T }[];
  selected: T | '';
  onSelect: (v: T) => void;
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

// ─── Field component ────────────────────────────────────────────────────────

function FieldWrap({ label, required, error, children, colors }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; colors: any;
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

function getInputStyle(hasError: boolean, colors: any) {
  return [
    styles.input,
    {
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
      borderColor: hasError ? '#EF4444' : Brand.blueBorder,
    },
  ];
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddRequirementScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useAppTheme();
  // ── Mandatory state ──────────────────────────────────────────────────────
  const [propertyType, setPropertyType] = useState<string>('');
  const [location, setLocation] = useState('');
  const [listingType, setListingType] = useState<string>('RENT');

  // ── Optional state ───────────────────────────────────────────────────────
  const [configuration, setConfiguration] = useState<string>('');
  const [customConfiguration, setCustomConfiguration] = useState<string>('');
  const [size, setSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState<string>('Sq Ft');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [budgetType, setBudgetType] = useState<'FIXED' | 'FLEXIBLE' | 'NOBUDGET'>('FIXED');
  const [radiusKm, setRadiusKm] = useState('5');
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
        const configStr = (editData.configuration || editData.bhk || '').toString();
        if (BHK_OPTIONS.includes(configStr as any)) {
          setConfiguration(configStr);
        } else {
          setConfiguration('Other');
          setCustomConfiguration(configStr);
        }
      } else if (editData.lookingFor || editData.description) {
        const text = (editData.lookingFor || editData.description || '').toString();
        const match = text.match(/\b(\d+(\.\d+)?)\s*(BHK|RK)\b/i);
        if (match) {
          const matchedConfig = `${match[1]} ${match[3].toUpperCase()}`;
          if (BHK_OPTIONS.includes(matchedConfig as any)) {
            setConfiguration(matchedConfig);
          } else {
            setConfiguration('Other');
            setCustomConfiguration(matchedConfig);
          }
        }
      }
      if (editData.minBudgetNumeric || editData.budget) {
        const rawMin = (editData.minBudgetNumeric || editData.budget || '').toString();
        const numOnlyMin = rawMin.replace(/[^0-9.]/g, '');
        setMinPrice(rawMin.includes('L') || rawMin.includes('Cr') ? rawMin : numOnlyMin);
      }
      if (editData.maxBudgetNumeric || editData.budgetMax || editData.price) {
        const rawMax = (editData.maxBudgetNumeric || editData.budgetMax || editData.price || '').toString();
        const numOnlyMax = rawMax.replace(/[^0-9.]/g, '');
        setMaxPrice(rawMax.includes('L') || rawMax.includes('Cr') ? rawMax : numOnlyMax);
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
  const locationRef = useRef<TextInput>(null);
  const projectRef = useRef<TextInput>(null);
  const sizeRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!propertyType) newErrors.propertyType = 'Please select a property type.';
    const preferredLocationCount = location.split(';').map(value => value.trim()).filter(Boolean).length;
    if (preferredLocationCount === 0) {
      newErrors.location = 'At least one location is required.';
    } else if (preferredLocationCount > 5) {
      newErrors.location = 'Add no more than five preferred localities.';
    }
    if (!size || Number(size) <= 0) newErrors.size = 'Required area must be greater than zero.';
    if (maxSize && Number(maxSize) < Number(size)) newErrors.maxSize = 'Maximum area must be greater than or equal to minimum area.';
    if (budgetType === 'FIXED' && (!maxPrice || Number(maxPrice) <= 0)) newErrors.maxPrice = 'Maximum budget must be greater than zero.';
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      newErrors.maxPrice = 'Maximum budget must be greater than or equal to minimum budget.';
    }

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
    const locationTexts = location.split(';').map(value => value.trim()).filter(Boolean).slice(0, 5);
    const geocodedLocations = await Promise.all(locationTexts.map(value => forwardGeocode(value)));
    if (geocodedLocations.some(value => !value)) {
      setIsSubmitting(false);
      const failedIndex = geocodedLocations.findIndex(value => !value);
      Alert.alert('Location Not Found', `We could not find "${locationTexts[failedIndex]}". Please enter a more specific locality and city.`);
      return;
    }
    const resolvedLocations = await Promise.all(geocodedLocations.map(async (coordinates, index) => {
      const { lat, lng } = coordinates!;
      const address = await reverseGeocode(lat, lng);
      const entered = locationTexts[index];
      return {
        city: address.city || entered.split(',').pop()?.trim() || entered,
        locality: address.locality || entered,
        lat,
        lng,
      };
    }));
    const primaryLocation = resolvedLocations[0];

    const maxPriceNum = Number(maxPrice || 0);
    const isRental = listingType === 'RENT';

    const finalConfiguration = configuration === 'Other' ? customConfiguration.trim() : configuration;
    const lookingFor = `Wants to ${isRental ? 'Rent' : 'Buy'} ${finalConfiguration ? finalConfiguration + ' ' : ''}${propertyType}`;
    const locality = primaryLocation.locality;

    const payload = {
      transactionType: isRental ? 'RENTAL' as const : 'BUY_SELL' as const,
      category: propertyCategory(propertyType),
      propertyType: backendPropertyType(propertyType),
      configurations: finalConfiguration ? [finalConfiguration] : [],
      description: lookingFor,
      budgetMax: maxPriceNum,
      budgetMin: minPrice ? Number(minPrice) : undefined,
      budgetType,
      minimumSize: areaInSquareFeet(size, sizeUnit),
      maximumSize: maxSize ? areaInSquareFeet(maxSize, sizeUnit) : undefined,
      city: primaryLocation.city,
      locality,
      lat: primaryLocation.lat,
      lng: primaryLocation.lng,
      radiusKm: Number(radiusKm),
      preferredLocations: resolvedLocations,
      preferredProjectNames: projectName.trim() ? [projectName.trim()] : [],
      furnishingPreference: furnishing || undefined,
      facingPreference: facing || undefined,
      additionalNotes: description.trim() || undefined,
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
      console.error('Add Requirement Error:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);

      let msg = error.message || 'Network error. Please check your connection.';
      if (error.response?.data) {
        msg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
      }
      
      Alert.alert(`Submission Failed`, `${msg} (Status: ${error.response?.status || 'None'})`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Field component ───────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────

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

              <FieldWrap label="Looking To" required colors={colors}>
                <PillGroup
                  options={['Rent', 'Buy']}
                  selected={listingType === 'RENT' ? 'Rent' : 'Buy'}
                  onSelect={v => setListingType(v === 'Rent' ? 'RENT' : 'BUY')}
                  colors={colors}
                />
              </FieldWrap>

              <FieldWrap label="Property Type" required error={errors.propertyType} colors={colors}>
                <PillGroup
                  options={PROPERTY_TYPES}
                  selected={propertyType as any}
                  onSelect={v => { setPropertyType(v); if (errors.propertyType) setErrors(p => ({ ...p, propertyType: '' })); }}
                  colors={colors}
                />
              </FieldWrap>

              <FieldWrap label="Preferred Location(s)" required error={errors.location} colors={colors}>
                <TextInput
                  ref={locationRef}
                  style={getInputStyle(!!errors.location, colors)}
                  placeholder="Vijay Nagar, Indore; Palasia, Indore"
                  placeholderTextColor={colors.textDim}
                  value={location}
                  onChangeText={v => { setLocation(v); if (errors.location) setErrors(p => ({ ...p, location: '' })); }}
                  returnKeyType="next"
                  onSubmitEditing={() => projectRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <Text style={[styles.fieldHint, { color: colors.textDim }]}>Separate up to five localities with a semicolon.</Text>
                <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Search Radius</Text>
                <PillGroup
                  options={['2', '3', '5', '10']}
                  selected={radiusKm}
                  onSelect={setRadiusKm}
                  colors={colors}
                />
                <Text style={[styles.fieldHint, { color: colors.textDim }]}>{radiusKm} km around each selected locality</Text>
              </FieldWrap>

              {/* ── OPTIONAL FIELDS ── */}
              <SectionHeader title="More Details  (Optional)" colors={colors} />

              <FieldWrap label="Configuration" colors={colors}>
                <PillGroup
                  options={[...BHK_OPTIONS, 'Other']}
                  selected={BHK_OPTIONS.includes(configuration as any) ? configuration : (configuration ? 'Other' : '')}
                  onSelect={(val) => {
                    if (val === 'Other') {
                      setConfiguration('Other');
                    } else {
                      setConfiguration(val);
                    }
                  }}
                  colors={colors}
                />
                {configuration === 'Other' && (
                  <TextInput
                    style={[getInputStyle(false, colors), { marginTop: 12 }]}
                    placeholder="e.g. 2.5 BHK, 5 BHK"
                    placeholderTextColor={colors.textDim}
                    value={customConfiguration}
                    onChangeText={setCustomConfiguration}
                  />
                )}
              </FieldWrap>

              <FieldWrap label="Furnishing Preference" colors={colors}>
                <PillGroup
                  options={FURNISHING_OPTIONS}
                  selected={furnishing as any}
                  onSelect={setFurnishing}
                  colors={colors}
                />
              </FieldWrap>

              <FieldWrap label="Preferred Facing" colors={colors}>
                <PillGroup
                  options={FACING_OPTIONS as any}
                  selected={facing as any}
                  onSelect={setFacing}
                  colors={colors}
                />
              </FieldWrap>

              {/* Size row */}
              <FieldWrap label="Required Area Range" required error={errors.size || errors.maxSize} colors={colors}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  {/* Numeric area input */}
                  <TextInput
                    ref={sizeRef}
                    style={[getInputStyle(!!errors.size, colors), { flex: 1 }]}
                    placeholder="Min"
                    placeholderTextColor={colors.textDim}
                    value={size}
                    onChangeText={value => {
                      setSize(value);
                      if (errors.size) setErrors(previous => ({ ...previous, size: '' }));
                    }}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => priceRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  <TextInput
                    style={[getInputStyle(!!errors.maxSize, colors), { flex: 1 }]}
                    placeholder="Max (optional)"
                    placeholderTextColor={colors.textDim}
                    value={maxSize}
                    onChangeText={value => {
                      setMaxSize(value);
                      if (errors.maxSize) setErrors(previous => ({ ...previous, maxSize: '' }));
                    }}
                    keyboardType="numeric"
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

              <FieldWrap label="Budget Type" colors={colors}>
                <PillGroup<'FIXED' | 'FLEXIBLE' | 'NOBUDGET'>
                  options={[
                    { label: 'Fixed range', value: 'FIXED' as const },
                    { label: 'Flexible', value: 'FLEXIBLE' as const },
                    { label: 'Discuss', value: 'NOBUDGET' as const },
                  ]}
                  selected={budgetType}
                  onSelect={setBudgetType}
                  colors={colors}
                />
              </FieldWrap>

              <FieldWrap label="Budget Range (₹)" required={budgetType === 'FIXED'} error={errors.maxPrice} colors={colors}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={getInputStyle(!!errors.maxPrice, colors)}
                      placeholder="Min (e.g. 20000)"
                      placeholderTextColor={colors.textDim}
                      value={minPrice}
                      onChangeText={setMinPrice}
                      keyboardType="numeric"
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                    {!!minPrice && Number(minPrice) > 0 && (
                      <Text style={[styles.priceHint, { color: Brand.teal }]}>
                        ≈ ₹{(Number(minPrice) / 100000).toFixed(1)} L
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      ref={priceRef}
                      style={getInputStyle(false, colors)}
                      placeholder={budgetType === 'FIXED' ? 'Max (e.g. 50000)' : 'Max (optional)'}
                      placeholderTextColor={colors.textDim}
                      value={maxPrice}
                      onChangeText={value => {
                        setMaxPrice(value);
                        if (errors.maxPrice) setErrors(previous => ({ ...previous, maxPrice: '' }));
                      }}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => projectRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                    {!!maxPrice && Number(maxPrice) > 0 && (
                      <Text style={[styles.priceHint, { color: Brand.teal }]}>
                        ≈ ₹{(Number(maxPrice) / 100000).toFixed(1)} L
                      </Text>
                    )}
                  </View>
                </View>
              </FieldWrap>

              <FieldWrap label="Project / Society Name" colors={colors}>
                <TextInput
                  ref={projectRef}
                  style={getInputStyle(false, colors)}
                  placeholder="e.g. Omaxe Hills (optional)"
                  placeholderTextColor={colors.textDim}
                  value={projectName}
                  onChangeText={setProjectName}
                  returnKeyType="next"
                  onSubmitEditing={() => descRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </FieldWrap>

              <FieldWrap label="Additional Notes" colors={colors}>
                <TextInput
                  ref={descRef}
                  style={[getInputStyle(false, colors), styles.textArea]}
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
  fieldHint: { fontSize: 11, marginTop: 6 },
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
