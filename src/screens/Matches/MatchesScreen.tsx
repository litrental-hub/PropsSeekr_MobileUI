import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { FontSize, FontWeight } from '../../constants/theme';
import { getMatches, confirmMatch, revealMatch, MatchDTO } from '../../api/matches';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { formatPrice } from '../../utils/formatters';
import { LogoLoader } from '../../components/common/LogoLoader';

// ── Types ─────────────────────────────────────────────────────
interface MatchProperty {
  for: string;
  type: string;
  config: string;
  price: string;
  size: string;
  location: string;
  brokerName: string;
  brokerPhone: string;
}

interface MatchBuyer {
  lookingFor: string;
  type: string;
  budget: string;
  location: string;
  brokerName: string;
  brokerPhone: string;
}

interface MatchDetails {
  location: string;
  price: string;
  size?: string;
}

interface Match {
  matchId: number;                  // integer from matches.matchid
  _id?: string;                     // legacy
  notificationId?: string;
  initiatorPropertyRequestId?: string;
  // ── New handshake state fields ──
  state: 'matched' | 'pending_confirmation' | 'confirmed' | 'expired' | string;
  currentBrokerConfirmed: boolean;  // has the logged-in broker already confirmed?
  windowExpiresAt: string | null;   // ISO timestamp for countdown
  isRevealed: boolean;              // true when reveals row exists in DB
  unlockedContact: { ownerName: string; ownerMobile: string; ownerEmail: string | null } | null;
  // ── Display fields ──
  matchQuality: string;
  scorePercent: number;
  property: MatchProperty;
  buyer: MatchBuyer;
  matchDetails: MatchDetails;
}

interface Pagination {
  currentPage: number;
  pageSize: number;
  totalMatches: number;
  totalPages: number;
}

// ── Constants ─────────────────────────────────────────────────
const UNLOCK_COST_RS = 300;

// ── API Mappers ───────────────────────────────────────────────
const parseNumberSafe = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.]/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  }
  if (val && typeof val === 'object') {
    return parseNumberSafe(val.amount ?? val.displayValue ?? val.min ?? val.max ?? val.price ?? 0);
  }
  return 0;
};

