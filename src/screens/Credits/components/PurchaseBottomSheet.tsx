import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomSheet } from '../../../components/BottomSheet';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { createOrder, verifyPayment } from '../../../api/payment';
import { useAuthStore } from '../../../store/authStore';
import { useAppStore } from '../../../store/appStore';

interface PurchaseBottomSheetProps {
  pack: any;
  visible: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export function PurchaseBottomSheet({ pack, visible, onClose, onSuccess }: PurchaseBottomSheetProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const setCreditsBalance = useAppStore(s => s.setCreditsBalance);
  const user = useAuthStore(s => s.user);

  // Safely compute derived values when pack exists
  const gst = pack ? Math.round(pack.rawPrice * 0.18) : 0;
  const total = pack ? pack.rawPrice + gst : 0;

  const handlePay = async () => {
    if (!pack) return;
    try {
      setLoading(true);

      // 1. Create order on backend with documented master schema
      const orderRes = await createOrder({ 
        tierId: pack.tierId || pack.id || `token_pkg_${pack.credits || 5}`,
        packageId: pack.tierId || pack.id || `token_pkg_${pack.credits || 5}`,
        tokenAmount: Number(pack.credits) || 5,
        amountInRupees: total,
      });

      // 2. Setup Razorpay options
      const options = {
        description: `Purchase ${pack.credits} Tokens`,
        image: 'https://i.imgur.com/3g7nmJC.jpg',
        currency: orderRes.currency || 'INR',
        key: orderRes.keyId || orderRes.razorpayKeyId || 'rzp_test_fallback',
        amount: orderRes.amountInPaise || (orderRes.amount ? orderRes.amount * 100 : total * 100),
        name: 'PropSeekr',
        order_id: orderRes.razorpayOrderId || orderRes.orderId || '',
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.name || '',
        },
        theme: { color: '#10B981' },
      };

      // 3. Open Razorpay Checkout
      const data = await RazorpayCheckout.open(options);

      // 4. Verify Payment on Backend with exact camelCase schema
      const verifyRes = await verifyPayment({
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
        RazorpayOrderId: data.razorpay_order_id,
        RazorpayPaymentId: data.razorpay_payment_id,
        RazorpaySignature: data.razorpay_signature,
      });

      const isSuccessful = verifyRes.success || verifyRes.status === 'SUCCESS' || verifyRes.status === 'success' || verifyRes.newBalance !== undefined || verifyRes.creditsBalance !== undefined;
      if (isSuccessful) {
        const updatedBal = verifyRes.newBalance ?? verifyRes.creditsBalance ?? (useAppStore.getState().creditsBalance + Number(pack.credits || 0));
        useAppStore.getState().setCreditsBalance(updatedBal);
        onSuccess(updatedBal);
      } else {
        throw new Error(verifyRes.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.log('Payment Error:', error);
      console.log('Backend Error Body:', error?.response?.data);
      
      // Extract backend error message if this is an Axios error (400 Bad Request, etc.)
      const backendError = error?.response?.data?.message || error?.response?.data?.error;
      const errorMsg = backendError || error?.description || error?.message || 'Payment was cancelled or failed.';
      Alert.alert('Payment Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {pack ? t('credits.buyCreditsTitle') : ''}
      </Text>

      {pack && (
        <>
          {/* Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBgLight }]}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{pack.name}</Text>
                <Text style={styles.summarySub}>
                  {pack.credits} {t('credits.title').toLowerCase()}
                </Text>
              </View>
              <View style={styles.ratePillBig}>
                <Text style={styles.ratePillBigText}>{pack.rateText}</Text>
              </View>
            </View>
            {pack.saving && (
              <View style={styles.savingRow}>
                <MaterialCommunityIcons name="tag-outline" size={13} color="#065F46" />
                <Text style={styles.savingText}>{pack.saving}</Text>
              </View>
            )}
          </View>

          {/* Price Breakdown */}
          <View style={[styles.breakdown, { borderColor: colors.borderFaint }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                ₹{pack.rawPrice.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('credits.gst')} (18%)</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                ₹{gst.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />
            <View style={styles.row}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('credits.total')}</Text>
              <Text style={[styles.totalValue, { color: '#10B981' }]}>
                ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Payment Method Selector */}
          <Text style={[styles.payViaLabel, { color: colors.textSecondary }]}>{t('credits.payVia')}</Text>
          <View style={styles.methodsRow}>
            {['UPI', 'Card', 'Net Banking'].map(m => {
              const isSelected = paymentMethod === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.methodChip,
                    { borderColor: colors.borderFaint },
                    isSelected && styles.methodChipActive,
                  ]}
                  onPress={() => setPaymentMethod(m)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.methodText,
                      { color: colors.textSecondary },
                      isSelected && styles.methodTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pay Button */}
          <TouchableOpacity
            style={[styles.payBtn, loading && styles.payBtnDisabled]}
            activeOpacity={0.85}
            onPress={handlePay}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.payBtnText}>
                {t('credits.payBtn', { amount: total.toLocaleString('en-IN') })}
              </Text>
            )}
          </TouchableOpacity>

          {/* Secure Footer */}
          <View style={styles.secureFooter}>
            <MaterialCommunityIcons name="lock" size={12} color="#9CA3AF" />
            <Text style={styles.secureText}>{t('credits.securedBy')}</Text>
          </View>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  summarySub: {
    fontSize: 13,
    color: '#6B7280',
  },
  ratePillBig: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  ratePillBigText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  savingText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  breakdown: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  payViaLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  methodChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  methodChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  methodText: {
    fontSize: 13,
    fontWeight: '500',
  },
  methodTextActive: {
    color: '#FFF',
  },
  payBtn: {
    backgroundColor: '#10B981',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnDisabled: {
    opacity: 0.65,
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 4,
  },
  secureText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
