import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { FormInput } from '../../../../components/forms/FormInput';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function PGDetailsSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏨 PG / Hostel Details</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>PG For Whom</Text>
        <ChipSelector
          options={['Boys Only', 'Girls Only', 'Both', 'Professionals Only']}
          selected={state.pgForWhom}
          onSelect={(v) => updateState({ pgForWhom: v })}
          themeColor={themeColor}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Room Types Available</Text>
        <ChipSelector
          options={['Single', 'Double Sharing', 'Triple Sharing', 'Dormitory']}
          selected={state.roomTypeAvailable.join(', ')}
          onSelect={(v) => {
            const arr = new Set(state.roomTypeAvailable);
            if (arr.has(v)) arr.delete(v); else arr.add(v);
            updateState({ roomTypeAvailable: Array.from(arr) });
          }}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      <FormInput
        label="Total Vacancies Now"
        placeholder="e.g. 5"
        value={state.totalVacancies}
        onChangeText={(v) => updateState({ totalVacancies: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Meals Included</Text>
        <ChipSelector
          options={['None', 'Breakfast', 'Lunch', 'Dinner', 'All 3 Meals']}
          selected={state.mealsIncluded.join(', ')}
          onSelect={(v) => {
            if (v === 'None' || v === 'All 3 Meals') {
              updateState({ mealsIncluded: [v] });
            } else {
              const arr = new Set(state.mealsIncluded.filter(i => i !== 'None' && i !== 'All 3 Meals'));
              if (arr.has(v)) arr.delete(v); else arr.add(v);
              updateState({ mealsIncluded: Array.from(arr) });
            }
          }}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      {state.mealsIncluded.length > 0 && !state.mealsIncluded.includes('None') && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Meal Type</Text>
          <ChipSelector
            options={['Veg Only', 'Non-Veg Available']}
            selected={state.mealType}
            onSelect={(v) => updateState({ mealType: v })}
            themeColor={themeColor}
          />
        </View>
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Bathroom Type</Text>
        <ChipSelector
          options={['Attached', 'Shared']}
          selected={state.bathroomType}
          onSelect={(v) => updateState({ bathroomType: v })}
          themeColor={themeColor}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Wi-Fi Included</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.wifiIncluded ? 'Yes' : state.wifiIncluded === false ? 'No' : ''}
          onSelect={(v) => updateState({ wifiIncluded: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Laundry Facility</Text>
        <ChipSelector
          options={['Washing Machine', 'Hand Wash Area', 'None']}
          selected={state.laundryFacility}
          onSelect={(v) => updateState({ laundryFacility: v })}
          themeColor={themeColor}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>RO Water</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.roWater ? 'Yes' : state.roWater === false ? 'No' : ''}
          onSelect={(v) => updateState({ roWater: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Warden / Caretaker on premises</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.wardenCaretaker ? 'Yes' : state.wardenCaretaker === false ? 'No' : ''}
          onSelect={(v) => updateState({ wardenCaretaker: v === 'Yes' })}
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
