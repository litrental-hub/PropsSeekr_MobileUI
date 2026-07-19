import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { FormInput } from '../../../../components/forms/FormInput';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function HouseDetailsSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏠 House Details</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FormInput
            label="Plot Area"
            value={state.plotArea}
            onChangeText={(v) => updateState({ plotArea: v.replace(/[^0-9]/g, '') })}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1, paddingTop: 24, paddingLeft: 8 }}>
          <ChipSelector
            options={['sqft', 'sqmtr', 'gaj']}
            selected={state.plotAreaUnit || 'sqft'}
            onSelect={(v) => updateState({ plotAreaUnit: v })}
            themeColor={themeColor}
            pillToggle
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Number of Floors in House</Text>
        <ChipSelector
          options={['G', 'G+1', 'G+2', 'G+3', 'G+4+']}
          selected={state.numberOfFloors}
          onSelect={(v) => updateState({ numberOfFloors: v })}
          themeColor={themeColor}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Number of Bedrooms</Text>
        <ChipSelector
          options={['1', '2', '3', '4', '5', '6+']}
          selected={state.numberOfBedrooms?.toString()}
          onSelect={(v) => updateState({ numberOfBedrooms: parseInt(v) })}
          themeColor={themeColor}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Rental / Occupancy Type</Text>
        <ChipSelector
          options={['Full House', 'Ground Floor Only', 'First Floor Only', 'Portion']}
          selected={state.rentalType}
          onSelect={(v) => updateState({ rentalType: v })}
          themeColor={themeColor}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Separate Entrance</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.separateEntrance ? 'Yes' : state.separateEntrance === false ? 'No' : ''}
          onSelect={(v) => updateState({ separateEntrance: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Garden / Lawn</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.gardenLawn ? 'Yes' : state.gardenLawn === false ? 'No' : ''}
          onSelect={(v) => updateState({ gardenLawn: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      {state.gardenLawn && (
        <FormInput
          label="Garden Area (sqft)"
          value={state.gardenArea}
          onChangeText={(v) => updateState({ gardenArea: v.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
        />
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Terrace Access</Text>
        <ChipSelector
          options={['Private', 'Shared', 'None']}
          selected={state.terraceType}
          onSelect={(v) => {
            updateState({ terraceType: v, terraceAccess: v !== 'None' });
          }}
          themeColor={themeColor}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Personal Borewell</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.boreWell ? 'Yes' : state.boreWell === false ? 'No' : ''}
          onSelect={(v) => updateState({ boreWell: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Boundary Wall</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.boundaryWall ? 'Yes' : state.boundaryWall === false ? 'No' : ''}
          onSelect={(v) => updateState({ boundaryWall: v === 'Yes' })}
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
  row: {
    flexDirection: 'row',
  }
});
