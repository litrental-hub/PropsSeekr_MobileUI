import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomSheet } from '../../../components/BottomSheet';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { createOrder, verifyPayment } from '../../../api/payment';
import { useAuthStore } from '../../../store/authStore';
import { refreshWallet } from '../../../services/walletSync';

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

  const user = useAuthStore(s => s.user);

  // Safely compute derived values when pack exists
  // The backend pack price is the exact Razorpay charge and is GST-inclusive.
  const total = pack ? Number(pack.rawPrice) : 0;
  const subtotal = pack ? Math.round(total / 1.18) : 0;
  const gst = total - subtotal;

  const handlePay = async () => {
    if (!pack) return;
    if (!user?.brokerId) {
      Alert.alert('Wallet unavailable', 'Your broker wallet could not be identified. Please sign in again.');
      return;
    }
    try {
      setLoading(true);

      // 1. Create order on backend with documented master schema
      const orderRes = await createOrder({ 
        tierId: pack.tierId || `CREDITS_${pack.credits || 10}`,
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

      // Set ignoring lock before opening Razorpay Native Activity so we aren't asked for PIN when returning
      useAuthStore.getState().setIsIgnoringAppLock(true);
      
      // 3. Open Razorpay Checkout
      const data = await RazorpayCheckout.open(options);

      // Restore lock right away
      useAuthStore.getState().setIsIgnoringAppLock(false);

      // 4. Verify Payment on Backend with exact snake_case schema
      const verifyRes = await verifyPayment({
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });

      if (verifyRes.success === true) {
        // Verification only confirms payment. The wallet endpoint is authoritative.
        const updatedBal = await refreshWallet(user.brokerId, { showLoading: false });
        onSuccess(updatedBal);
      } else {
        throw new Error(verifyRes.message || 'Payment verification failed');
      }
    } catch (error: any) {
      // Restore lock if payment failed/cancelled
      useAuthStore.getState().setIsIgnoringAppLock(false);
      
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
                <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
                  {pack.credits} {t('credits.title').toLowerCase()}
                </Text>
              </View>
              <View style={[styles.ratePillBig, { backgroundColor: colors.successFaint }]}>
                <Text style={[styles.ratePillBigText, { color: colors.successText }]}>{pack.rateText}</Text>
              </View>
            </View>
            {pack.saving && (
              <View style={[styles.savingRow, { backgroundColor: colors.successFaint }]}>
                <MaterialCommunityIcons name="tag-outline" size={13} color={colors.successText} />
                <Text style={[styles.savingText, { color: colors.successText }]}>{pack.saving}</Text>
              </View>
            )}
          </View>

          {/* Price Breakdown */}
          <View style={[styles.breakdown, { borderColor: colors.borderFaint }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                ₹{subtotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('credits.gst')} (18%, included)</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                ₹{gst.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />
            <View style={styles.row}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('credits.total')}</Text>
              <Text style={[styles.totalValue, { color: colors.successText }]}>
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
                    isSelected && { backgroundColor: colors.successText, borderColor: colors.successText },
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
            style={[styles.payBtn, { backgroundColor: colors.successText, shadowColor: colors.successText }, loading && styles.payBtnDisabled]}
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
            <MaterialCommunityIcons name="lock" size={12} color={colors.textSecondary} />
            <Text style={[styles.secureText, { color: colors.textSecondary }]}>{t('credits.securedBy')}</Text>
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
  },
  ratePillBig: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  ratePillBigText: {
    fontSize: 12,
    fontWeight: '600',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  savingText: {
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
  },
  methodText: {
    fontSize: 13,
    fontWeight: '500',
  },
  methodTextActive: {
    color: '#FFF',
  },
  payBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});
