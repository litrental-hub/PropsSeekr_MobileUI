import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { Dropdown } from '../../../../components/forms/Dropdown';
import { FormInput } from '../../../../components/forms/FormInput';
import { PropertyType } from '../types';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';

export function BasicInfoSection({ themeColor }: { themeColor: string }) {
  const { state, updateState, isSimulatingAI } = useAddPropertyForm();
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  // Validate mandatories locally for highlights
  const missingType = !state.transactionType;
  const missingArea = !state.areaLocality.trim();
  const missingCarpet = !state.carpetArea.trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('basicInfo.title')}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('basicInfo.transactionType')} <Text style={styles.asterisk}>*</Text></Text>
        <ChipSelector
          options={[t('basicInfo.rent'), t('basicInfo.sale')]}
          selected={state.transactionType === 'Rent' ? t('basicInfo.rent') : state.transactionType === 'Sale' ? t('basicInfo.sale') : ''}
          onSelect={(v) => {
            const rawV = v === t('basicInfo.rent') ? 'Rent' : v === t('basicInfo.sale') ? 'Sale' : v;
            updateState({ transactionType: rawV as any });
          }}
          themeColor={themeColor}
          pillToggle
          style={missingType && isSimulatingAI ? styles.errorGlow : undefined}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Dropdown
          label={`${t('basicInfo.propertyType')} *`}
          options={[
            'Flat/Apartment', 'Independent House', 'Bungalow/Villa', 
            'Plot/Land', 'PG/Hostel', 'Office Space', 
            'Shop/Retail', 'Warehouse', 'Agricultural Land',
            'Institution/Specialised'
          ]}
          selected={state.propertyType || ''}
          onSelect={(v) => updateState({ propertyType: v as PropertyType })}
          themeColor={themeColor}
        />
      </View>

      <FormInput
        label={t('basicInfo.city')}
        value={state.city}
        onChangeText={(v) => updateState({ city: v })}
      />

      <FormInput
        label={t('basicInfo.areaLocality')}
        mandatory
        placeholder={t('basicInfo.areaPlaceholder')}
        value={state.areaLocality}
        onChangeText={(v) => updateState({ areaLocality: v })}
        error={missingArea && isSimulatingAI ? t('basicInfo.requiredField') : undefined}
      />
      <Text style={styles.badge}>{t('basicInfo.matchWeight35')}</Text>

      <FormInput
        label={t('basicInfo.landmark')}
        placeholder={t('basicInfo.landmarkPlaceholder')}
        value={state.landmark}
        onChangeText={(v) => updateState({ landmark: v })}
        warning={!state.landmark.trim() && isSimulatingAI ? t('basicInfo.fillForBetterMatches') : undefined}
      />

      <FormInput
        label="Project / Society Name"
        placeholder="e.g. Omaxe Hills (optional)"
        value={state.projectName}
        onChangeText={(v) => updateState({ projectName: v })}
      />

      {(state.propertyType === 'Flat/Apartment' || state.propertyType === 'Independent House' || state.propertyType === 'Bungalow/Villa') && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('basicInfo.bhk')} <Text style={styles.asterisk}>*</Text></Text>
          <ChipSelector
            options={['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '4BHK+']}
            selected={state.bhk}
            onSelect={(v) => updateState({ bhk: v })}
            themeColor={themeColor}
          />
        </View>
      )}

      {state.propertyType !== 'Plot/Land' && state.propertyType !== 'Agricultural Land' && state.propertyType !== 'PG/Hostel' && (
        <FormInput
          label={t('basicInfo.carpetArea')}
          mandatory
          placeholder={t('basicInfo.carpetPlaceholder')}
          value={state.carpetArea}
          onChangeText={(v) => updateState({ carpetArea: v.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
          suffix="sqft"
          error={missingCarpet && isSimulatingAI ? t('basicInfo.requiredField') : undefined}
        />
      )}

      <View style={styles.fieldGroup}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.label}>{t('basicInfo.availableFrom')} <Text style={styles.asterisk}>*</Text></Text>
          <TouchableOpacity 
            onPress={() => updateState({ availableFrom: new Date() })}
            style={{ backgroundColor: Brand.teal + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
          >
            <Text style={{ color: Brand.teal, fontSize: 12, fontWeight: '700' }}>⚡ Abhi se</Text>
          </TouchableOpacity>
        </View>
        <FormInput
          label=""
          placeholder="DD/MM/YYYY"
          value={state.availableFrom ? 'Today' : ''}
          onChangeText={() => {}} // Mock date picker
        />
      </View>
    </View>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  asterisk: {
    color: '#EF4444',
  },
  errorGlow: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
  },
  badge: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginTop: -10,
    marginBottom: 16,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
