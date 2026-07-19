import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { FormInput } from '../../../../components/forms/FormInput';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { Dropdown } from '../../../../components/forms/Dropdown';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function ShopDetailsSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏪 Shop / Retail Details</Text>

      <FormInput
        label="Shop Area"
        placeholder="e.g. 500"
        value={state.carpetArea}
        onChangeText={(v) => updateState({ carpetArea: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="sqft"
      />

      <FormInput
        label="Shop Frontage (Width)"
        placeholder="e.g. 15"
        value={state.shopFrontage}
        onChangeText={(v) => updateState({ shopFrontage: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="ft"
      />

      <Dropdown
        label="Location Type"
        options={['Main Road', 'Market Complex', 'Mall', 'Basement', 'Corner Shop']}
        selected={state.commercialLocationType}
        onSelect={(v) => updateState({ commercialLocationType: v })}
        themeColor={themeColor}
      />

      <Dropdown
        label="Footfall Level"
        options={['High Footfall', 'Medium', 'Residential Area', 'Industrial Area']}
        selected={state.footfallLevel}
        onSelect={(v) => updateState({ footfallLevel: v })}
        themeColor={themeColor}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Permitted Business Types</Text>
        <ChipSelector
          options={['Any', 'Food', 'Pharmacy', 'Clothing', 'Electronics', 'Bank', 'Salon', 'Gym', 'No Food', 'No Bar']}
          selected={state.permittedBusiness.join(', ')}
          onSelect={(v) => {
            const arr = new Set(state.permittedBusiness);
            if (arr.has(v)) arr.delete(v); else arr.add(v);
            updateState({ permittedBusiness: Array.from(arr) });
          }}
          themeColor={themeColor}
          pillToggle
          horizontal={false}
        />
      </View>

      <FormInput
        label="Sanctioned Power Load (kW)"
        placeholder="e.g. 10"
        value={state.powerLoadKW}
        onChangeText={(v) => updateState({ powerLoadKW: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
      />

      <Dropdown
        label="Lease Lock-in Period"
        options={['None', '6 Months', '1 Year', '2 Years', '3 Years+']}
        selected={state.leaseLockIn}
        onSelect={(v) => updateState({ leaseLockIn: v })}
        themeColor={themeColor}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Washroom Available</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.washroomAvailable ? 'Yes' : state.washroomAvailable === false ? 'No' : ''}
          onSelect={(v) => updateState({ washroomAvailable: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Storage / Godown Attached</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.storageAttached ? 'Yes' : state.storageAttached === false ? 'No' : ''}
          onSelect={(v) => updateState({ storageAttached: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      {state.storageAttached && (
        <FormInput
          label="Storage Area"
          placeholder="e.g. 200"
          value={state.storageArea}
          onChangeText={(v) => updateState({ storageArea: v.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
          suffix="sqft"
        />
      )}
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
