import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { useAppStore } from '../../store/appStore';
import { BottomSheet } from '../../components/BottomSheet';
import { PurchaseBottomSheet } from './components/PurchaseBottomSheet';
import { UnlockBottomSheet } from './components/UnlockBottomSheet';
import { ContactRevealedModal } from './components/ContactRevealedModal';
import { getUnlockedMatches } from '../../api/matches';
import { getWallet } from '../../api/wallet';
import { useAuthStore } from '../../store/authStore';

export default function CreditsScreen() {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const creditsBalance = useAppStore(s => s.creditsBalance);
  const setCreditsBalance = useAppStore(s => s.setCreditsBalance);
  const user = useAuthStore(s => s.user);

  const [purchasePack, setPurchasePack] = useState<any>(null);
  const [unlockVisible, setUnlockVisible] = useState(false);
  const [revealedVisible, setRevealedVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [unlockedItems, setUnlockedItems] = useState<any[]>([]);

  useEffect(() => {
    getUnlockedMatches()
      .then(items => {
        if (items && items.length > 0) {
          setUnlockedItems(items);
        }
      })
      .catch(err => console.log('Failed to fetch unlocked matches history:', err?.message));
      
    if (user?.id) {
      getWallet(user.id)
        .then(res => {
          if (res && res.free_credits_balance !== undefined) {
            setCreditsBalance(res.free_credits_balance + (res.paid_credits_balance || 0));
          }
        })
        .catch(err => console.log('Failed to fetch wallet:', err?.message));
    }
  }, [user?.id, setCreditsBalance]);

  const handleBuy = (pack: any) => {
    setPurchasePack(pack);
  };

  const handlePaymentSuccess = (newBalance: number) => {
    setCreditsBalance(newBalance);
    setPurchasePack(null);
  };

  const handleUnlockMock = () => {
    setUnlockVisible(true);
  };

  const onConfirmUnlock = () => {
    setUnlockVisible(false);
    setTimeout(() => {
      setRevealedVisible(true);
    }, 400);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />
      
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('credits.title')}</Text>
          <TouchableOpacity style={styles.headerRight} activeOpacity={0.7} onPress={() => setHistoryVisible(true)}>
            <Text style={styles.historyText}>{t('credits.history')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          
          {/* LOW BALANCE BANNER */}
          {creditsBalance <= 2 && (
            <View style={styles.lowBalanceBanner}>
              <MaterialCommunityIcons name="alert" size={20} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.lowBalanceTitle}>{t('credits.lowBalanceTitle')}</Text>
                <Text style={styles.lowBalanceSub}>{t('credits.lowBalanceSub', { balance: creditsBalance })}</Text>
              </View>
              <TouchableOpacity style={styles.topUpBtn} activeOpacity={0.8} onPress={() => handleBuy(PACKS[1])}>
                <Text style={styles.topUpBtnText}>{t('credits.topUp')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SECTION 1 - CURRENT BALANCE CARD */}
          <LinearGradient
            colors={creditsBalance > 0 ? [Brand.blue, Brand.teal] : ['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>{t('credits.yourCredits')}</Text>
            <Text style={styles.balanceValue}>{creditsBalance}</Text>
            <Text style={styles.balanceSub}>{t('credits.creditsRemaining')}</Text>

            <View style={styles.balanceBottomRow}>
              <View style={styles.ratePill}>
                <Text style={[styles.ratePillText, creditsBalance === 0 && { color: '#4B5563' }]}>
                  {t('credits.perCredit', { rate: 300 })} (10 pack)
                </Text>
              </View>
              <TouchableOpacity style={styles.buyMoreBtn} activeOpacity={0.8} onPress={() => handleBuy(PACKS[1])}>
                <Text style={styles.buyMoreText}>{t('credits.buyMore')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* SECTION 2 - HOW CREDITS WORK */}
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('credits.howItWorks')}</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint, borderWidth: 1 }]}>
            <View style={styles.ruleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.emoji}>🔑</Text>
              </View>
              <View style={styles.ruleCenter}>
                <Text style={[styles.ruleTitle, { color: colors.textPrimary }]}>{t('credits.rentalProps')}</Text>
                <Text style={styles.ruleSub}>{t('credits.rentalRule')}</Text>
              </View>
              <View style={[styles.examplePill, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.exampleText, { color: '#92400E' }]} numberOfLines={1} adjustsFontSizeToFit>e.g. ₹40K → 2 cr</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />

            <View style={styles.ruleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.emoji}>🏠</Text>
              </View>
              <View style={styles.ruleCenter}>
                <Text style={[styles.ruleTitle, { color: colors.textPrimary }]}>{t('credits.buySellProps')}</Text>
                <Text style={styles.ruleSub}>{t('credits.buySellRule')}</Text>
              </View>
              <View style={[styles.examplePill, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.exampleText, { color: '#92400E' }]} numberOfLines={1} adjustsFontSizeToFit>e.g. ₹65L → 2 cr</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />

            <TouchableOpacity style={styles.ruleRow} activeOpacity={0.8} onPress={handleUnlockMock}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.emoji}>🔓</Text>
              </View>
              <View style={styles.ruleCenter}>
                <Text style={[styles.ruleTitle, { color: colors.textPrimary }]}>{t('credits.unlockDemo')}</Text>
                <Text style={styles.ruleSub}>{t('credits.unlockDemoSub')}</Text>
              </View>
              <View style={[styles.examplePill, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.exampleText, { color: '#065F46' }]} numberOfLines={1} adjustsFontSizeToFit>1 token</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* SECTION 3 - BUY CREDITS PACKS */}
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('credits.buyPacks')}</Text>
          <View style={styles.packsContainer}>
            {PACKS.map((pack, idx) => {
              const isPopular = pack.isPopular;
              return (
                <View key={pack.id} style={[
                  styles.packCard,
                  { backgroundColor: colors.cardBgLight },
                  { borderColor: isPopular ? Brand.teal : colors.borderFaint }
                ]}>
                  {isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>{t('credits.mostPopular')}</Text>
                    </View>
                  )}
                  <View style={styles.packLeft}>
                    <Text style={[styles.packName, { color: colors.textPrimary }]}>{pack.name}</Text>
                    <Text style={styles.packCredits}>{pack.credits} {t('credits.title').toLowerCase()}</Text>
                    <View style={styles.packRateRow}>
                      <Text style={[styles.packRate, { color: isPopular ? '#10B981' : colors.textDim }]}>
                        {pack.rateText}
                      </Text>
                      {pack.saving && (
                        <View style={styles.savingBadge}>
                          <Text style={styles.savingText}>{pack.saving}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.packRight}>
                    <Text style={[styles.packPrice, { color: colors.textPrimary }]}>{pack.price}</Text>
                    <TouchableOpacity
                      style={[
                        styles.packBuyBtn,
                        isPopular ? styles.packBuyBtnFilled : styles.packBuyBtnOutlined
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleBuy(pack)}
                    >
                      <Text style={[
                        styles.packBuyBtnText,
                        isPopular ? styles.packBuyBtnTextFilled : styles.packBuyBtnTextOutlined
                      ]}>
                        {t('credits.buyBtn')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* SECTION 4 - RECENT TRANSACTIONS (Hidden for now, can be re-enabled later) */}
          {false && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('credits.recentActivity')}</Text>
              <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint, borderWidth: 1 }]}>
                {TRANSACTIONS.map((txn, index) => (
                  <React.Fragment key={txn.id}>
                    {index > 0 && <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />}
                    <View style={styles.txnRow}>
                      <View style={[styles.iconCircle, { backgroundColor: txn.iconBg }]}>
                        <Text style={styles.emoji}>{txn.emoji}</Text>
                      </View>
                      <View style={styles.txnCenter}>
                        <Text style={[styles.txnTitle, { color: colors.textPrimary }]}>{txn.title}</Text>
                        <Text style={styles.txnSub}>{txn.sub}</Text>
                      </View>
                      <View style={styles.txnRight}>
                        <Text style={[styles.txnAmount, { color: txn.amountColor }]}>{txn.amount}</Text>
                        <Text style={styles.txnDate}>{txn.date}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
                <TouchableOpacity style={styles.historyLink} activeOpacity={0.7} onPress={() => setHistoryVisible(true)}>
                  <Text style={styles.historyLinkText}>{t('credits.fullHistory')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Safe padding for bottom nav */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <PurchaseBottomSheet 
        pack={purchasePack} 
        visible={!!purchasePack} 
        onClose={() => setPurchasePack(null)} 
        onSuccess={handlePaymentSuccess}
      />
      
      <UnlockBottomSheet
        visible={unlockVisible}
        onClose={() => setUnlockVisible(false)}
        onConfirm={onConfirmUnlock}
      />

      <ContactRevealedModal
        visible={revealedVisible}
        onClose={() => setRevealedVisible(false)}
      />

      <BottomSheet visible={historyVisible} onClose={() => setHistoryVisible(false)}>
        <Text style={[styles.historyModalTitle, { color: colors.textPrimary }]}>{t('credits.historyModalTitle')}</Text>
        <ScrollView style={{ maxHeight: 350, marginVertical: 12 }}>
          {(unlockedItems.length > 0 ? unlockedItems.map((item, idx) => ({
            id: item.id || `unlocked-${idx}`,
            emoji: '🔓',
            iconBg: Brand.amberLight,
            title: item.title || item.propertyTitle || item.category || 'Unlocked Broker Contact',
            sub: item.brokerName ? `${item.brokerName} (${item.mobileNumber || item.phone || ''})` : 'Contact Revealed (1 Token debit)',
            amount: '-1 token',
            amountColor: '#DC2626',
            date: item.createdAt || item.unlockedAt ? new Date(item.createdAt || item.unlockedAt).toLocaleDateString() : 'Recent'
          })) : TRANSACTIONS).map((txn, index) => (
            <React.Fragment key={`hist-${txn.id}`}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />}
              <View style={styles.txnRow}>
                <View style={[styles.iconCircle, { backgroundColor: txn.iconBg }]}>
                  <Text style={styles.emoji}>{txn.emoji}</Text>
                </View>
                <View style={styles.txnCenter}>
                  <Text style={[styles.txnTitle, { color: colors.textPrimary }]}>{txn.title}</Text>
                  <Text style={styles.txnSub}>{txn.sub}</Text>
                </View>
                <View style={styles.txnRight}>
                  <Text style={[styles.txnAmount, { color: txn.amountColor }]}>{txn.amount}</Text>
                  <Text style={styles.txnDate}>{txn.date}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.closeHistoryBtn} onPress={() => setHistoryVisible(false)}>
          <Text style={styles.closeHistoryBtnText}>{t('credits.close')}</Text>
        </TouchableOpacity>
      </BottomSheet>

    </View>
  );
}

// ── Mock Data
const PACKS = [
  { id: '1', tierId: 'CREDITS_10', name: 'Starter Pack', credits: 10, rateText: '₹300 per token', price: '₹3,000', saving: null, isPopular: false, rawPrice: 3000 },
  { id: '2', tierId: 'CREDITS_20', name: 'Standard Pack', credits: 20, rateText: '₹280 per token', price: '₹5,600', saving: 'Save ₹400', isPopular: true, rawPrice: 5600 },
  { id: '3', tierId: 'CREDITS_50', name: 'Pro Pack', credits: 50, rateText: '₹250 per token', price: '₹12,500', saving: 'Save ₹2,500', isPopular: false, rawPrice: 12500 },
];

const TRANSACTIONS = [
  { id: 't1', type: 'unlock', emoji: '🔓', iconBg: '#FEE2E2', title: 'Unlocked Contact', sub: '2BHK · Vijay Nagar', amount: '−1 token', amountColor: '#EF4444', date: 'Aaj, 2:30 PM' },
  { id: 't2', type: 'purchase', emoji: '✦', iconBg: '#D1FAE5', title: 'Tokens Purchased', sub: 'Standard Pack · 20 tokens', amount: '+20 tokens', amountColor: '#10B981', date: 'Kal, 11:00 AM' },
  { id: 't3', type: 'refund', emoji: '↩️', iconBg: '#FEF3C7', title: 'Token Refund', sub: 'Listing deleted by owner', amount: '+1 token', amountColor: '#F59E0B', date: '3 din pehle' },
];

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerLeft: { width: 60 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerRight: { width: 60, alignItems: 'flex-end' },
  historyText: { fontSize: 14, color: Brand.teal, fontWeight: '500' },
  
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 10,
  },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Banner
  lowBalanceBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    marginBottom: 16,
  },
  lowBalanceTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  lowBalanceSub: { fontSize: 12, color: '#92400E', marginTop: 2 },
  topUpBtn: { backgroundColor: '#F59E0B', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  topUpBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // Balance Card
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 13, color: '#FFF', opacity: 0.8, fontWeight: '500' },
  balanceValue: { fontSize: 52, fontWeight: '800', color: '#FFF', marginVertical: 4 },
  balanceSub: { fontSize: 14, color: '#FFF', opacity: 0.8, marginBottom: 20 },
  balanceBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratePill: { backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  ratePillText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  buyMoreBtn: { borderRadius: 20, borderWidth: 1.5, borderColor: '#FFF', paddingHorizontal: 16, paddingVertical: 6 },
  buyMoreText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  sectionLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: '600', color: '#9CA3AF', marginBottom: 8, marginLeft: 4 },
  
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  divider: { height: 1, marginVertical: 12 },

  // Rule Rows
  ruleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 16 },
  ruleCenter: { flex: 1, minWidth: 100 },
  ruleTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  ruleSub: { fontSize: 13, color: '#6B7280' },
  examplePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, maxWidth: '100%' },
  exampleText: { fontSize: 12, fontWeight: '500' },

  // Packs
  packsContainer: { marginBottom: 24, gap: 10 },
  packCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  popularBadge: {
    position: 'absolute', top: -1.5, right: -1.5,
    backgroundColor: '#10B981',
    borderBottomLeftRadius: 10, borderTopRightRadius: 14,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  popularBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  packLeft: { flex: 1 },
  packName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  packCredits: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  packRateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  packRate: { fontSize: 12, fontWeight: '500' },
  savingBadge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  savingText: { color: '#065F46', fontSize: 11, fontWeight: '600' },
  packRight: { alignItems: 'flex-end', marginLeft: 16 },
  packPrice: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  packBuyBtn: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  packBuyBtnFilled: { backgroundColor: Brand.teal },
  packBuyBtnOutlined: { borderWidth: 1.5, borderColor: Brand.teal },
  packBuyBtnText: { fontSize: 14, fontWeight: '600' },
  packBuyBtnTextFilled: { color: '#FFF' },
  packBuyBtnTextOutlined: { color: Brand.teal },

  // Txn
  txnRow: { flexDirection: 'row', alignItems: 'center', height: 56 },
  txnCenter: { flex: 1 },
  txnTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txnSub: { fontSize: 12, color: '#6B7280' },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txnDate: { fontSize: 11, color: '#9CA3AF' },
  historyLink: { marginTop: 16, alignItems: 'center' },
  historyLinkText: { fontSize: 13, color: Brand.teal, fontWeight: '500' },
  historyModalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  closeHistoryBtn: { height: 48, backgroundColor: Brand.teal, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  closeHistoryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
