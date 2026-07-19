import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useAppStore } from '../../../store/appStore';

interface UnlockBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UnlockBottomSheet({ visible, onClose, onConfirm }: UnlockBottomSheetProps) {
  const { colors } = useAppTheme();
  const creditsBalance = useAppStore(s => s.creditsBalance);
  
  const cost = 1;
  const newBalance = creditsBalance - cost;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Contact Unlock Karo</Text>
      
      <View style={[styles.summaryCard, { borderColor: colors.borderFaint }]}>
        <Text style={[styles.listingTitle, { color: colors.textPrimary }]}>2BHK Flat · Vijay Nagar</Text>
        <Text style={styles.listingSub}>₹25,000/month</Text>
      </View>

      <View style={styles.costContainer}>
        <Text style={styles.costValue}>{cost} credit</Text>
        <Text style={styles.costLabel}>unlock karne ke liye</Text>
      </View>

      <View style={styles.balanceRow}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Aapka balance:</Text>
        <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>{creditsBalance} credits</Text>
      </View>
      <View style={styles.balanceRow}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Is unlock ke baad:</Text>
        <Text style={[styles.balanceValue, { color: '#10B981' }]}>{newBalance} credits</Text>
      </View>

      {newBalance === 0 && (
        <Text style={styles.warning}>⚠️ Yeh aapka last credit hoga</Text>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderFaint }]} onPress={onClose}>
          <Text style={[styles.cancelText, { color: colors.textPrimary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.unlockBtn} onPress={onConfirm}>
          <Text style={styles.unlockText}>Unlock Karo 🔓</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  summaryCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 24, backgroundColor: '#FFFFFF' },
  listingTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  listingSub: { fontSize: 13, color: '#6B7280' },
  
  costContainer: { alignItems: 'center', marginBottom: 24 },
  costValue: { fontSize: 32, fontWeight: '800', color: '#10B981', marginBottom: 4 },
  costLabel: { fontSize: 13, color: '#6B7280' },

  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  balanceLabel: { fontSize: 14 },
  balanceValue: { fontSize: 14, fontWeight: '600' },
  
  warning: { fontSize: 12, color: '#F59E0B', marginTop: 12, textAlign: 'center' },

  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  cancelBtn: { width: '45%', height: 52, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  unlockBtn: { width: '50%', height: 52, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  unlockText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
