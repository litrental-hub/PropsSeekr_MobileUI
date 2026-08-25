import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useAppStore } from '../../../store/appStore';
import { useTranslation } from 'react-i18next';

interface UnlockBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UnlockBottomSheet({ visible, onClose, onConfirm }: UnlockBottomSheetProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const creditsBalance = useAppStore(s => s.creditsBalance);
  
  const cost = 1;
  const walletReady = creditsBalance !== null;
  const newBalance = walletReady ? Math.max(0, creditsBalance - cost) : null;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t('unlock.title', 'Unlock Contact')}</Text>
      
      <View style={[styles.summaryCard, { borderColor: colors.borderFaint, backgroundColor: colors.cardBgLight }]}>
        <Text style={[styles.listingTitle, { color: colors.textPrimary }]}>2BHK Flat · Vijay Nagar</Text>
        <Text style={[styles.listingSub, { color: colors.textSecondary }]}>₹25,000/month</Text>
      </View>

      <View style={styles.costContainer}>
        <Text style={[styles.costValue, { color: colors.successText }]}>{t('unlock.costValue', '1 token')}</Text>
        <Text style={[styles.costLabel, { color: colors.textSecondary }]}>{t('unlock.costLabel', 'to unlock contact details')}</Text>
      </View>

      <View style={styles.balanceRow}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('unlock.yourBalance', 'Your balance:')}</Text>
        <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>{creditsBalance ?? '—'} {t('unlock.tokens', 'tokens')}</Text>
      </View>
      <View style={styles.balanceRow}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('unlock.newBalance', 'New Balance')}</Text>
        <Text style={[styles.balanceValue, { color: colors.successText }]}>{newBalance ?? '—'} {t('unlock.tokens', 'tokens')}</Text>
      </View>

      {walletReady && newBalance === 0 && (
        <Text style={[styles.warning, { color: colors.warningText }]}>{t('unlock.lastTokenWarning', '⚠️ This will use your last token')}</Text>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderFaint }]} onPress={onClose}>
          <Text style={[styles.cancelText, { color: colors.textPrimary }]}>{t('unlock.cancel', 'Cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.unlockBtn, { backgroundColor: colors.successText }, !walletReady && styles.unlockBtnDisabled]} onPress={onConfirm} disabled={!walletReady}>
          <Text style={styles.unlockText}>{t('unlock.confirmBtn', 'Unlock Now 🔓')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  summaryCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 24 },
  listingTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  listingSub: { fontSize: 13 },
  
  costContainer: { alignItems: 'center', marginBottom: 24 },
  costValue: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  costLabel: { fontSize: 13 },

  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  balanceLabel: { fontSize: 14 },
  balanceValue: { fontSize: 14, fontWeight: '600' },
  
  warning: { fontSize: 12, marginTop: 12, textAlign: 'center' },

  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  cancelBtn: { width: '45%', height: 52, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  unlockBtn: { width: '50%', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  unlockBtnDisabled: { opacity: 0.5 },
  unlockText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
