import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
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
import { CreditTransaction, getCreditTransactions } from '../../api/wallet';
import { useAuthStore } from '../../store/authStore';
import { useFocusEffect } from '@react-navigation/native';
import { refreshWallet } from '../../services/walletSync';
import {
  CreditPackViewModel,
  loadCreditPacks,
  mapCreditPacksForDisplay,
  readCachedCreditPacks,
} from '../../services/creditPacksCache';

interface TransactionRow {
  id: string;
  emoji: string;
  iconBg: string;
  title: string;
  sub: string;
  amount: string;
  amountColor: string;
  date: string;
}

const mapTransaction = (transaction: CreditTransaction, colors: any): TransactionRow => {
  const type = transaction.type.trim().toLowerCase();
  const isDebit = ['deduct', 'debit', 'reveal', 'expiry'].includes(type);
  const titleByType: Record<string, string> = {
    purchase: 'Tokens Purchased',
    grant: 'Tokens Granted',
    refund: 'Token Refund',
    deduct: 'Contact Unlocked',
    debit: 'Contact Unlocked',
    reveal: 'Contact Unlocked',
    expiry: 'Tokens Expired',
  };
  return {
    id: String(transaction.id),
    emoji: isDebit ? '🔓' : type === 'refund' ? '↩️' : '✦',
    iconBg: isDebit ? colors.errorFaint : colors.successFaint,
    title: titleByType[type] || 'Wallet adjustment',
    sub: transaction.notes || transaction.reference_type || 'Wallet transaction',
    amount: `${isDebit ? '−' : '+'}${Math.abs(transaction.amount)} token${Math.abs(transaction.amount) === 1 ? '' : 's'}`,
    amountColor: isDebit ? colors.errorText : colors.successText,
    date: new Date(transaction.created_at).toLocaleString(),
  };
};

