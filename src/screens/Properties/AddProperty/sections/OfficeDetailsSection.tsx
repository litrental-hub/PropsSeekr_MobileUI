import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { FormInput } from '../../../../components/forms/FormInput';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { Dropdown } from '../../../../components/forms/Dropdown';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function OfficeDetailsSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏢 Office Details</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Office Type</Text>
        <ChipSelector
          options={['Ready to move', 'Bare shell', 'Co-working', 'Virtual office']}
          selected={state.officeType}
          onSelect={(v) => updateState({ officeType: v })}
          themeColor={themeColor}
          horizontal={false}
        />
      </View>

      <FormInput
        label="Carpet Area"
        placeholder="e.g. 1500"
        value={state.carpetArea}
        onChangeText={(v) => updateState({ carpetArea: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        suffix="sqft"
      />

      <Dropdown
        label="Office Floor"
        options={['Ground', '1st', '2nd', '3rd', '4th', '5th+']}
        selected={state.floorNumber}
        onSelect={(v) => updateState({ floorNumber: v })}
        themeColor={themeColor}
      />

      <Dropdown
        label="Lease Lock-in Period"
        options={['No lock-in', '1 Year', '2 Years', '3 Years', '5 Years+']}
        selected={state.leaseLockIn}
        onSelect={(v) => updateState({ leaseLockIn: v })}
        themeColor={themeColor}
      />

      <FormInput
        label="Rent Escalation (Annual %)"
        placeholder="e.g. 5"
        value={state.rentEscalation}
        onChangeText={(v) => updateState({ rentEscalation: v })}
        keyboardType="numeric"
        suffix="%"
      />

      <Dropdown
        label="AC Type"
        options={['None', 'Split AC', 'Central HVAC']}
        selected={state.acType}
        onSelect={(v) => updateState({ acType: v })}
        themeColor={themeColor}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Power Backup</Text>
        <ChipSelector
          options={['Full', 'Partial', 'None']}
          selected={state.powerBackupKW ? (state.powerBackupKW === '0' ? 'None' : 'Full') : ''}
          onSelect={(v) => updateState({ powerBackupKW: v === 'None' ? '0' : '' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      {state.powerBackupKW !== '0' && (
        <FormInput
          label="Power Backup Capacity (kW)"
          placeholder="e.g. 10"
          value={state.powerBackupKW}
          onChangeText={(v) => updateState({ powerBackupKW: v.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
        />
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Reception / Lobby</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.receptionLobby ? 'Yes' : state.receptionLobby === false ? 'No' : ''}
          onSelect={(v) => updateState({ receptionLobby: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Cafeteria Nearby</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.cafeteriaNearby ? 'Yes' : state.cafeteriaNearby === false ? 'No' : ''}
          onSelect={(v) => updateState({ cafeteriaNearby: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>
      
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Fire NOC Available</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.fireNOC ? 'Yes' : state.fireNOC === false ? 'No' : ''}
          onSelect={(v) => updateState({ fireNOC: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>OC / Completion Cert.</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.ocCert ? 'Yes' : state.ocCert === false ? 'No' : ''}
          onSelect={(v) => updateState({ ocCert: v === 'Yes' })}
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
