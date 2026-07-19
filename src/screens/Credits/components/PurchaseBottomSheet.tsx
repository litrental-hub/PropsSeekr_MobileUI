import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomSheet } from '../../../components/BottomSheet';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';

interface PurchaseBottomSheetProps {
  pack: any;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseBottomSheet({ pack, visible, onClose, onSuccess }: PurchaseBottomSheetProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  if (!pack) return null;

  const gst = Math.round(pack.rawPrice * 0.18);
  const total = pack.rawPrice + gst;

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1500);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t('credits.buyCreditsTitle')}</Text>
      
      <View style={[styles.summaryCard, { backgroundColor: colors.cardBgLight }]}>
        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{pack.name}</Text>
        <Text style={styles.summarySub}>{pack.credits} {t('credits.title').toLowerCase()}</Text>
        <Text style={[styles.summaryRate, { color: '#10B981' }]}>{pack.rateText}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />

      <View style={styles.breakdown}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('credits.title')}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{pack.credits}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('credits.perCredit', { rate: Math.round(pack.rawPrice / pack.credits) })}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}></Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('credits.subtotal')}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>₹{pack.rawPrice.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('credits.gst')}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>₹{gst.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.borderFaint, marginVertical: 12 }]} />
        <View style={styles.row}>
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('credits.total')}</Text>
          <Text style={[styles.totalValue, { color: colors.textPrimary }]}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <Text style={styles.payViaLabel}>{t('credits.payVia')}</Text>
      <View style={styles.methodsRow}>
        {['UPI', 'Card', 'Net Banking'].map(m => {
          const isSelected = paymentMethod === m;
          return (
            <TouchableOpacity 
              key={m}
              style={[
                styles.methodChip,
                isSelected ? styles.methodChipActive : { borderColor: colors.borderFaint }
              ]}
              onPress={() => setPaymentMethod(m)}
              disabled={loading}
            >
              <Text style={[
                styles.methodText,
                isSelected ? styles.methodTextActive : { color: colors.textSecondary }
              ]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity 
        style={[styles.payBtn, loading && styles.payBtnDisabled]} 
        activeOpacity={0.8}
        onPress={handlePay}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.payBtnText}>{t('credits.payBtn', { amount: total.toLocaleString('en-IN') })}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.secureFooter}>
        <MaterialCommunityIcons name="lock" size={12} color="#9CA3AF" />
        <Text style={styles.secureText}>{t('credits.securedBy')}</Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  summaryCard: { borderRadius: 12, padding: 16 },
  summaryTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  summarySub: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  summaryRate: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 16 },
  breakdown: { marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '500' },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 16, fontWeight: '800' },
  
  payViaLabel: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  methodsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  methodChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  methodChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  methodText: { fontSize: 13, fontWeight: '500' },
  methodTextActive: { color: '#FFF' },

  payBtn: { backgroundColor: '#10B981', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secureFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 4 },
  secureText: { fontSize: 12, color: '#9CA3AF' },
});
