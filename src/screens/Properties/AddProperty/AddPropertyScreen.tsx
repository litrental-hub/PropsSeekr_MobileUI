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
import { useNavigation, useRoute } from '@react-navigation/native';
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
  const route = useRoute<any>();
  const { state, updateState } = useAddPropertyForm();
  const { colors, isDark, type } = useAppTheme();
  const { t } = useTranslation();
  
  const [step, setStep] = React.useState(1);

  const editData = route.params?.initialData;

  React.useEffect(() => {
    if (editData) {
      const updates: any = {};
      // 1. Transaction Type
      if (editData.type === 'RENTAL' || editData.transactionType === 'Rent' || editData.price?.toString().includes('/mo') || editData.monthlyRent) {
        updates.transactionType = 'Rent';
      } else if (editData.type === 'BUY/SELL' || editData.transactionType === 'Sale' || editData.price?.toString().includes('Cr') || editData.price?.toString().includes('L') || editData.salePrice) {
        updates.transactionType = 'Sale';
      } else {
        updates.transactionType = 'Rent';
      }

      // 2. Property Type
      if (editData.propertyType) {
        updates.propertyType = editData.propertyType;
      } else if (editData.category) {
        updates.propertyType = editData.category;
      } else {
        const title = (editData.title || editData.buildingName || '').toString().toLowerCase();
        if (title.includes('flat') || title.includes('apartment') || title.includes('penthouse') || title.includes('bhk')) {
          updates.propertyType = 'Flat/Apartment';
        } else if (title.includes('office')) {
          updates.propertyType = 'Office Space';
        } else if (title.includes('shop')) {
          updates.propertyType = 'Shop/Retail';
        } else if (title.includes('villa') || title.includes('bungalow')) {
          updates.propertyType = 'Bungalow/Villa';
        } else if (title.includes('house')) {
          updates.propertyType = 'Independent House';
        } else if (title.includes('plot') || title.includes('land')) {
          updates.propertyType = 'Plot/Land';
        } else {
          updates.propertyType = 'Flat/Apartment';
        }
      }

      // 3. Locality / Location
      if (editData.location || editData.locality || editData.city) {
        let loc = (editData.locality || editData.location || editData.city || '').toString();
        const parts = loc.split(',');
        if (parts.length > 1) {
          updates.areaLocality = parts[0].trim();
          updates.city = parts[1].trim();
        } else {
          updates.areaLocality = loc.trim();
        }
      }

      // 4. Price / Rent / Sale Price
      if (editData.price || editData.monthlyRent || editData.salePrice) {
        const rawPrice = (editData.monthlyRent || editData.salePrice || editData.price || '').toString();
        const numOnly = rawPrice.replace(/[^0-9.]/g, '');
        if (updates.transactionType === 'Rent') {
          updates.monthlyRent = numOnly ? rawPrice.replace(/[^0-9]/g, '') : rawPrice;
        } else {
          let calcPrice = numOnly;
          if (rawPrice.includes('Cr') && numOnly) {
            calcPrice = (parseFloat(numOnly) * 10000000).toString();
          } else if (rawPrice.includes('L') && numOnly) {
            calcPrice = (parseFloat(numOnly) * 100000).toString();
          }
          updates.salePrice = calcPrice || rawPrice;
        }
      }

      // 5. BHK & Area
      if (editData.bhk || editData.title) {
        const text = (editData.bhk || editData.title || '').toString();
        const match = text.match(/\b(\d+)\s*BHK\b/i);
        if (match) {
          updates.bhk = `${match[1]} BHK`;
        } else if (editData.bhk) {
          updates.bhk = editData.bhk.toString();
        }
      }
      if (editData.carpetArea || editData.superBuiltupArea || editData.title) {
        if (editData.carpetArea) updates.carpetArea = editData.carpetArea.toString();
        else if (editData.superBuiltupArea) updates.superBuiltupArea = editData.superBuiltupArea.toString();
        else {
          const text = (editData.title || '').toString();
          const match = text.match(/\b(\d+(?:,\d+)?)\s*sqft\b/i);
          if (match) updates.carpetArea = match[1].replace(',', '');
        }
      }

      // 6. Additional details if present
      if (editData.floorNumber !== undefined) updates.floorNumber = editData.floorNumber.toString();
      if (editData.totalFloors !== undefined) updates.totalFloors = editData.totalFloors.toString();
      if (editData.facing !== undefined) updates.facing = editData.facing.toString();
      if (editData.propertyAge !== undefined) updates.propertyAge = editData.propertyAge.toString();
      if (editData.furnishingStatus !== undefined) updates.furnishingStatus = editData.furnishingStatus.toString();
      if (editData.bathrooms !== undefined) updates.bathrooms = Number(editData.bathrooms);
      if (editData.balconies !== undefined) updates.balconies = Number(editData.balconies);
      if (editData.amenities && typeof editData.amenities === 'object') {
        updates.amenities = { ...editData.amenities };
      }

      updateState(updates);
    }
  }, [editData, updateState]);

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