export default function CreditsScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const creditsBalance = useAppStore(s => s.creditsBalance);
  const freeCreditsBalance = useAppStore(s => s.freeCreditsBalance);
  const paidCreditsBalance = useAppStore(s => s.paidCreditsBalance);
  const walletStatus = useAppStore(s => s.walletStatus);
  const walletError = useAppStore(s => s.walletError);
  const walletBrokerId = useAppStore(s => s.walletBrokerId);
  const user = useAuthStore(s => s.user);

  const initialCachedPacks = React.useMemo(
    () => mapCreditPacksForDisplay(readCachedCreditPacks()?.packs ?? []),
    [],
  );
  const [purchasePack, setPurchasePack] = useState<CreditPackViewModel | null>(null);
  const [unlockVisible, setUnlockVisible] = useState(false);
  const [revealedVisible, setRevealedVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [packs, setPacks] = useState<CreditPackViewModel[]>(initialCachedPacks);
  const [packsError, setPacksError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.brokerId) {
        refreshWallet(user.brokerId).catch(error => {
          console.warn('Failed to fetch wallet:', error?.message);
        });
        setHistoryLoading(true);
        setHistoryError(null);
        getCreditTransactions(user.brokerId)
          .then(result => setTransactions(result.transactions.map(txn => mapTransaction(txn, colors))))
          .catch(error => setHistoryError(error?.response?.data?.message || error?.message || 'Could not load token history.'))
          .finally(() => setHistoryLoading(false));
      }

      // Render the persistent cache immediately. Fresh caches avoid the network;
      // stale caches remain visible while one deduplicated refresh runs.
      loadCreditPacks()
        .then(result => {
          setPacksError(null);
          setPacks(mapCreditPacksForDisplay(result.packs));
        })
        .catch(err => {
          setPacksError(err?.response?.data?.message || err?.message || 'Could not load token packs.');
        });
    }, [colors, user?.brokerId])
  );

  const handleBuy = (pack?: CreditPackViewModel) => {
    if (!pack) {
      setPacksError('Token packs are still loading. Please try again.');
      return;
    }
    setPurchasePack(pack);
  };

  const handlePaymentSuccess = (newBalance: number) => {
    setPurchasePack(null);
    Alert.alert('Payment Successful', `Your wallet now has ${newBalance} tokens.`);
  };

  const walletBelongsToUser = !!user?.brokerId && walletBrokerId === String(user.brokerId);
  const displayedBalance = walletBelongsToUser ? creditsBalance : null;
  const retryWallet = () => {
    if (user?.brokerId) refreshWallet(user.brokerId).catch(() => undefined);
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

      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('credits.title')}</Text>
          <TouchableOpacity style={styles.headerRight} activeOpacity={0.7} onPress={() => setHistoryVisible(true)}>
            <Text style={styles.historyText} numberOfLines={1}>{t('credits.history')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          
          {/* LOW BALANCE BANNER */}
          {walletStatus === 'error' && walletError && (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorFaint, borderColor: colors.errorText }]}>
              <MaterialCommunityIcons name="cloud-alert-outline" size={20} color={colors.errorText} />
              <Text style={[styles.errorText, { color: colors.errorText }]}>{walletError}</Text>
              <TouchableOpacity onPress={retryWallet} style={styles.retryButton}>
                <Text style={[styles.retryText, { color: colors.errorText }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {displayedBalance !== null && displayedBalance <= 2 && (
            <View style={[styles.lowBalanceBanner, { backgroundColor: colors.warningFaint, borderColor: colors.warningText }]}>
              <MaterialCommunityIcons name="alert" size={20} color={colors.warningText} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.lowBalanceTitle, { color: colors.warningText }]}>{t('credits.lowBalanceTitle')}</Text>
                <Text style={[styles.lowBalanceSub, { color: colors.warningText }]}>{t('credits.lowBalanceSub', { balance: displayedBalance })}</Text>
              </View>
              <TouchableOpacity style={[styles.topUpBtn, { backgroundColor: colors.warningText }]} activeOpacity={0.8} onPress={() => handleBuy(packs[1] || packs[0])}>
                <Text style={styles.topUpBtnText}>{t('credits.topUp')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SECTION 1 - CURRENT BALANCE CARD */}
          <LinearGradient
            colors={displayedBalance !== null && displayedBalance > 0 ? [Brand.blue, Brand.teal] : ['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>{t('credits.yourCredits')}</Text>
            {displayedBalance === null ? (
              <ActivityIndicator style={styles.balanceLoader} color="#FFF" size="large" />
            ) : (
              <Text style={styles.balanceValue}>{displayedBalance}</Text>
            )}
            <Text style={styles.balanceSub}>{t('credits.creditsRemaining')}</Text>
            {walletBelongsToUser && freeCreditsBalance !== null && paidCreditsBalance !== null && (
              <Text style={styles.balanceBreakdown}>Free {freeCreditsBalance}  ·  Paid {paidCreditsBalance}</Text>
            )}

            <View style={styles.balanceBottomRow}>
              <View style={styles.ratePill}>
                <Text style={[styles.ratePillText, displayedBalance === 0 && { color: colors.textSecondary }]}>
                  {t('credits.perCredit', { rate: 300 })} (10 pack)
                </Text>
              </View>
              <TouchableOpacity style={styles.buyMoreBtn} activeOpacity={0.8} onPress={() => handleBuy(packs[1] || packs[0])}>
                <Text style={styles.buyMoreText}>{t('credits.buyMore')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* SECTION 2 - HOW CREDITS WORK */}
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('credits.howItWorks')}</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint, borderWidth: 1 }]}>
            <View style={styles.ruleRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.successFaint }]}>
                <Text style={styles.emoji}>🔑</Text>
              </View>
              <View style={styles.ruleCenter}>
                <Text style={[styles.ruleTitle, { color: colors.textPrimary }]}>{t('credits.rentalProps')}</Text>
                <Text style={[styles.ruleSub, { color: colors.textSecondary }]}>{t('credits.rentalRule')}</Text>
              </View>
              <View style={[styles.examplePill, { backgroundColor: colors.warningFaint }]}>
                <Text style={[styles.exampleText, { color: colors.warningText }]} numberOfLines={1} adjustsFontSizeToFit>e.g. ₹40K → 2 cr</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />

            <View style={styles.ruleRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.infoFaint }]}>
                <Text style={styles.emoji}>🏠</Text>
              </View>
              <View style={styles.ruleCenter}>
                <Text style={[styles.ruleTitle, { color: colors.textPrimary }]}>{t('credits.buySellProps')}</Text>
                <Text style={[styles.ruleSub, { color: colors.textSecondary }]}>{t('credits.buySellRule')}</Text>
              </View>
              <View style={[styles.examplePill, { backgroundColor: colors.warningFaint }]}>
                <Text style={[styles.exampleText, { color: colors.warningText }]} numberOfLines={1} adjustsFontSizeToFit>e.g. ₹65L → 2 cr</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />

            <TouchableOpacity style={styles.ruleRow} activeOpacity={0.8} onPress={handleUnlockMock}>
              <View style={[styles.iconCircle, { backgroundColor: colors.errorFaint }]}>
                <Text style={styles.emoji}>🔓</Text>
              </View>
              <View style={styles.ruleCenter}>
                <Text style={[styles.ruleTitle, { color: colors.textPrimary }]}>{t('credits.unlockDemo')}</Text>
                <Text style={[styles.ruleSub, { color: colors.textSecondary }]}>{t('credits.unlockDemoSub')}</Text>
              </View>
              <View style={[styles.examplePill, { backgroundColor: colors.successFaint }]}>
                <Text style={[styles.exampleText, { color: colors.successText }]} numberOfLines={1} adjustsFontSizeToFit>1 token</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* SECTION 3 - BUY CREDITS PACKS */}
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('credits.buyPacks')}</Text>
          {packsError && <Text style={styles.inlineError}>{packsError}</Text>}
          <View style={styles.packsContainer}>
            {packs.map(pack => {
              const isPopular = pack.isPopular;
              return (
                <View key={pack.id} style={[
                  styles.packCard,
                  { backgroundColor: colors.cardBgLight },
                  { borderColor: isPopular ? Brand.teal : colors.borderFaint }
                ]}>
                  {isPopular && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.successText }]}>
                      <Text style={styles.popularBadgeText}>{t('credits.mostPopular')}</Text>
                    </View>
                  )}
                  <View style={styles.packLeft}>
                    <Text style={[styles.packName, { color: colors.textPrimary }]}>{pack.name}</Text>
                    <Text style={[styles.packCredits, { color: colors.textSecondary }]}>{pack.credits} {t('credits.title').toLowerCase()}</Text>
                    <View style={styles.packRateRow}>
                      <Text style={[styles.packRate, { color: isPopular ? colors.successText : colors.textDim }]}>
                        {pack.rateText}
                      </Text>
                      {pack.saving && (
                        <View style={[styles.savingBadge, { backgroundColor: colors.successFaint }]}>
                          <Text style={[styles.savingText, { color: colors.successText }]}>{pack.saving}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.packRight}>
                    <Text style={[styles.packPrice, { color: colors.textPrimary }]}>{pack.price}</Text>
                    <TouchableOpacity
                      style={styles.packBuyBtn}
                      activeOpacity={0.8}
                      onPress={() => handleBuy(pack)}
                    >
                      <Text style={styles.packBuyBtnText}>
                        {t('credits.buyBtn')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* SECTION 4 - RECENT WALLET TRANSACTIONS */}
          {transactions.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('credits.recentActivity')}</Text>
              <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint, borderWidth: 1 }]}>
                {transactions.slice(0, 3).map((txn, index) => (
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
          {historyLoading && <ActivityIndicator color={Brand.teal} style={{ marginVertical: 24 }} />}
          {!historyLoading && historyError && <Text style={styles.inlineError}>{historyError}</Text>}
          {!historyLoading && !historyError && transactions.length === 0 && (
            <Text style={styles.emptyHistory}>No wallet transactions yet.</Text>
          )}
          {!historyLoading && transactions.map((txn, index) => (
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
  headerRight: { minWidth: 70, alignItems: 'flex-end', flexShrink: 0 },
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
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    marginBottom: 16,
  },
  lowBalanceTitle: { fontSize: 14, fontWeight: '600' },
  lowBalanceSub: { fontSize: 12, marginTop: 2 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { flex: 1, fontSize: 12 },
  retryButton: { paddingHorizontal: 10, paddingVertical: 6 },
  retryText: { fontSize: 13, fontWeight: '700' },
  inlineError: { fontSize: 13, marginHorizontal: 4, marginBottom: 10 },
  topUpBtn: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  topUpBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // Balance Card
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 13, color: '#FFF', opacity: 0.8, fontWeight: '500' },
  balanceValue: { fontSize: 52, fontWeight: '800', color: '#FFF', marginVertical: 4 },
  balanceLoader: { height: 70, alignSelf: 'flex-start' },
  balanceSub: { fontSize: 14, color: '#FFF', opacity: 0.8, marginBottom: 20 },
  balanceBreakdown: { fontSize: 12, color: '#FFF', opacity: 0.8, marginTop: -14, marginBottom: 18 },
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
  // All Buy buttons are now identical — filled solid teal
  packBuyBtn: { backgroundColor: Brand.teal, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8, minWidth: 70, alignItems: 'center' as const },
  packBuyBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },

  // Txn — fixed overlapping text: removed height:56, use minHeight + paddingVertical
  txnRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 56, paddingVertical: 10 },
  txnCenter: { flex: 1, marginHorizontal: 10 },
  txnTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txnSub: { fontSize: 12, color: '#6B7280', flexShrink: 1 },
  txnRight: { alignItems: 'flex-end', flexShrink: 0, minWidth: 72 },
  txnAmount: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txnDate: { fontSize: 11, color: '#9CA3AF' },
  emptyHistory: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginVertical: 28 },
  historyLink: { marginTop: 16, alignItems: 'center' },
  historyLinkText: { fontSize: 13, color: Brand.teal, fontWeight: '500' },
  historyModalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  closeHistoryBtn: { height: 48, backgroundColor: Brand.teal, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  closeHistoryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
