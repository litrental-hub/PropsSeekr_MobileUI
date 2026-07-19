import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAddPropertyForm } from '../AddPropertyContext';
import { FormInput } from '../../../../components/forms/FormInput';
import { Toggle } from '../../../../components/forms/Toggle';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function PricingSection({ themeColor }: { themeColor: string }) {
  const { state, updateState, isSimulatingAI } = useAddPropertyForm();
  const { colors } = useAppTheme();

  if (!state.transactionType) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💰 Pricing</Text>

      {state.transactionType === 'Rent' && (
        <>
          {state.propertyType === 'PG/Hostel' ? (
            <>
              {state.roomTypeAvailable.length === 0 && (
                <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Select room types in PG Details to set rent.</Text>
              )}
              {state.roomTypeAvailable.map((room) => (
                <FormInput
                  key={room}
                  label={`Rent for ${room}`}
                  mandatory
                  placeholder="e.g. 5000"
                  value={state.rentPerBed?.[room] || ''}
                  onChangeText={(v) => updateState({ rentPerBed: { ...state.rentPerBed, [room]: v.replace(/[^0-9]/g, '') } })}
                  keyboardType="numeric"
                  prefix="₹"
                  suffix="/bed"
                />
              ))}
            </>
          ) : (
            <>
              <FormInput
                label="Monthly Rent"
                mandatory
                placeholder="e.g. 25000"
                value={state.monthlyRent}
                onChangeText={(v) => updateState({ monthlyRent: v.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                prefix="₹"
                error={!state.monthlyRent && isSimulatingAI ? 'Required — please fill' : undefined}
              />
              <Text style={styles.creditCost}>Credit cost: 10 credits to unlock</Text>
            </>
          )}

          <FormInput
            label="Security Deposit"
            placeholder="e.g. 50000"
            value={state.securityDeposit}
            onChangeText={(v) => updateState({ securityDeposit: v.replace(/[^0-9]/g, '') })}
            keyboardType="numeric"
            prefix="₹"
          />

          <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
            <Text style={styles.label}>Maintenance Charges</Text>
            <Toggle
              value={!state.maintenanceIncluded}
              onValueChange={(v) => updateState({ maintenanceIncluded: !v })}
              trueLabel="Extra"
              falseLabel="Included"
              containerStyle={{ paddingVertical: 0, borderBottomWidth: 0, flex: 1, minWidth: 150 }}
            />
          </View>
          {!state.maintenanceIncluded && (
            <FormInput
              label="Amount"
              placeholder="e.g. 2000"
              value={state.maintenanceCharges}
              onChangeText={(v) => updateState({ maintenanceCharges: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              prefix="₹"
            />
          )}
        </>
      )}

      {state.transactionType === 'Sale' && (
        <>
          <FormInput
            label="Sale Price"
            mandatory
            placeholder="e.g. 4500000"
            value={state.salePrice}
            onChangeText={(v) => updateState({ salePrice: v.replace(/[^0-9]/g, '') })}
            keyboardType="numeric"
            prefix="₹"
            error={!state.salePrice && isSimulatingAI ? 'Required — please fill' : undefined}
          />
          {!!state.salePrice && (
            <Text style={styles.autoFormat}>
              = {(parseInt(state.salePrice) / 100000).toFixed(2)} Lakhs
            </Text>
          )}
        </>
      )}
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  creditCost: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -12,
    marginBottom: 16,
  },
  autoFormat: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    marginTop: -12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});
