import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { FormInput } from '../../../../components/forms/FormInput';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { Dropdown } from '../../../../components/forms/Dropdown';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function InstitutionDetailsSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏥 Institution / Specialised Details</Text>

      <Dropdown
        label="Property Subtype"
        options={['Hotel', 'Guest House', 'Hospital', 'Clinic', 'School', 'College', 'Banquet Hall', 'Petrol Pump']}
        selected={state.propertySubtype}
        onSelect={(v) => updateState({ propertySubtype: v })}
        themeColor={themeColor}
      />

      <FormInput
        label="Total Area"
        placeholder="e.g. 20000"
        value={state.carpetArea}
        onChangeText={(v) => updateState({ carpetArea: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="sqft"
      />

      <FormInput
        label={
          state.propertySubtype === 'Hotel' || state.propertySubtype === 'Guest House' ? 'Number of Rooms' :
          state.propertySubtype === 'Hospital' || state.propertySubtype === 'Clinic' ? 'Number of Beds' :
          state.propertySubtype === 'School' || state.propertySubtype === 'College' ? 'Number of Seats / Capacity' :
          'Capacity (Pax)'
        }
        placeholder="e.g. 50"
        value={state.capacityCount}
        onChangeText={(v) => updateState({ capacityCount: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
      />

      <FormInput
        label="Number of Floors"
        placeholder="e.g. 4"
        value={state.totalFloors}
        onChangeText={(v) => updateState({ totalFloors: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Currently Operational?</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.currentlyOperational ? 'Yes' : state.currentlyOperational === false ? 'No' : ''}
          onSelect={(v) => updateState({ currentlyOperational: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Is this a running business or bare property?</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Licenses / Permits Available</Text>
        <ChipSelector
          options={['Fire NOC', 'Health License', 'Food License', 'Liquor License', 'Education Affiliation']}
          selected={state.licensesAvailable.join(', ')}
          onSelect={(v) => {
            const arr = new Set(state.licensesAvailable);
            if (arr.has(v)) arr.delete(v); else arr.add(v);
            updateState({ licensesAvailable: Array.from(arr) });
          }}
          themeColor={themeColor}
          pillToggle
          horizontal={false}
        />
      </View>

      <FormInput
        label="Parking Capacity (Cars/Bikes)"
        placeholder="e.g. 50 Cars, 100 Bikes"
        value={state.parkingCapacity}
        onChangeText={(v) => updateState({ parkingCapacity: v })}
      />

      <FormInput
        label="Heavy Power Supply (kVA)"
        placeholder="e.g. 200"
        value={state.heavyPowerSupplyKVA}
        onChangeText={(v) => updateState({ heavyPowerSupplyKVA: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="kVA"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
});
