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
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';
import { PROPERTY_TYPES, BHK_OPTIONS } from '../../constants';

const mockParseReq = (text: string) => ({
  summary: text.length > 30 ? text.slice(0, 60) : text,
  type: text.toLowerCase().includes('villa') ? 'Villa' : 'Flat / Apartment',
  bhk: text.includes('3') ? '3 BHK' : text.includes('1') ? '1 BHK' : '2 BHK',
  locality: text.toLowerCase().includes('vijay')
    ? 'Vijay Nagar, Indore'
    : 'Scheme 54, Indore',
  minBudget: text.includes('40') ? '4000000' : '3000000',
  maxBudget: text.includes('50') ? '5000000' : '4500000',
  sectionType: text.toLowerCase().includes('rent') ? 'Rentals' : 'Buying',
  notes: '',
});

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: (data: any) => void;
}

type Step = 'input' | 'parsing' | 'form';

export default function CreateRequirementModal({ visible, onClose, onSaved }: Props) {
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
      setParsed(mockParseReq(freeText));
      setStep('form');
      animateIn();
    }, 1600);
  };

  const handleSave = () => {
    onSaved({ ...parsed, freeText, createdAt: new Date().toISOString() });
    handleClose();
  };

  const update = (key: string, val: string) =>
    setParsed((p: any) => ({ ...p, [key]: val }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {step === 'form' ? '✏️ Review Requirement' : '📋 Create Requirement'}
              </Text>
              <Text style={styles.headerSub}>
                {step === 'input'
                  ? "Describe your client's requirement"
                  : step === 'parsing'
                  ? 'Extracting details with AI...'
                  : 'Edit extracted fields before saving'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {(step === 'input' || step === 'parsing') && (
              <View>
                <View style={styles.hintBox}>
                  <Text style={styles.hintIcon}>💡</Text>
                  <Text style={styles.hintText}>
                    Describe the requirement naturally — AI extracts locality, budget, BHK and property type.
                  </Text>
                </View>

                <TextInput
                  style={styles.freeTextInput}
                  placeholder={'Example:\n"Client needs 2BHK in Vijay Nagar or Palasia, budget ₹40–50L, family preferred, ready to move"'}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={freeText}
                  onChangeText={setFreeText}
                  editable={step === 'input'}
                  textAlignVertical="top"
                />

                {step === 'parsing' && (
                  <View style={styles.parsingRow}>
                    <ActivityIndicator color={Colors.info} size="small" />
                    <Text style={styles.parsingText}>AI is extracting requirement details...</Text>
                  </View>
                )}

                <View style={styles.matchNote}>
                  <Text style={styles.matchNoteText}>
                    🤝 Auto-match will run immediately after you save
                  </Text>
                </View>
              </View>
            )}

            {step === 'form' && parsed && (
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <View style={styles.parsedBanner}>
                  <Text style={styles.parsedBannerIcon}>✅</Text>
                  <Text style={styles.parsedBannerText}>
                    Fields extracted — review and save to trigger auto-match
                  </Text>
                </View>

                {/* Summary */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>SUMMARY</Text>
                  <TextInput
                    style={styles.input}
                    value={parsed.summary}
                    onChangeText={v => update('summary', v)}
                    multiline
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Locality */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>LOCALITY</Text>
                    <AiBadge />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={parsed.locality}
                    onChangeText={v => update('locality', v)}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* BHK */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>BHK</Text>
                    <AiBadge />
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {BHK_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.chip, parsed.bhk === opt && styles.chipActive]}
                          onPress={() => update('bhk', opt)}>
                          <Text style={[styles.chipText, parsed.bhk === opt && styles.chipTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Property Type */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>PROPERTY TYPE</Text>
                    <AiBadge />
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {PROPERTY_TYPES.map(opt => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.chip, parsed.type === opt && styles.chipActive]}
                          onPress={() => update('type', opt)}>
                          <Text style={[styles.chipText, parsed.type === opt && styles.chipTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Budget */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>BUDGET RANGE (₹)</Text>
                    <AiBadge />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Min</Text>
                      <TextInput
                        style={styles.input}
                        value={parsed.minBudget}
                        onChangeText={v => update('minBudget', v)}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Max</Text>
                      <TextInput
                        style={styles.input}
                        value={parsed.maxBudget}
                        onChangeText={v => update('maxBudget', v)}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ADDITIONAL NOTES</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 70 }]}
                    value={parsed.notes}
                    onChangeText={v => update('notes', v)}
                    multiline
                    placeholder="e.g. Family preferred, ready to move, no east facing..."
                    placeholderTextColor={Colors.textMuted}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.autoMatchBox}>
                  <Text style={styles.autoMatchText}>
                    🔍 Auto-match will scan all active listings and notify matched brokers immediately after save
                  </Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {step === 'input' && (
              <>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, !freeText.trim() && { opacity: 0.4 }]}
                  onPress={handleParse}
                  disabled={!freeText.trim()}
                  activeOpacity={0.85}>
                  <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.actionBtnGrad}>
                    <Text style={styles.actionBtnText}>✨  Parse with AI</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
            {step === 'form' && (
              <>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setStep('input'); fadeAnim.setValue(0); }}>
                  <Text style={styles.cancelText}>← Re-type</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSave} activeOpacity={0.85}>
                  <LinearGradient colors={[Colors.brandTealLight, Colors.brandTeal]} style={styles.actionBtnGrad}>
                    <Text style={styles.actionBtnText}>Save & Match 🤝</Text>
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

function AiBadge() {
  return (
    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
      <Text style={{ fontSize: 9, fontWeight: FontWeight.bold, color: '#15803D' }}>AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.xxl, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.surface2, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: Colors.textMuted, fontWeight: FontWeight.bold },
  body: { padding: Spacing.xl, paddingBottom: 32 },
  hintBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  hintIcon: { fontSize: 16 },
  hintText: { flex: 1, fontSize: FontSize.sm, color: '#1D4ED8', lineHeight: 18, fontWeight: FontWeight.medium },
  freeTextInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, minHeight: 120, fontSize: FontSize.base,
    color: Colors.textPrimary, backgroundColor: Colors.surface, lineHeight: 22,
  },
  parsingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE',
    borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md,
  },
  parsingText: { fontSize: FontSize.sm, color: '#1D4ED8', fontWeight: FontWeight.semibold },
  matchNote: {
    marginTop: Spacing.lg, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md,
  },
  matchNoteText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  parsedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  parsedBannerIcon: { fontSize: 16 },
  parsedBannerText: { fontSize: FontSize.sm, color: '#15803D', fontWeight: FontWeight.semibold, flex: 1 },
  fieldGroup: { marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  subLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm,
    padding: Spacing.md, fontSize: FontSize.base,
    color: Colors.textPrimary, backgroundColor: Colors.surface,
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive: { borderColor: Colors.info, backgroundColor: Colors.info },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  autoMatchBox: {
    marginTop: Spacing.md, backgroundColor: '#FFFBF0',
    borderWidth: 1.5, borderColor: Colors.brandAmber,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  autoMatchText: { fontSize: FontSize.sm, color: Colors.brandAmberDark, lineHeight: 18, fontWeight: FontWeight.medium },
  footer: {
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface,
  },
  cancelBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  actionBtn: { flex: 2, borderRadius: Radius.md, overflow: 'hidden' },
  actionBtnGrad: { padding: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
});
