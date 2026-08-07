import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../../store/appStore';

interface ContactRevealedModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ContactRevealedModal({ visible, onClose }: ContactRevealedModalProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const creditsBalance = useAppStore(s => s.creditsBalance);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
        speed: 14,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.navy }]}>
        
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <MaterialCommunityIcons name="check" size={40} color="#10B981" />
        </Animated.View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('unlock.successTitle', 'Contact Unlocked!')}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{t('unlock.successSub', 'You can now contact directly')}</Text>

        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>RS</Text>
            </View>
            <View>
              <Text style={[styles.name, { color: colors.textPrimary }]}>Rajesh Sharma</Text>
              <Text style={styles.role}>{t('unlock.role', 'Property Owner')}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />

          <View style={styles.contactRow}>
            <Text style={styles.contactEmoji}>📞</Text>
            <Text style={[styles.contactValue, { color: colors.textPrimary }]}>+91 98765 43210</Text>
          </View>

          <View style={styles.contactRow}>
            <Text style={styles.contactEmoji}>💬</Text>
            <Text style={[styles.contactValue, { color: '#25D366' }]}>{t('unlock.waAvailable', 'WhatsApp available')}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
          <Text style={styles.callBtnText}>{t('unlock.callNow', '📞 Call Now')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.waBtn} activeOpacity={0.8}>
          <Text style={styles.waBtnText}>{t('unlock.waBtn', '💬 WhatsApp Now')}</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>{t('unlock.footerText', { remaining: creditsBalance, defaultValue: `1 token spent · ${creditsBalance} tokens remaining` })}</Text>

        <TouchableOpacity onPress={onClose} style={styles.backLink}>
          <Text style={styles.backLinkText}>{t('unlock.backLink', 'Back to listing →')}</Text>
        </TouchableOpacity>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, marginBottom: 32, textAlign: 'center' },

  card: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700' },
  role: { fontSize: 13, color: '#6B7280' },
  divider: { height: 1, marginVertical: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  contactEmoji: { fontSize: 16, marginRight: 12 },
  contactValue: { fontSize: 15, fontWeight: '600' },

  callBtn: { width: '100%', height: 52, backgroundColor: '#10B981', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  callBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  waBtn: { width: '100%', height: 52, backgroundColor: '#25D366', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  waBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  footerText: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },
  backLink: { padding: 8 },
  backLinkText: { fontSize: 13, color: '#10B981', fontWeight: '500' },
});
