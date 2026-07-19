import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { FormInput } from '../../../../components/forms/FormInput';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function PlotDetailsSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📐 Plot Details</Text>

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
            selected={state.plotAreaUnit}
            onSelect={(v) => updateState({ plotAreaUnit: v })}
            themeColor={themeColor}
            pillToggle
          />
        </View>
      </View>

      <FormInput
        label="Plot Dimensions (L × W)"
        placeholder="e.g. 30 × 60 ft"
        value={state.plotDimensions}
        onChangeText={(v) => updateState({ plotDimensions: v })}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Facing Direction</Text>
        <ChipSelector
          options={['North', 'South', 'East', 'West', 'Corner Plot']}
          selected={state.facing}
          onSelect={(v) => updateState({ facing: v })}
          themeColor={themeColor}
        />
      </View>

      <FormInput
        label="Road Width (ft)"
        placeholder="e.g. 30"
        value={state.roadWidth}
        onChangeText={(v) => updateState({ roadWidth: v.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Zone / Classification</Text>
        <ChipSelector
          options={['Residential', 'Commercial', 'Mixed', 'NA Converted']}
          selected={state.zoneClassification}
          onSelect={(v) => updateState({ zoneClassification: v })}
          themeColor={themeColor}
        />
      </View>

      <FormInput
        label="Society / Colony Name"
        value={state.societyColonyName}
        onChangeText={(v) => updateState({ societyColonyName: v })}
      />

      <FormInput
        label="Plot Number"
        value={state.plotNumber}
        onChangeText={(v) => updateState({ plotNumber: v })}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>RERA Registered</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.reraRegistered ? 'Yes' : state.reraRegistered === false ? 'No' : ''}
          onSelect={(v) => updateState({ reraRegistered: v === 'Yes' })}
          themeColor={themeColor}
          pillToggle
        />
      </View>

      {state.reraRegistered && (
        <FormInput
          label="RERA Number"
          value={state.reraNumber}
          onChangeText={(v) => updateState({ reraNumber: v })}
        />
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Title Status</Text>
        <ChipSelector
          options={['Clear Title', 'Disputed', 'Under Process']}
          selected={state.clearTitle}
          onSelect={(v) => updateState({ clearTitle: v })}
          themeColor={themeColor}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Construction Allowed</Text>
        <ChipSelector
          options={['Yes', 'No']}
          selected={state.constructionAllowed ? 'Yes' : state.constructionAllowed === false ? 'No' : ''}
          onSelect={(v) => updateState({ constructionAllowed: v === 'Yes' })}
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
