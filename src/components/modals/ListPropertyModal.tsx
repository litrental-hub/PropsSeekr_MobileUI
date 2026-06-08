import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../constants/colors';
import {
  FontSize,
  FontWeight,
  Radius,
  Shadow,
  Spacing,
} from '../../constants/theme';
import {
  PROPERTY_TYPES,
  BHK_OPTIONS,
  FURNISHING_OPTIONS,
  PROPERTY_STATUSES,
} from '../../constants';

// Simulated AI parse result
const mockParse = (text: string) => ({
  title: text.length > 20 ? text.slice(0, 40) : text,
  type: text.toLowerCase().includes('villa')
    ? 'Villa'
    : text.toLowerCase().includes('plot')
    ? 'Plot / Land'
    : 'Flat / Apartment',
  bhk: text.includes('3') ? '3 BHK' : text.includes('1') ? '1 BHK' : '2 BHK',
  locality: text.toLowerCase().includes('vijay')
    ? 'Vijay Nagar, Indore'
    : text.toLowerCase().includes('palasia')
    ? 'Palasia, Indore'
    : 'Scheme 54, Indore',
  price: text.includes('50') ? '5000000' : text.includes('30') ? '3000000' : '4500000',
  area: '950',
  furnishing: text.toLowerCase().includes('furnished') ? 'Semi-Furnished' : 'Unfurnished',
  floor: '2nd',
  facing: 'East',
  sectionType: text.toLowerCase().includes('rent') ? 'Rentals' : 'Selling',
});

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: (data: any) => void;
}

type Step = 'input' | 'parsing' | 'form';