function mapDTOToMatch(dto: MatchDTO, defaultTxType?: string): Match {
  const raw = dto || {};
  const score = parseNumberSafe(raw.matchScore ?? raw.score ?? raw.matchPercentage ?? 100) || 100;

  let matchQuality = raw.quality || raw.matchQuality || raw.qualityLabel || '';
  if (!matchQuality || typeof matchQuality !== 'string' || !matchQuality.trim()) {
    if (score >= 80) matchQuality = 'Excellent Match';
    else if (score >= 60) matchQuality = 'Good Match';
    else matchQuality = 'Potential Match';
  }

  const prop = raw.property || {};
  const req = raw.requirement || {};

  const locality = raw.locality ?? prop.locality ?? req.locality ?? '';
  const city = raw.city ?? prop.city ?? req.city ?? '';
  const location = [locality, city].filter(Boolean).join(', ') || raw.location || 'Location not specified';

  const txType = String(raw.transactionType || raw.listingType || defaultTxType || '').toUpperCase();
  const isRental = txType === 'RENTAL' || txType === 'RENT' || txType.toLowerCase().includes('rent');

  // Property Broker Side Mapping (from item.property)
  const propTitle = prop.detailsLine || prop.title || raw.propertyTitle || raw.propertyType || raw.title || 'Available Property';
  const propConfig = prop.categoryHeader || (propTitle.includes(raw.bhk) ? '' : (raw.bhk || ''));
  const rawPriceVal = parseNumberSafe(prop.price ?? raw.price ?? raw.salePrice ?? raw.monthlyRent ?? raw.budgetMax ?? 0);
  const propPrice = prop.priceLabel || (rawPriceVal > 0 ? formatPrice(rawPriceVal) : (typeof raw.price === 'string' && !raw.price.includes('NaN') ? raw.price : 'Price On Request'));
  const propLocality = prop.locality || locality || location;
  const sizeVal = prop.areaSqFt ?? raw.areaSqFt ?? raw.area ?? raw.size ?? null;
  const propSize = sizeVal ? `${sizeVal} sq.ft` : '';

  // Requirement Broker Side Mapping (from item.requirement)
  const reqTitle = req.detailsLine || req.title || req.description || raw.requirement?.propertyType || raw.category || 'Client Requirement';
  const reqBudgetVal = parseNumberSafe(req.budgetMax ?? raw.budgetMax ?? raw.budget ?? raw.buyerBudget ?? raw.price ?? 0);
  const reqBudget = req.priceLabel || (reqBudgetVal > 0 ? formatPrice(reqBudgetVal) : (typeof raw.budget === 'string' && !raw.budget.includes('NaN') ? raw.budget : propPrice));
  const reqLocality = req.locality || locality || location;

  // Contact resolution — only revealed contacts are shown
  const revealed = raw.isRevealed === true;
  const contact = raw.unlockedContact || null;
  const brokerName = revealed && contact ? (contact.ownerName || 'Broker') : 'Hidden';
  const brokerPhone = revealed && contact ? (contact.ownerMobile || '') : 'Hidden';

  // New state-machine fields
  const matchId: number = Number(raw.matchid ?? raw.matchId ?? raw.id ?? 0);
  const state: string = String(raw.state || 'matched').toLowerCase();
  const currentBrokerConfirmed: boolean = raw.currentBrokerConfirmed === true;
  const windowExpiresAt: string | null = raw.windowExpiresAt || null;

  return {
    matchId,
    state,
    currentBrokerConfirmed,
    windowExpiresAt,
    isRevealed: revealed,
    unlockedContact: contact,
    matchQuality,
    scorePercent: score,
    property: {
      for: isRental ? 'Rent' : 'Sale',
      type: propTitle,
      config: propConfig,
      price: propPrice,
      size: propSize,
      location: propLocality,
      brokerName,
      brokerPhone,
    },
    buyer: {
      lookingFor: isRental ? 'Rental' : 'Property',
      type: reqTitle,
      budget: reqBudget,
      location: reqLocality,
      brokerName,
      brokerPhone,
    },
    matchDetails: {
      location,
      price: propPrice !== 'Price On Request' ? propPrice : 'Budget Matched',
    },
    _id: raw.id || raw._id || Math.random().toString(),
    notificationId: raw.notificationId || raw.id || raw._id || '',
    initiatorPropertyRequestId: raw.initiatorPropertyRequestId || '',
  };
}

// ── Helpers ───────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#3B82F6';
}

function getQualityGradient(quality: string): [string, string] {
  if (quality.includes('Excellent')) return ['#10B981', '#059669'];
  if (quality.includes('Good')) return ['#F59E0B', '#D97706'];
  return ['#3B82F6', '#2563EB'];
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Masks all but first 2 digits of a phone number */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '••••••••••';
  return digits.slice(0, 2) + ' ' + '•'.repeat(Math.min(8, digits.length - 2));
}

