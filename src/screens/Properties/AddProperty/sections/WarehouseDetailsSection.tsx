import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { FormInput } from '../../../../components/forms/FormInput';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { Dropdown } from '../../../../components/forms/Dropdown';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function WarehouseDetailsSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏭 Warehouse / Factory Details</Text>

      <FormInput
        label="Total Covered Area"
        placeholder="e.g. 10000"
        value={state.carpetArea}
        onChangeText={(v) => updateState({ carpetArea: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="sqft"
      />

      <FormInput
        label="Total Plot / Land Area"
        placeholder="e.g. 15000"
        value={state.plotArea}
        onChangeText={(v) => updateState({ plotArea: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="sqft"
      />

      <FormInput
        label="Ceiling Height"
        placeholder="e.g. 30"
        value={state.ceilingHeight}
        onChangeText={(v) => updateState({ ceilingHeight: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="ft"
      />

      <FormInput
        label="Road Access Width"
        placeholder="e.g. 40 (For Trucks)"
        value={state.roadAccessWidth}
        onChangeText={(v) => updateState({ roadAccessWidth: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="ft"
      />

      <Dropdown
        label="Location Type"
        options={['Industrial Area', 'Near Highway', 'Near Bypass', 'MIDC / SEZ', 'City Outskirts']}
        selected={state.commercialLocationType}
        onSelect={(v) => updateState({ commercialLocationType: v })}
        themeColor={themeColor}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Permitted Use</Text>
        <ChipSelector
          options={['Storage Only', 'Manufacturing', 'Food Processing', 'Chemicals', 'Any Use']}
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

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Loading / Unloading Dock</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.loadingDock ? 'Yes' : state.loadingDock === false ? 'No' : ''}
          onSelect={(v) => updateState({ loadingDock: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      {state.loadingDock && (
        <FormInput
          label="Number of Loading Bays"
          placeholder="e.g. 2"
          value={state.loadingDockCount}
          onChangeText={(v) => updateState({ loadingDockCount: v.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
        />
      )}

      <Dropdown
        label="Power Supply"
        options={['Single Phase', 'Three Phase']}
        selected={state.powerSupplyPhase}
        onSelect={(v) => updateState({ powerSupplyPhase: v })}
        themeColor={themeColor}
      />

      {state.powerSupplyPhase && (
        <FormInput
          label="Sanctioned Load (kW)"
          placeholder="e.g. 50"
          value={state.powerLoadKW}
          onChangeText={(v) => updateState({ powerLoadKW: v.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
        />
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Office Space Attached</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.officeSpaceAttached ? 'Yes' : state.officeSpaceAttached === false ? 'No' : ''}
          onSelect={(v) => updateState({ officeSpaceAttached: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      {state.officeSpaceAttached && (
        <FormInput
          label="Office Area"
          placeholder="e.g. 500"
          value={state.officeSpaceArea}
          onChangeText={(v) => updateState({ officeSpaceArea: v.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
          suffix="sqft"
        />
      )}
      
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Fire NOC</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.fireNOC ? 'Yes' : state.fireNOC === false ? 'No' : ''}
          onSelect={(v) => updateState({ fireNOC: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>
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