export default function ListPropertyModal({ visible, onClose, onSaved }: Props) {
  const [step, setStep] = useState<Step>('input');
  const [freeText, setFreeText] = useState('');
  const [parsed, setParsed] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  const handleClose = () => {
    setStep('input');
    setFreeText('');
    setParsed(null);
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    onClose();
  };

  const handleParse = () => {
    if (!freeText.trim()) return;
    setStep('parsing');
    setTimeout(() => {
      const result = mockParse(freeText);
      setParsed(result);
      setStep('form');
      animateIn();
    }, 1800);
  };

  const handleSave = () => {
    onSaved({ ...parsed, freeText, freshness: new Date().toISOString() });
    handleClose();
  };

  const updateField = (key: string, val: string) =>
    setParsed((prev: any) => ({ ...prev, [key]: val }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {step === 'form' ? '✏️ Review & Save' : '🏠 List Property'}
              </Text>
              <Text style={styles.headerSub}>
                {step === 'input'
                  ? 'Describe your property in plain language'
                  : step === 'parsing'
                  ? 'AI is extracting details...'
                  : 'AI parsed — edit before saving'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Step 1 — Free text input */}
            {(step === 'input' || step === 'parsing') && (
              <View>
                <View style={styles.aiHintBox}>
                  <Text style={styles.aiHintIcon}>✨</Text>
                  <Text style={styles.aiHintText}>
                    Just type naturally — our AI will extract locality, price, BHK, and type automatically.
                  </Text>
                </View>

                <TextInput
                  style={styles.freeTextInput}
                  placeholder={'Example:\n"2BHK semi-furnished flat in Vijay Nagar, 4th floor, ₹45L, east facing, 950sqft"'}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={freeText}
                  onChangeText={setFreeText}
                  editable={step === 'input'}
                  textAlignVertical="top"
                />

                {step === 'parsing' && (
                  <View style={styles.parsingRow}>
                    <ActivityIndicator color={Colors.brandTeal} size="small" />
                    <Text style={styles.parsingText}>AI is parsing your input...</Text>
                  </View>
                )}

                <Text style={styles.freshNote}>
                  🕐 Freshness timestamp will be auto-set when you save
                </Text>
              </View>
            )}

            {/* Step 2 — Structured Form */}
            {step === 'form' && parsed && (
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <View style={styles.parsedBanner}>
                  <Text style={styles.parsedBannerIcon}>✅</Text>
                  <Text style={styles.parsedBannerText}>
                    AI extracted {Object.keys(parsed).length} fields — review and edit below
                  </Text>
                </View>

                <FormField label="Property Title" value={parsed.title} onChangeText={v => updateField('title', v)} />

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <FormLabel label="Type" parsed />
                    <ChipSelect
                      options={[...PROPERTY_TYPES]}
                      value={parsed.type}
                      onSelect={v => updateField('type', v)}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <FormLabel label="BHK" parsed />
                    <ChipSelect
                      options={[...BHK_OPTIONS]}
                      value={parsed.bhk}
                      onSelect={v => updateField('bhk', v)}
                    />
                  </View>
                </View>

                <FormField
                  label="Locality"
                  value={parsed.locality}
                  onChangeText={v => updateField('locality', v)}
                  parsed
                  icon="📍"
                />

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Price (₹)"
                      value={parsed.price}
                      onChangeText={v => updateField('price', v)}
                      parsed
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Area (sqft)"
                      value={parsed.area}
                      onChangeText={v => updateField('area', v)}
                      parsed
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Floor"
                      value={parsed.floor}
                      onChangeText={v => updateField('floor', v)}
                      parsed
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Facing"
                      value={parsed.facing}
                      onChangeText={v => updateField('facing', v)}
                      parsed
                    />
                  </View>
                </View>

                <View>
                  <FormLabel label="Furnishing" parsed />
                  <ChipSelect
                    options={[...FURNISHING_OPTIONS]}
                    value={parsed.furnishing}
                    onSelect={v => updateField('furnishing', v)}
                  />
                </View>

                <View style={styles.freshBox}>
                  <Text style={styles.freshBoxText}>
                    🕐  Freshness timestamp: <Text style={styles.freshBoxTime}>{new Date().toLocaleString('en-IN')}</Text>
                  </Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {step === 'input' && (
              <>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.parseBtn, !freeText.trim() && styles.parseBtnDisabled]}
                  onPress={handleParse}
                  disabled={!freeText.trim()}
                  activeOpacity={0.85}>
                  <LinearGradient
                    colors={[Colors.brandTealLight, Colors.brandTeal]}
                    style={styles.parseBtnGrad}>
                    <Text style={styles.parseBtnText}>✨  Parse with AI</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {step === 'form' && (
              <>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setStep('input'); fadeAnim.setValue(0); }}>
                  <Text style={styles.cancelBtnText}>← Re-type</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                  <LinearGradient
                    colors={[Colors.brandTealLight, Colors.brandTeal]}
                    style={styles.parseBtnGrad}>
                    <Text style={styles.parseBtnText}>Save Listing ✓</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function FormLabel({ label, parsed }: { label: string; parsed?: boolean }) {
  return (
    <View style={formStyles.labelRow}>
      <Text style={formStyles.label}>{label}</Text>
      {parsed && (
        <View style={formStyles.parsedChip}>
          <Text style={formStyles.parsedChipText}>AI</Text>
        </View>
      )}
    </View>
  );
}

function FormField({
  label, value, onChangeText, parsed, keyboardType, icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  parsed?: boolean;
  keyboardType?: any;
  icon?: string;
}) {
  return (
    <View style={formStyles.group}>
      <FormLabel label={label} parsed={parsed} />
      <View style={formStyles.inputWrap}>
        {icon && <Text style={formStyles.inputIcon}>{icon}</Text>}
        <TextInput
          style={[formStyles.input, icon && { paddingLeft: 32 }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          placeholderTextColor={Colors.textMuted}
        />
      </View>
    </View>
  );
}

function ChipSelect({
  options, value, onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[chipStyles.chip, value === opt && chipStyles.chipActive]}
            onPress={() => onSelect(opt)}>
            <Text style={[chipStyles.chipText, value === opt && chipStyles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

/* ── Styles ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: Colors.textMuted, fontWeight: FontWeight.bold },

  body: { padding: Spacing.xl, paddingBottom: 32 },

  aiHintBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: 'rgba(13,145,120,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(13,145,120,0.2)',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  aiHintIcon: { fontSize: 16 },
  aiHintText: { flex: 1, fontSize: FontSize.sm, color: Colors.brandTeal, lineHeight: 18, fontWeight: FontWeight.medium },

  freeTextInput: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md,
    minHeight: 120, fontSize: FontSize.base,
    color: Colors.textPrimary, backgroundColor: Colors.surface,
    lineHeight: 22,
  },
  parsingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(13,145,120,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(13,145,120,0.2)',
    borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md,
  },
  parsingText: { fontSize: FontSize.sm, color: Colors.brandTeal, fontWeight: FontWeight.semibold },
  freshNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' },

  parsedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  parsedBannerIcon: { fontSize: 16 },
  parsedBannerText: { fontSize: FontSize.sm, color: '#15803D', fontWeight: FontWeight.semibold, flex: 1 },

  row: { marginBottom: 0 },
  rowFields: { flexDirection: 'row', gap: Spacing.md },

  freshBox: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md,
  },
  freshBoxText: { fontSize: FontSize.sm, color: Colors.textMuted },
  freshBoxTime: { color: Colors.brandTeal, fontWeight: FontWeight.semibold },

  footer: {
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancelBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  parseBtn: { flex: 2, borderRadius: Radius.md, overflow: 'hidden' },
  parseBtnDisabled: { opacity: 0.4 },
  saveBtn: { flex: 2, borderRadius: Radius.md, overflow: 'hidden' },
  parseBtnGrad: { padding: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  parseBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
});

const formStyles = StyleSheet.create({
  group: { marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  parsedChip: { backgroundColor: '#DCFCE7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  parsedChipText: { fontSize: 9, fontWeight: FontWeight.bold, color: '#15803D' },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 10, top: 9, fontSize: 14, zIndex: 1 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm,
    padding: Spacing.md, fontSize: FontSize.base,
    color: Colors.textPrimary, backgroundColor: Colors.surface2,
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { borderColor: Colors.brandTeal, backgroundColor: Colors.brandTeal },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
});