// ── Main Screen ───────────────────────────────────────────────
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MatchesScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useAppTheme();
  const { colors, type, isDark } = theme;
  const { t } = useTranslation();

  const { sectionType, setCreditsBalance } = useAppStore();
  const transactionType = sectionType === 'Rentals' ? 'RENTAL' : 'BUY_SELL';

  const [matches, setMatches] = useState<Match[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [revealingMatchId, setRevealingMatchId] = useState<number | null>(null);

  const { user } = useAuthStore();
  const userId = user?.id || '';
  const brokerId = user?.brokerId || '';

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  // ── Initial load ─────────────────────────────────────────────
  const loadPage = useCallback(async (pageNum: number, reset = false) => {
    if (!userId) return; // Wait until user is loaded

    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await getMatches(userId, pageNum, 20, transactionType);
      if (!isMounted.current) return;
      const mappedMatches = data.matches.map(m => mapDTOToMatch(m, transactionType));
      if (reset) {
        setMatches(mappedMatches);
        setRefreshing(false);
        setRevealingMatchId(null);
      } else {
        setMatches(prev => [...prev, ...mappedMatches]);
      }
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (e: any) {
      if (!isMounted.current) return;
      setError(e.message ?? 'Failed to load matches');
    } finally {
      if (!isMounted.current) return;
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [userId, transactionType]);

  useEffect(() => { loadPage(1, true); }, [loadPage]);

  // ── Pull-to-refresh ──────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPage(1, true);
  }, [loadPage]);

  // ── Load more ────────────────────────────────────────────────
  const onEndReached = useCallback(() => {
    if (loadingMore || loading) return;
    if (!pagination) return;
    if (page >= pagination.totalPages) return;
    loadPage(page + 1, false);
  }, [loadingMore, loading, pagination, page, loadPage]);

  // ── Reveal handler — fetches contacts after both confirm ────
  const handleReveal = useCallback(async (match: Match) => {
    if (!brokerId) return;
    setRevealingMatchId(match.matchId);
    try {
      const res = await revealMatch(match.matchId, {
        matchId: match.matchId,
        brokerId: Number(brokerId),
      });

      if (res.success && res.unlockedContact) {
        // Update the match card with real contact + mark revealed
        setMatches(prev => prev.map(m =>
          m.matchId === match.matchId
            ? {
                ...m,
                isRevealed: true,
                unlockedContact: res.unlockedContact,
                state: 'confirmed',
                property: { ...m.property, brokerName: res.unlockedContact!.ownerName, brokerPhone: res.unlockedContact!.ownerMobile },
                buyer:    { ...m.buyer,    brokerName: res.unlockedContact!.ownerName, brokerPhone: res.unlockedContact!.ownerMobile },
              }
            : m
        ));
        // Update global token balance
        if (res.creditsRemaining !== undefined) {
          setCreditsBalance(res.creditsRemaining);
        }
      } else {
        const msg = res.message || '';
        if (msg.toLowerCase().includes('credit')) {
          Alert.alert(
            '💳 Insufficient Tokens',
            'You need at least 1 token to reveal contact details. Buy more tokens?',
            [
              { text: 'Not Now', style: 'cancel' },
              { text: 'Buy Tokens', onPress: () => navigation.navigate('MainTabs' as any, { screen: 'Tokens' } as any) },
            ]
          );
        } else {
          Alert.alert('Reveal Failed', msg || 'Could not reveal contact. Please try again.');
        }
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to reveal contact.';
      Alert.alert('Error', errMsg);
    } finally {
      setRevealingMatchId(null);
    }
  }, [brokerId, navigation, setCreditsBalance]);

  // ── Unlock handler — Broker A taps "Unlock" on a matched card ─
  const handleUnlock = useCallback((match: Match) => {
    if (!brokerId || !match.matchId) {
      Alert.alert('Error', 'Invalid match or broker ID.');
      return;
    }
    Alert.alert(
      '🔓 Unlock Contact',
      'Sending an unlock request to the other broker.\n1 token will be deducted from each party once both confirm.\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            try {
              const res = await confirmMatch(match.matchId, {
                matchId: match.matchId,
                brokerId: Number(brokerId),
                availabilityConfirmed: true,
                priceValid: true,
                priceNegotiable: false,
                readyToConnect: true,
              });

              if (res.state === 'confirmed') {
                // Edge case: other broker already confirmed — go straight to reveal
                setMatches(prev => prev.map(m =>
                  m.matchId === match.matchId ? { ...m, state: 'confirmed', currentBrokerConfirmed: true } : m
                ));
                await handleReveal({ ...match, state: 'confirmed', currentBrokerConfirmed: true });
              } else {
                // Normal case: waiting for other broker
                setMatches(prev => prev.map(m =>
                  m.matchId === match.matchId
                    ? { ...m, state: 'pending_confirmation', currentBrokerConfirmed: true, windowExpiresAt: res.windowExpiresAt || null }
                    : m
                ));
                Alert.alert('⌛ Request Sent', res.message || 'Unlock request sent. Waiting for the other broker to accept.');
              }
            } catch (err: any) {
              const errMsg = err?.response?.data?.message || err?.message || 'Could not send unlock request.';
              Alert.alert('Error', errMsg);
            }
          },
        },
      ]
    );
  }, [brokerId, handleReveal]);

  // ── Accept handler — Broker B taps "Accept & Unlock" ─────────
  const handleAccept = useCallback((match: Match) => {
    if (!brokerId || !match.matchId) {
      Alert.alert('Error', 'Invalid match or broker ID.');
      return;
    }
    Alert.alert(
      '🤝 Accept & Unlock',
      'Accepting will reveal each other\'s contact details.\n1 token will be deducted from each broker.\n\nConfirm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Unlock',
          onPress: async () => {
            try {
              const res = await confirmMatch(match.matchId, {
                matchId: match.matchId,
                brokerId: Number(brokerId),
                availabilityConfirmed: true,
                priceValid: true,
                priceNegotiable: false,
                readyToConnect: true,
              });

              if (res.state === 'confirmed') {
                setMatches(prev => prev.map(m =>
                  m.matchId === match.matchId ? { ...m, state: 'confirmed', currentBrokerConfirmed: true } : m
                ));
                // Both confirmed — trigger reveal
                await handleReveal({ ...match, state: 'confirmed', currentBrokerConfirmed: true });
              } else {
                setMatches(prev => prev.map(m =>
                  m.matchId === match.matchId
                    ? { ...m, state: 'pending_confirmation', currentBrokerConfirmed: true, windowExpiresAt: res.windowExpiresAt || null }
                    : m
                ));
              }
            } catch (err: any) {
              const errMsg = err?.response?.data?.message || err?.message || 'Could not accept unlock request.';
              Alert.alert('Error', errMsg);
            }
          },
        },
      ]
    );
  }, [brokerId, handleReveal]);

  // ── More Details handler ─────────────────────────────────────
  const handleMoreDetails = useCallback((_match: Match) => {
    Alert.alert(
      '🏗️ Coming Soon',
      'Detailed seller / owner info, photos & videos will be available once the API is live.',
      [{ text: 'Got it' }],
    );
  }, []);

  // ── Render helpers ───────────────────────────────────────────
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Brand.teal} />
        <Text style={[styles.footerLoaderText, { color: colors.textDim }]}>{t('matchesScreen.loadingMore')}</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyEmoji}>🤝</Text>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('matchesScreen.noMatchesYet')}</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
          Check back soon. Matches are updated regularly.
        </Text>
      </View>
    );
  };

  // ── Full-screen loading ──────────────────────────────────────
  if (loading) {
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
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScreenHeader colors={colors} type={type} pagination={pagination} />
          <View style={styles.fullLoadWrap}>
            <LogoLoader
              size={64}
              theme={type}
              text={`Fetching ${sectionType === 'Rentals' ? 'Rental' : 'Buy & Sell'} matches…`}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  if (error && matches.length === 0) {
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
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScreenHeader colors={colors} type={type} pagination={null} />
          <View style={styles.fullLoadWrap}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
              Could not load matches
            </Text>
            <Text style={[styles.errorSub, { color: colors.textDim }]}>{error}</Text>
            <TouchableOpacity
              onPress={() => loadPage(1, true)}
              style={styles.retryBtn}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Brand.blue, Brand.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryGrad}
              >
                <Text style={styles.retryText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.navy}
      />

      {/* Background gradient */}
      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top accent bar */}
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScreenHeader colors={colors} type={type} pagination={pagination} />

        <FlatList
          data={matches}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <MatchCard
              match={item}
              colors={colors}
              isRevealing={revealingMatchId === item.matchId}
              onUnlock={() => handleUnlock(item)}
              onAccept={() => handleAccept(item)}
              onMoreDetails={() => handleMoreDetails(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Brand.teal}
              colors={[Brand.teal]}
            />
          }
        />
      </SafeAreaView>
    </View>
  );
}

