import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { MultiStateChip, ChipState } from '../../../../components/forms/MultiStateChip';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { Stepper } from '../../../../components/forms/Stepper';
import { Toggle } from '../../../../components/forms/Toggle';
import { FormInput } from '../../../../components/forms/FormInput';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

const TENANT_OPTIONS = [
  'Family', 'Working Professionals', 'Bachelor Boys', 
  'Bachelor Girls', 'Students', 'Married Couples', 
  'Unmarried Couples', 'Senior Citizens', 'Anyone Welcome'
];

const BUSINESS_OPTIONS = [
  'IT / Tech companies', 'Finance / CA / Consulting', 'Healthcare / Clinic', 
  'Education / Coaching', 'Government office', 'Any business', 
  'Retail / shop', 'Food business', 'Manufacturing'
];

export function OwnerPreferencesSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  // Helper to toggle multi-state chips for tenant preferences
  // Since we need to store 3 states, we will store them in the amenities object or a new object
  // For simplicity, let's store them in amenities as `{ 'Tenant_Family': 'allowed' | 'not_allowed' | 'ask' }`
  
  const handleTenantToggle = (opt: string) => {
    const key = `Tenant_${opt}`;
    const current = state.amenities[key] as ChipState || 'unselected';
    let next: ChipState = 'unselected';
    if (current === 'unselected') next = 'allowed';
    else if (current === 'allowed') next = 'not_allowed';
    else if (current === 'not_allowed') next = 'ask';
    
    updateState({
      amenities: { ...state.amenities, [key]: next }
    });
  };

  const getTenantState = (opt: string): ChipState => {
    return (state.amenities[`Tenant_${opt}`] as ChipState) || 'unselected';
  };

  const handleBusinessToggle = (opt: string) => {
    const key = `Business_${opt}`;
    const current = state.amenities[key] as ChipState || 'unselected';
    let next: ChipState = 'unselected';
    if (current === 'unselected') next = 'allowed';
    else if (current === 'allowed') next = 'not_allowed';
    else if (current === 'not_allowed') next = 'ask';
    
    updateState({
      amenities: { ...state.amenities, [key]: next }
    });
  };

  const getBusinessState = (opt: string): ChipState => {
    return (state.amenities[`Business_${opt}`] as ChipState) || 'unselected';
  };

  const isCommercial = 
    state.propertyType === 'Office Space' || 
    state.propertyType === 'Shop/Retail' || 
    state.propertyType === 'Warehouse' || 
    state.propertyType === 'Institution/Specialised';

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🔐 Owner Preferences</Text>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>These preferences will be visible on your listing card.</Text>
      </View>

      {!isCommercial ? (
        <>
          <Text style={styles.label}>Preferred Tenant Types</Text>
          <View style={styles.chipGrid}>
            {TENANT_OPTIONS.map(opt => (
              <MultiStateChip
                key={opt}
                label={opt}
                state={getTenantState(opt)}
                onPress={() => handleTenantToggle(opt)}
              />
            ))}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Dietary Preferences</Text>
            <ChipSelector
              options={['Veg Only', 'Non-Veg Allowed', 'Egg ok, no meat', 'No Non-Veg Cooking', 'Strictly Veg', 'Flexible']}
              selected={state.dietaryPreference}
              onSelect={(v) => updateState({ dietaryPreference: v })}
              themeColor={themeColor}
              multiSelect={false}
              horizontal={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Pet Policy</Text>
            <ChipSelector
              options={['Pets Welcome', 'Small pets ok', 'No Pets', 'No Dogs', 'Negotiable']}
              selected={state.petPolicy}
              onSelect={(v) => updateState({ petPolicy: v })}
              themeColor={themeColor}
              multiSelect={false}
              horizontal={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Minimum Lease Period</Text>
            <ChipSelector
              options={['No minimum', '6 months', '11 months', '1 year', '2 years+']}
              selected={state.minLeasePeriod}
              onSelect={(v) => updateState({ minLeasePeriod: v })}
              themeColor={themeColor}
            />
          </View>

          <Stepper
            label="Max Occupants Allowed"
            value={state.maxOccupants}
            onValueChange={(v) => updateState({ maxOccupants: v })}
            min={1}
            max={20}
            containerStyle={styles.fieldGroup}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Work From Home Allowed</Text>
            <ChipSelector
              options={['Yes', 'No', 'Poochho']}
              selected={state.wfhAllowed}
              onSelect={(v) => updateState({ wfhAllowed: v })}
              themeColor={themeColor}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Preferred Tenant Business Type</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>What kind of business can use this space?</Text>
          <View style={styles.chipGrid}>
            {BUSINESS_OPTIONS.map(opt => (
              <MultiStateChip
                key={opt}
                label={opt}
                state={getBusinessState(opt)}
                onPress={() => handleBusinessToggle(opt)}
              />
            ))}
          </View>
        </>
      )}

      <Toggle
        label="Police Verification Required"
        value={state.policeVerification}
        onValueChange={(v) => updateState({ policeVerification: v })}
        containerStyle={styles.fieldGroup}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Photo Sharing Preference</Text>
        <ChipSelector
          options={['Share freely', 'On request', 'No photos']}
          selected={state.photoPreference}
          onSelect={(v) => updateState({ photoPreference: v })}
          themeColor={themeColor}
        />
      </View>

      <FormInput
        label="Additional Notes"
        placeholder="e.g. Only vegetarians preferred, strictly no drinking."
        value={state.additionalNotes}
        onChangeText={(v) => updateState({ additionalNotes: v })}
        multiline
        numberOfLines={3}
        maxLength={200}
        containerStyle={{ marginBottom: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  banner: {
    backgroundColor: '#FFFBEB', // soft yellow
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  bannerText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500',
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
});
