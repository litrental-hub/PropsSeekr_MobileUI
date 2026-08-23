import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAddPropertyForm } from '../AddPropertyContext';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';
import { useNavigation } from '@react-navigation/native';
import { FormInput } from '../../../../components/forms/FormInput';
import { useTranslation } from 'react-i18next';
import { addListing } from '../../../../api/property';
import { useAuthStore } from '../../../../store/authStore';
import Geolocation from '@react-native-community/geolocation';
import { requestLocationPermissions } from '../../../../utils/location';

export function ReviewCardSection({ themeColor, setStep }: { themeColor: string, setStep: (step: number) => void }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  
  const [expandMissing, setExpandMissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatting helpers
  const title = `${state.bhk ? state.bhk + ' ' : ''}${state.propertyType || 'Property'} — ${state.areaLocality || 'Unknown Area'}, ${state.city}`;
  const price = state.transactionType === 'Rent' 
    ? (state.monthlyRent ? `₹${state.monthlyRent}/${t('reviewCard.month')}` : t('reviewCard.priceNotSet'))
    : (state.salePrice ? `₹${state.salePrice}` : t('reviewCard.priceNotSet'));

  const specs = [
    (state.propertyType === 'Plot/Land' || state.propertyType === 'Agricultural Land' || state.propertyType === 'Independent House') 
      ? (state.plotArea ? `${state.plotArea} ${state.plotAreaUnit || 'sqft'}` : null) 
      : (state.carpetArea ? `${state.carpetArea} ${t('reviewCard.sqft')}` : null),
    (state.propertyType === 'Independent House' || state.propertyType === 'Bungalow/Villa') 
      ? (state.numberOfFloors ? `House (${state.numberOfFloors})` : null) 
      : (state.propertyType !== 'Plot/Land' && state.propertyType !== 'Agricultural Land' ? (state.floorNumber ? `${t('reviewCard.floor')} ${state.floorNumber}` : null) : null),
    state.propertyType !== 'Plot/Land' && state.propertyType !== 'Agricultural Land' ? (state.furnishingStatus || null) : null,
    state.availableFrom ? t('reviewCard.availableSoon') : null
  ].filter(Boolean).join(' · ');

  const activeAmenities = Object.entries(state.amenities).filter(([_, v]) => v).map(([k]) => k);

  const formatCurrency = (val: string) => val ? `₹${val.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : '';

  // AI Badge Renderer
  const renderAIBadge = (field: string) => {
    if (state.aiFilledFields.includes(field)) {
      return (
        <View style={styles.aiBadge}>
          <MaterialCommunityIcons name="auto-fix" size={10} color="#6D28D9" />
          <Text style={styles.aiBadgeText}>{t('reviewCard.aiFilled')}</Text>
        </View>
      );
    }
    return null;
  };

  const missingOptionalFields = [
    { key: 'propertyAge', label: 'Property Age', value: state.propertyAge },
    { key: 'securityDeposit', label: 'Security Deposit', value: state.securityDeposit },
    { key: 'maintenanceCharges', label: 'Maintenance Charges', value: state.maintenanceCharges },
  ].filter(f => !f.value);

  const handleSubmit = async () => {
    if (!state.transactionType || !state.propertyType || !state.areaLocality?.trim() || (state.transactionType === 'Rent' ? !state.monthlyRent : !state.salePrice)) {
      Alert.alert(
        'Incomplete Form',
        'Please ensure Transaction Type, Property Type, Area/Locality, and Price/Rent are completed before submitting.',
        [{ text: 'Go Back to Edit', onPress: () => setStep(1) }]
      );
      return;
    }

    setIsSubmitting(true);
    const hasPerm = await requestLocationPermissions();
    if (!hasPerm) {
      setIsSubmitting(false);
      Alert.alert('Location Permission Required', 'Location access is required to attach valid GPS coordinates for automated property matchmaking. Please grant location access.');
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
      Alert.alert('GPS Unavailable', 'Could not obtain valid GPS coordinates for radius matching. Please check your GPS settings and try again.');
      return;
    }

    if (!lat || !lng || (lat === 0 && lng === 0)) {
      setIsSubmitting(false);
      Alert.alert('Invalid Coordinates', 'Obtained invalid GPS coordinates. Please verify your GPS signal and try again.');
      return;
    }

    const priceNum = state.transactionType === 'Rent'
      ? parseFloat(String(state.monthlyRent || '0').replace(/[^0-9.]/g, '')) || 0
      : parseFloat(String(state.salePrice || '0').replace(/[^0-9.]/g, '')) || 0;

    const areaNum = parseFloat(String(state.carpetArea || state.plotArea || state.superBuiltupArea || '1200').replace(/[^0-9.]/g, '')) || 1200;
    const bedroomsNum = parseInt(state.bhk || String(state.numberOfBedrooms || 0), 10) || (state.bhk?.includes('1') ? 1 : state.bhk?.includes('2') ? 2 : state.bhk?.includes('3') ? 3 : state.bhk?.includes('4') ? 4 : 1);

    // --- Map UI property type to backend enum ---
    const propertyTypeMap: Record<string, string> = {
      'Flat/Apartment': 'APARTMENT',
      'Independent House': 'INDEPENDENT_HOUSE',
      'Bungalow/Villa': 'BUNGALOW',
      'Plot/Land': 'PLOT',
      'PG/Hostel': 'PG',
      'Office Space': 'OFFICE',
      'Shop/Retail': 'SHOP',
      'Warehouse': 'WAREHOUSE',
      'Agricultural Land': 'AGRICULTURAL_LAND',
      'Institution/Specialised': 'INSTITUTION',
    };
    const backendPropertyType = propertyTypeMap[state.propertyType || ''] || 'APARTMENT';

    // --- BHK numeric value ---
    const bhkNum = parseInt(state.bhk || '0', 10) || 0;

    // --- Build the new API payload (snake_case to match backend schema) ---
    const payload = {
      broker_id: Number(user?.brokerId) || 0,
      property_type: backendPropertyType,
      locality: state.areaLocality || state.city || 'Unknown',
      price: priceNum,
      posted_by: 'BROKER',
      requirement_ids: [] as number[],
      sizes: [
        {
          size_sqft: areaNum,
          bhk: bhkNum,
        }
      ],
    };

    try {
      const res = await addListing(payload);
      setIsSubmitting(false);

      if (res.success || res.listing_id) {
        Alert.alert(
          '✅ Property Listed Successfully!',
          `Your property has been submitted (ID: ${res.listing_id || 'N/A'}) and automated matchmaking has begun.`,
          [
            {
              text: 'View My Properties',
              onPress: () => {
                navigation.navigate('MainTabs' as any, { screen: 'MyProperties' } as any);
              }
            }
          ]
        );
      } else {
        Alert.alert('❌ Submission Failed', res.message || 'Could not save property listing. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      let msg = 'Could not save property listing. Please try again.';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (data.errors && typeof data.errors === 'object') {
          const errList = Object.values(data.errors).flat().join('\n');
          msg = errList || data.title || data.message || data.error || msg;
        } else if (data.message || data.error || data.title) {
          msg = data.message || data.error || data.title;
        } else {
          msg = JSON.stringify(data);
        }
      } else if (err.message) {
        msg = err.message;
      }
      Alert.alert('❌ Submission Failed', msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
        
        {/* Top Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
            <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>
              {state.propertyType === 'Office Space' || state.propertyType === 'Shop/Retail' ? t('reviewCard.commercial') : t('reviewCard.residential')}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: Brand.teal + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: Brand.teal }]}>
              {state.transactionType === 'Rent' ? t('reviewCard.forRent') : state.transactionType === 'Sale' ? t('reviewCard.forSale') : `${t('reviewCard.for')} Rent`}
            </Text>
            {renderAIBadge('transactionType')}
          </View>
        </View>

        {/* Title & Price */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {renderAIBadge('areaLocality')}
          <Text style={[styles.price, { color: Brand.teal }]}>{price}</Text>
          {renderAIBadge(state.transactionType === 'Rent' ? 'monthlyRent' : 'salePrice')}
        </View>

        {/* Specs */}
        {specs ? (
          <Text style={[styles.specs, { color: colors.textSecondary }]}>{specs}</Text>
        ) : null}

        {/* Amenities Icons */}
        {activeAmenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {activeAmenities.map(am => (
              <View key={am} style={styles.amenityChip}>
                <MaterialCommunityIcons name="check-circle" size={12} color={Brand.teal} />
                <Text style={[styles.amenityText, { color: colors.textPrimary }]}>{am}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Preferences */}
        <View style={styles.preferencesRow}>
          {state.tenantPreferences.map(pref => (
            <View key={pref} style={[styles.prefChip, { backgroundColor: Brand.teal + '15' }]}>
              <Text style={[styles.prefText, { color: Brand.teal }]}>{pref} ✓</Text>
            </View>
          ))}
          {state.petPolicy === 'Not allowed' && (
            <View style={[styles.prefChip, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.prefText, { color: '#991B1B' }]}>{t('reviewCard.noPets')} ✗</Text>
            </View>
          )}
        </View>

        {/* Missing Fields Nudge */}
        {missingOptionalFields.length > 0 && (
          <View style={[styles.nudgeBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setExpandMissing(!expandMissing)}
              style={styles.nudgeHeader}
            >
              <MaterialCommunityIcons name="lightbulb-on" size={18} color="#D97706" />
              <Text style={styles.nudgeText}>
                {t('reviewCard.nudgeText', { count: missingOptionalFields.length })}
              </Text>
              <MaterialCommunityIcons name={expandMissing ? "chevron-up" : "chevron-down"} size={20} color="#D97706" />
            </TouchableOpacity>

            {expandMissing && (
              <View style={styles.nudgeContent}>
                {missingOptionalFields.map(f => (
                  <View key={f.key} style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, color: '#92400E', marginBottom: 4 }}>{f.label}</Text>
                    <FormInput 
                      label=""
                      value={f.value}
                      onChangeText={(val) => updateState({ [f.key]: val })}
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                      keyboardType={f.key.includes('Deposit') || f.key.includes('Charge') ? 'numeric' : 'default'}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Credit Cost */}
        <View style={[styles.creditBox, { backgroundColor: colors.inputBg }]}>
          <MaterialCommunityIcons name="star-four-points" size={16} color={Brand.blue} />
          <Text style={[styles.creditText, { color: colors.textSecondary }]}>
            {t('reviewCard.unlockCost')} <Text style={{ fontWeight: '700', color: colors.textPrimary }}>2 {t('reviewCard.credits')}</Text>
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.editBtn, { borderColor: Brand.blueBorder }]} 
            onPress={() => setStep(1)}
          >
            <Text style={[styles.editBtnText, { color: colors.textPrimary }]}>{t('reviewCard.editBtn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.85}>
            <LinearGradient
              colors={[Brand.blue, Brand.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGrad}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{t('reviewCard.submitBtn')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    color: '#6D28D9',
    fontWeight: '600',
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  specs: {
    fontSize: 14,
    marginBottom: 16,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amenityText: {
    fontSize: 13,
  },
  preferencesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  prefChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prefText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nudgeBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  nudgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nudgeText: {
    flex: 1,
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
    marginLeft: 8,
  },
  nudgeContent: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingTop: 8,
  },
  creditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  creditText: {
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGrad: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