// ── Screen Header ─────────────────────────────────────────────
function ScreenHeader({
  colors,
  type,
  pagination,
}: {
  colors: ReturnType<typeof useAppTheme>['colors'];
  type: 'light' | 'dark';
  pagination: Pagination | null;
}) {
  const { t } = useTranslation();
  const { sectionType, setSectionType } = useAppStore();
  return (
    <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
      <PropSeekrLogo size={30} theme={type} layout="horizontal" />

      {/* Rental / Buy-Sell toggle */}
      <View style={[styles.modeToggle, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
        {[
          { key: 'Rentals', label: t('dashboard.rental'), emoji: '🔑' },
          { key: 'Buying', label: t('dashboard.buySell'), emoji: '🏠' },
        ].map(({ key, label, emoji }) => {
          const active = sectionType === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSectionType(key as any)}
              activeOpacity={0.8}
              style={styles.modeBtn}
            >
              {active ? (
                <LinearGradient
                  colors={[Brand.blue, Brand.teal]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modeBtnGrad}
                >
                  <Text style={styles.modeBtnEmoji}>{emoji}</Text>
                  <Text style={[styles.modeBtnText, { color: '#FFFFFF' }]}>{label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.modeBtnInner}>
                  <Text style={styles.modeBtnEmoji}>{emoji}</Text>
                  <Text style={[styles.modeBtnText, { color: colors.textSecondary }]}>{label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.headerRight}>
        {pagination && (
          <View style={[styles.totalBadge, { backgroundColor: 'rgba(37,99,235,0.15)', borderColor: Brand.blueBorder }]}>
            <Text style={styles.totalBadgeText}>🤝 {pagination.totalMatches.toLocaleString()} {t('matchesScreen.matchesCount')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Match Card ────────────────────────────────────────────────
function MatchCard({
  match,
  colors,
  isRevealing,
  onUnlock,
  onAccept,
  onMoreDetails,
}: {
  match: Match;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isRevealing: boolean;   // spinner shown while reveal API is in-flight
  onUnlock: () => void;   // Broker A: tap Unlock
  onAccept: () => void;   // Broker B: tap Accept & Unlock
  onMoreDetails: () => void;
}) {
  const { t } = useTranslation();
  const scoreColor = getScoreColor(match.scorePercent);
  const [g1, g2] = getQualityGradient(match.matchQuality);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>

      {/* ── Card Header: score + quality badge ── */}
      <View style={styles.cardHeader}>
        {/* Score ring */}
        <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{match.scorePercent}%</Text>
          <Text style={[styles.scoreLabel, { color: colors.textDim }]}>{t('matchesScreen.score')}</Text>
        </View>

        {/* Quality badge + match details pills */}
        <View style={{ flex: 1, gap: 6 }}>
          <LinearGradient
            colors={[g1, g2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.qualityBadge}
          >
            <Text style={styles.qualityText}>{match.matchQuality}</Text>
          </LinearGradient>

          <View style={styles.pillRow}>
            {Object.values(match.matchDetails)
              .filter(Boolean)
              .map((detail, i) => (
                <View
                  key={i}
                  style={[styles.pill, { backgroundColor: colors.cardBgLight, borderColor: colors.borderFaint }]}
                >
                  <Text style={styles.pillDot}>✓</Text>
                  <Text style={[styles.pillText, { color: colors.textSecondary }]}>{detail}</Text>
                </View>
              ))}
          </View>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: Brand.blueBorder }]} />

      {/* ── Property + Buyer columns ── */}
      <View style={styles.partyRow}>
        {/* Property (Seller) */}
        <View style={styles.partyCol}>
          <View style={[styles.partyLabelWrap, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
            <Text style={[styles.partyLabelText, { color: Brand.teal }]}>🏠 {t('matchesScreen.property')}</Text>
          </View>

          <View style={styles.partyDetails}>
            <View style={styles.partyRow2}>
              <Text style={[styles.partyConfig, { color: colors.textPrimary }]}>
                {[match.property.config, match.property.type].filter(Boolean).join(' ')}
              </Text>
              <View style={[styles.forSaleBadge, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
                <Text style={[styles.forSaleText, { color: '#60A5FA' }]}>{match.property.for}</Text>
              </View>
            </View>

            <Text style={[styles.partyPrice, { color: colors.textPrimary }]}>
              {formatPrice(match.property.price)}
            </Text>
            {!!match.property.size && (
              <Text style={[styles.partyStat, { color: colors.textSecondary }]}>
                📐 {match.property.size}
              </Text>
            )}
            <Text style={[styles.partyStat, { color: colors.textSecondary }]}>
              📍 {match.property.location}
            </Text>
          </View>

          {/* Broker chip */}
          <BrokerChip
            name={match.property.brokerName}
            phone={match.property.brokerPhone}
            isUnlocked={match.isRevealed}
            colors={colors}
          />
        </View>

        {/* Vertical separator */}
        <View style={[styles.vertDivider, { backgroundColor: Brand.blueBorder }]} />

        {/* Buyer */}
        <View style={styles.partyCol}>
          <View style={[styles.partyLabelWrap, { backgroundColor: 'rgba(37,99,235,0.12)' }]}>
            <Text style={[styles.partyLabelText, { color: '#60A5FA' }]}>👤 {t('matchesScreen.buyer')}</Text>
          </View>

          <View style={styles.partyDetails}>
            <View style={styles.partyRow2}>
              <Text style={[styles.partyConfig, { color: colors.textPrimary }]}>
                {match.buyer.type}
              </Text>
              <View style={[styles.forSaleBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <Text style={[styles.forSaleText, { color: Brand.teal }]}>{match.buyer.lookingFor}</Text>
              </View>
            </View>

            <Text style={[styles.partyPrice, { color: colors.textPrimary }]}>
              {formatPrice(match.buyer.budget)}
            </Text>
            <Text style={[styles.partyStat, { color: colors.textSecondary }]}>
              📍 {match.buyer.location}
            </Text>
          </View>

          {/* Broker chip */}
          <BrokerChip
            name={match.buyer.brokerName}
            phone={match.buyer.brokerPhone}
            isUnlocked={match.isRevealed}
            colors={colors}
          />
        </View>
      </View>

      {/* ── Action Buttons — 6-state machine ── */}
      <View style={[styles.actionDivider, { backgroundColor: Brand.blueBorder }]} />

      <View style={styles.actionSection}>
        {/* ── STATE: REVEALED — show contact + call/WhatsApp ── */}
        {match.isRevealed && match.unlockedContact ? (
          <View style={[styles.unlockedBanner, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={styles.unlockedBannerEmoji}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.unlockedBannerTitle, { color: Brand.teal }]}>Contact Unlocked</Text>
              <Text style={[styles.unlockedBannerSub, { color: colors.textDim }]}>
                {match.unlockedContact.ownerName} · {match.unlockedContact.ownerMobile}
              </Text>
            </View>
          </View>

        ) : isRevealing ? (
          /* ── STATE: REVEAL IN FLIGHT — spinner ── */
          <View style={[styles.unlockBtnWrap, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', borderWidth: 1 }]}>
            <ActivityIndicator size="small" color={Brand.teal} />
            <Text style={[styles.unlockText, { color: Brand.teal, marginLeft: 8 }]}>Fetching contacts...</Text>
          </View>

        ) : match.state === 'confirmed' ? (
          /* ── STATE: CONFIRMED but not yet revealed — auto-reveal ── */
          <View style={[styles.unlockBtnWrap, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', borderWidth: 1 }]}>
            <ActivityIndicator size="small" color={Brand.teal} />
            <Text style={[styles.unlockText, { color: Brand.teal, marginLeft: 8 }]}>Both confirmed — fetching contacts...</Text>
          </View>

        ) : match.state === 'pending_confirmation' && match.currentBrokerConfirmed ? (
          /* ── STATE: PENDING — current broker already sent request, waiting ── */
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.unlockBtnWrap, { borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.4)', backgroundColor: 'rgba(245,158,11,0.12)' }]}
            onPress={() => Alert.alert('⌛ Waiting', `Unlock request sent. Waiting for the other broker to accept.${match.windowExpiresAt ? `\nExpires: ${new Date(match.windowExpiresAt).toLocaleTimeString()}` : ''}`)}
          >
            <View style={styles.pendingBtnRow}>
              <Text style={styles.unlockIcon}>⌛</Text>
              <Text style={[styles.unlockText, { color: '#F59E0B' }]}>Waiting for other broker</Text>
              <View style={[styles.unlockCostBadge, { backgroundColor: 'rgba(245,158,11,0.25)' }]}>
                <Text style={[styles.unlockCostText, { color: '#F59E0B' }]}>Pending</Text>
              </View>
            </View>
          </TouchableOpacity>

        ) : match.state === 'pending_confirmation' && !match.currentBrokerConfirmed ? (
          /* ── STATE: PENDING — other broker initiated, this broker must accept ── */
          <TouchableOpacity
            onPress={onAccept}
            activeOpacity={0.85}
            style={styles.unlockBtnWrap}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.unlockGrad}
            >
              <Text style={styles.unlockIcon}>🤝</Text>
              <Text style={styles.unlockText}>Accept &amp; Unlock</Text>
              <View style={styles.unlockCostBadge}>
                <Text style={styles.unlockCostText}>1 Token</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

        ) : (
          /* ── STATE: MATCHED (default) or EXPIRED — show Unlock button ── */
          <TouchableOpacity
            onPress={onUnlock}
            activeOpacity={0.85}
            style={styles.unlockBtnWrap}
          >
            <LinearGradient
              colors={[Brand.blue, Brand.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.unlockGrad}
            >
              <Text style={styles.unlockIcon}>🔓</Text>
              <Text style={styles.unlockText}>
                {match.state === 'expired' ? 'Unlock Again' : 'Unlock Contact'}
              </Text>
              <View style={styles.unlockCostBadge}>
                <Text style={styles.unlockCostText}>1 Token</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* More Details Button */}
        <TouchableOpacity
          onPress={onMoreDetails}
          activeOpacity={0.75}
          style={[styles.moreDetailsBtn, { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg }]}
        >
          <Text style={styles.moreDetailsIcon}>📋</Text>
          <Text style={[styles.moreDetailsText, { color: colors.textSecondary }]}>{t('matchesScreen.moreDetails')}</Text>
          <View style={[styles.comingSoonTag, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Broker Chip ───────────────────────────────────────────────
function BrokerChip({
  name,
  phone,
  isUnlocked,
  colors,
}: {
  name: string;
  phone: string;
  isUnlocked: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={[styles.brokerChip, { backgroundColor: colors.inputBg, borderColor: Brand.blueBorder }]}>
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        style={styles.brokerAvatar}
      >
        <Text style={styles.brokerInitials}>{initials(name)}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={[styles.brokerName, { color: colors.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        {isUnlocked ? (
          <Text style={[styles.brokerPhone, { color: colors.textDim }]}>{phone}</Text>
        ) : (
          <View style={styles.maskedPhoneRow}>
            <Text style={[styles.brokerPhone, { color: colors.textDim }]}>
              {maskPhone(phone)}
            </Text>
            <View style={[styles.lockBadge, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },

  accentBar: {
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  totalBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#93C5FD',
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 12, borderWidth: 1,
    overflow: 'hidden', gap: 2, padding: 2,
  },
  modeBtn: { borderRadius: 10, overflow: 'hidden' },
  modeBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  modeBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  modeBtnEmoji: { fontSize: 11 },
  modeBtnText: { fontSize: 11, fontWeight: '600' },

  // ── List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 100,
    gap: 12,
  },

  // ── Card
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  scoreRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    lineHeight: 16,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qualityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qualityText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillDot: {
    fontSize: 9,
    color: Brand.teal,
  },
  pillText: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },

  // Dividers
  divider: {
    height: 1,
    marginBottom: 12,
  },
  vertDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: 10,
  },

  // ── Party columns
  partyRow: {
    flexDirection: 'row',
  },
  partyCol: {
    flex: 1,
    gap: 8,
  },
  partyLabelWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partyLabelText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1,
  },
  partyDetails: {
    gap: 3,
  },
  partyRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  partyConfig: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  forSaleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  forSaleText: {
    fontSize: 9,
    fontWeight: FontWeight.semibold,
  },
  partyPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
  },
  partyStat: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },

  // ── Broker chip
  brokerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  brokerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brokerInitials: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    color: '#FFFFFF',
  },
  brokerName: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  brokerPhone: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  maskedPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lockIcon: {
    fontSize: 9,
  },

  // ── Action section
  actionDivider: {
    height: 1,
    marginTop: 14,
    marginBottom: 14,
  },
  actionSection: {
    gap: 10,
    alignItems: 'center',
  },

  // Unlock button
  unlockBtnWrap: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  unlockGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 14,
  },
  unlockIcon: {
    fontSize: 16,
  },
  unlockText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  unlockCostBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 4,
  },
  unlockCostText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: '#FFFFFF',
  },
  pendingBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 14,
  },

  // Unlocked state banner
  unlockedBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  unlockedBannerEmoji: {
    fontSize: 20,
  },
  unlockedBannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
  },
  unlockedBannerSub: {
    fontSize: 10,
    marginTop: 1,
  },

  // More Details button
  moreDetailsBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  moreDetailsIcon: {
    fontSize: 14,
  },
  moreDetailsText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  comingSoonTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    marginLeft: 2,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#F59E0B',
    letterSpacing: 0.3,
  },

  // ── Footer loader
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  footerLoaderText: {
    fontSize: FontSize.xs,
  },

  // ── Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  emptySubtitle: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: 32 },

  // ── Full-screen loading / error
  fullLoadWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fullLoadText: { fontSize: FontSize.sm, marginTop: 4 },
  errorEmoji: { fontSize: 40 },
  errorTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  errorSub: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  retryGrad: { paddingHorizontal: 28, paddingVertical: 12 },
  retryText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});
