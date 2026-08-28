import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAddPropertyForm } from '../AddPropertyContext';
import { Stepper } from '../../../../components/forms/Stepper';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { FormInput } from '../../../../components/forms/FormInput';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';
import { HouseDetailsSection } from './HouseDetailsSection';
import { PlotDetailsSection } from './PlotDetailsSection';
import { PGDetailsSection } from './PGDetailsSection';
import { OfficeDetailsSection } from './OfficeDetailsSection';
import { ShopDetailsSection } from './ShopDetailsSection';
import { WarehouseDetailsSection } from './WarehouseDetailsSection';
import { InstitutionDetailsSection } from './InstitutionDetailsSection';

const AMENITIES = [
  { key: 'Lift', icon: 'elevator', label: 'Lift (🛟)' },
  { key: 'CarParking', icon: 'car', label: 'Car Parking (🚗)' },
  { key: 'TwoWheeler', icon: 'motorbike', label: '2-Wheeler (🛵)' },
  { key: 'PowerBackup', icon: 'lightning-bolt', label: 'Power Backup (⚡)' },
  { key: 'Internet', icon: 'wifi', label: 'Internet Ready (📶)' },
  { key: 'Security', icon: 'cctv', label: 'Security / CCTV (📷)' },
  { key: 'Gated', icon: 'gate', label: 'Gated Society (🔒)' },
  { key: 'Gym', icon: 'dumbbell', label: 'Gym (💪)' },
  { key: 'Pool', icon: 'pool', label: 'Swimming Pool (🏊)' },
  { key: 'AC', icon: 'snowflake', label: 'AC Fitted (❄️)' },
  { key: 'Geyser', icon: 'water-boiler', label: 'Geyser (🚿)' },
  { key: 'ModularKitchen', icon: 'stove', label: 'Modular Kitchen (🍳)' },
  { key: 'ServantRoom', icon: 'bed-empty', label: 'Servant Room (🛏️)' },
  { key: 'Clubhouse', icon: 'bank', label: 'Clubhouse (🏑)' },
];

export function PropertyDetailsSection({ themeColor }: { themeColor: string }) {
  const { state, updateState, updateAmenity } = useAddPropertyForm();
  const [expanded, setExpanded] = useState(false);
  const { colors } = useAppTheme();

  if (!state.propertyType) return null;

  if (state.propertyType === 'Office Space') {
    return <OfficeDetailsSection themeColor={themeColor} />;
  }

  if (state.propertyType === 'Shop/Retail') {
    return <ShopDetailsSection themeColor={themeColor} />;
  }

  if (state.propertyType === 'Warehouse') {
    return <WarehouseDetailsSection themeColor={themeColor} />;
  }

  if (state.propertyType === 'Institution/Specialised') {
    return <InstitutionDetailsSection themeColor={themeColor} />;
  }

  if (state.propertyType === 'PG/Hostel') {
    return <PGDetailsSection themeColor={themeColor} />;
  }

  if (state.propertyType === 'Plot/Land' || state.propertyType === 'Agricultural Land') {
    return <PlotDetailsSection themeColor={themeColor} />;
  }

  const isHouse = state.propertyType === 'Independent House' || state.propertyType === 'Bungalow/Villa';
  const isLand = ['Plot/Land', 'Agricultural Land'].includes(String(state.propertyType));

  return (
    <>
      {isHouse && <HouseDetailsSection themeColor={themeColor} />}
      
      <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <TouchableOpacity 
        style={styles.header} 
        activeOpacity={0.7} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏗️ Property Details</Text>
        <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textSecondary} />
      </TouchableOpacity>
      
      {!expanded && (
        <Text style={styles.badge}>Optional — but improves match quality</Text>
      )}

      {expanded && (
        <View style={styles.content}>
          {/* COMMON PHYSICAL DETAILS */}
          {!isLand && (
            <>
              <FormInput
                label="Floor Number"
                placeholder="e.g. Ground, 1st, Top"
                value={state.floorNumber}
                onChangeText={(v) => updateState({ floorNumber: v })}
              />
              <FormInput
                label="Total Floors in Building"
                placeholder="e.g. 5"
                value={state.totalFloors}
                onChangeText={(v) => updateState({ totalFloors: v })}
                keyboardType="numeric"
              />
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Furnishing Status</Text>
                <ChipSelector
                  options={['Unfurnished', 'Semi-Furnished', 'Fully Furnished']}
                  selected={state.furnishingStatus}
                  onSelect={(v) => updateState({ furnishingStatus: v })}
                  themeColor={themeColor}
                />
              </View>
              <Stepper
                label="Bathroom / Toilet"
                value={state.bathrooms}
                onValueChange={(v) => updateState({ bathrooms: v })}
                min={1}
                max={10}
                containerStyle={styles.fieldGroup}
              />
              <Stepper
                label="Balconies"
                value={state.balconies}
                onValueChange={(v) => updateState({ balconies: v })}
                min={0}
                max={5}
                containerStyle={styles.fieldGroup}
              />
            </>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Facing Direction</Text>
            <ChipSelector
              options={['North', 'South', 'East', 'West', 'NE', 'NW', 'SE', 'SW']}
              selected={state.facing}
              onSelect={(v) => updateState({ facing: v })}
              themeColor={themeColor}
              horizontal={false}
            />
          </View>

          {state.transactionType === 'Sale' && (
            <FormInput
              label="Super Built-up Area"
              placeholder="e.g. 1200"
              value={state.superBuiltupArea}
              onChangeText={(v) => updateState({ superBuiltupArea: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              suffix="sqft"
            />
          )}

          {/* AMENITIES */}
          {!isLand && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {AMENITIES.map(amenity => {
                  const isActive = !!state.amenities[amenity.key];
                  return (
                    <TouchableOpacity
                      key={amenity.key}
                      style={[styles.amenityItem, isActive && { borderColor: themeColor, backgroundColor: `${themeColor}10` }]}
                      onPress={() => updateAmenity(amenity.key, !isActive)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons 
                        name={amenity.icon} 
                        size={20} 
                        color={isActive ? themeColor : '#64748B'} 
                        style={styles.amenityIcon} 
                      />
                      <Text style={[styles.amenityLabel, isActive && { color: themeColor, fontWeight: '600' }]}>
                        {amenity.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

        </View>
      )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#111827',
  },
  badge: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  content: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  amenityItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  amenityIcon: {
    marginRight: 8,
  },
  amenityLabel: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
});
