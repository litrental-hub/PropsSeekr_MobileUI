import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { AddPropertyProvider, useAddPropertyForm } from './AddPropertyContext';
import { useAppTheme, Brand } from '../../../theme/useAppTheme';
import { PropSeekrLogo } from '../../../components/PropSeekrLogo';
import { useTranslation } from 'react-i18next';

import { AIBanner } from './components/AIBanner';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { PricingSection } from './sections/PricingSection';
import { PropertyDetailsSection } from './sections/PropertyDetailsSection';
import { OwnerPreferencesSection } from './sections/OwnerPreferencesSection';
import { ReviewCardSection } from './sections/ReviewCardSection';

function AddPropertyForm() {
  const navigation = useNavigation();
  const { state } = useAddPropertyForm();
  const { colors, isDark, type } = useAppTheme();
  const { t } = useTranslation();
  
  const [step, setStep] = React.useState(1);

  const themeColor = Brand.teal;

  // Mandatory fields validation for step 1
  const missingFields = step === 1 ? [
    !state.transactionType,
    !state.propertyType,
    !state.areaLocality.trim(),
    (state.transactionType === 'Rent' ? !state.monthlyRent : !state.salePrice),
  ].filter(Boolean).length : 0;
  
  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };
  
  const handleNext = () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      // Final submission logic here
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.navy}
      />

      {/* Background gradient — same as Dashboard & Matches */}
      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top accent bar — same as Dashboard & Matches */}
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* HEADER — PropSeekrLogo left, step badge right */}
        <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
          <PropSeekrLogo size={30} theme={type} layout="horizontal" />
          <View style={styles.headerRight}>
            <View style={[styles.stepBadge, { backgroundColor: 'rgba(37,99,235,0.15)', borderColor: Brand.blueBorder }]}>
              <Text style={styles.stepBadgeText}>{step} / 4</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && (
              <>
                <AIBanner />
                <BasicInfoSection themeColor={themeColor} />
                <PricingSection themeColor={themeColor} />
              </>
            )}
            
            {step === 2 && (
              <PropertyDetailsSection themeColor={themeColor} />
            )}
            
            {step === 3 && (
              <OwnerPreferencesSection themeColor={themeColor} />
            )}
            
            {step === 4 && (
              <ReviewCardSection themeColor={themeColor} setStep={setStep} />
            )}
          </ScrollView>

          {/* Bottom Actions Bar - Hidden on Step 4 */}
          {step < 4 && (
            <View style={[styles.bottomBar, { backgroundColor: colors.cardBg, borderTopColor: Brand.blueBorder }]}>
              {missingFields > 0 && (
                <View style={styles.warningBanner}>
                  <Text style={[styles.warningText, { color: '#F59E0B' }]}>
                    {t(missingFields === 1 ? 'addProperty.mandatoryMissing' : 'addProperty.mandatoryMissingPlural', { count: missingFields })}
                  </Text>
                </View>
              )}
              <View style={styles.ctaRow}>
                {step > 1 ? (
                  <TouchableOpacity
                    onPress={handleBack}
                    activeOpacity={0.7}
                    style={[styles.draftBtn, { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg }]}
                  >
                    <Text style={[styles.draftBtnText, { color: colors.textSecondary }]}>
                      Back
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => console.log('Save Draft')}
                    activeOpacity={0.7}
                    style={[styles.draftBtn, { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg }]}
                  >
                    <Text style={[styles.draftBtnText, { color: colors.textSecondary }]}>
                      {t('addProperty.saveAsDraft')}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Continue button — gradient when active, dimmed when disabled */}
                {missingFields === 0 ? (
                  <TouchableOpacity style={styles.submitBtnWrap} activeOpacity={0.85} onPress={handleNext}>
                    <LinearGradient
                      colors={[Brand.blue, Brand.teal]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitGrad}
                    >
                      <Text style={styles.submitBtnText}>{t('addProperty.continue')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.submitBtnWrap, styles.submitBtnDisabled]}>
                    <Text style={[styles.submitBtnText, { color: colors.textDim }]}>{t('addProperty.continue')}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default function AddPropertyScreen() {
  return (
    <AddPropertyProvider>
      <AddPropertyForm />
    </AddPropertyProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  accentBar: {
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },

  // ── Header (mirrors Dashboard & Matches header exactly)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 12, paddingBottom: 24 },

  // ── Bottom Bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
  },
  warningBanner: {
    alignItems: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  // Draft — outlined, glass
  draftBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Submit — gradient wrapper
  submitBtnWrap: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
