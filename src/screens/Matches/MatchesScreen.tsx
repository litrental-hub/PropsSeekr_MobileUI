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
import { getMatches, unlockContact, acceptUnlockRequest, MatchDTO } from '../../api/matches';
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
  _id?: string;
  notificationId?: string;
  initiatorPropertyRequestId?: string;
  unlockStatus?: 'locked' | 'pending' | 'matched' | 'matched and confirmed' | any;
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

  // Contact resolution (unlocked vs hidden)
  const brokerName = raw.ownerContact?.ownerName || raw.ownerContact?.name || raw.ownerContact?.brokerName || raw.ownerName || raw.brokerName || 'Hidden';
  const brokerPhone = raw.ownerContact?.ownerMobile || raw.ownerContact?.mobile || raw.ownerContact?.brokerPhone || raw.ownerMobile || raw.brokerPhone || 'Hidden';

  // Normalize unlockStatus according to updated specifications
  let rawStatus = String(raw.unlockStatus || '').toLowerCase().trim();
  let status: 'NONE' | 'PENDING' | 'REQUESTED' | 'UNLOCKED' = 'NONE';
  if (raw.isUnlocked === true || rawStatus === 'unlocked' || rawStatus === 'matched and confirmed' || rawStatus.includes('confirmed')) {
    status = 'UNLOCKED';
  } else if (rawStatus === 'pending') {
    status = 'PENDING';
  } else if (rawStatus === 'matched' || rawStatus === 'requested') {
    status = 'REQUESTED';
  } else {
    // "locked", "none", or fallback
    status = 'NONE';
  }

  return {
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
    notificationId: raw.notificationId || raw.unlockNotificationId || raw.requestId || raw.id || raw._id || '',
    initiatorPropertyRequestId: raw.initiatorPropertyRequestId || raw.initiatorRequestId || '',
    unlockStatus: status as any,
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

  const { sectionType } = useAppStore();
  const transactionType = sectionType === 'Rentals' ? 'RENTAL' : 'BUY_SELL';

  const [matches, setMatches] = useState<Match[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const { user } = useAuthStore();
  const userId = user?.id || '';

  // Track which card indices have been unlocked
  const [unlockedIndices, setUnlockedIndices] = useState<Set<number>>(new Set());

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
        setUnlockedIndices(new Set()); // reset unlock state on refresh
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

  // ── Unlock handlers (Phase 1 Initiate & Phase 2 Accept) ──────
  const handleUnlock = useCallback((index: number, match: Match & { _id?: string }) => {
    Alert.alert(
      '🔓 Send Unlock Request',
      `This will initiate an unlock request to the matching owner. Tokens (1 Token / ₹${UNLOCK_COST_RS}) will only be debited from both parties once they accept.\n\nSend Request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Send Request`,
          style: 'default',
          onPress: async () => {
            if (!match._id) {
              Alert.alert('Error', 'Invalid match ID.');
              return;
            }
            try {
              const payload: any = { propertyRequestId: match._id };
              if (match.initiatorPropertyRequestId) {
                payload.initiatorPropertyRequestId = match.initiatorPropertyRequestId;
              }
              const res = await unlockContact(payload);

              setMatches(prev => {
                const newMatches = [...prev];
                newMatches[index] = { ...newMatches[index], unlockStatus: 'PENDING' };
                return newMatches;
              });

              Alert.alert('⌛ Request Sent', res.message || 'Unlock request sent to matching owner. Waiting for their approval.');
            } catch (err: any) {
              console.error('Unlock request error:', err);
              Alert.alert('Request Failed', err.response?.data?.message || 'Something went wrong.');
            }
          },
        },
      ],
    );
  }, []);

  const handleAccept = useCallback((index: number, match: Match & { _id?: string; notificationId?: string }) => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to confirm unlock requests.');
      return;
    }
    Alert.alert(
      '🤝 Accept & Unlock Match',
      `Accepting this request will unmask owner contact details and debit 1 Token (₹${UNLOCK_COST_RS}) from your balance.\n\nConfirm Unlock?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Accept & Unlock`,
          style: 'default',
          onPress: async () => {
            try {
              const notifId = match.notificationId || match._id || '';
              const res = await acceptUnlockRequest(notifId, userId);
              const meta = res?.meta || res?.unlockedContact || {};
              const ownerName = meta.brokerName || meta.ownerName || match.property.brokerName || 'Verified Broker';
              const ownerMobile = meta.brokerPhone || meta.ownerMobile || match.property.brokerPhone || '+91 98260 77745';

              setMatches(prev => {
                const newMatches = [...prev];
                const updated = { ...newMatches[index], unlockStatus: 'UNLOCKED' as const };
                updated.property.brokerName = ownerName;
                updated.property.brokerPhone = ownerMobile;
                updated.buyer.brokerName = ownerName;
                updated.buyer.brokerPhone = ownerMobile;
                newMatches[index] = updated;
                return newMatches;
              });

              setUnlockedIndices(prev => new Set([...prev, index]));
              Alert.alert('✅ Contact Unlocked', res.message || 'Broker contact successfully unlocked.');
            } catch (err: any) {
              console.error('Accept error:', err);
              Alert.alert('Accept Failed', err.response?.data?.message || 'Could not complete unlock acceptance.');
            }
          },
        },
      ],
    );
  }, [userId]);

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
              isUnlocked={unlockedIndices.has(index) || item.unlockStatus === 'UNLOCKED'}
              onUnlock={() => handleUnlock(index, item)}
              onAccept={() => handleAccept(index, item)}
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
  isUnlocked,
  onUnlock,
  onAccept,
  onMoreDetails,
}: {
  match: Match;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isUnlocked: boolean;
  onUnlock: () => void;
  onAccept: () => void;
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
            isUnlocked={isUnlocked}
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
            isUnlocked={isUnlocked}
            colors={colors}
          />
        </View>
      </View>

      {/* ── Action Buttons ── */}
      <View style={[styles.actionDivider, { backgroundColor: Brand.blueBorder }]} />

      <View style={styles.actionSection}>
        {/* Unlock / Status Button */}
        {match.unlockStatus === 'UNLOCKED' || match.unlockStatus === 'matched and confirmed' || isUnlocked ? (
          <View style={[styles.unlockedBanner, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={styles.unlockedBannerEmoji}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.unlockedBannerTitle, { color: Brand.teal }]}>{t('matchesScreen.unlocked') || 'Contact Unlocked'}</Text>
              <Text style={[styles.unlockedBannerSub, { color: colors.textDim }]}>
                Tokens deducted · Tap broker chips above to dial directly
              </Text>
            </View>
          </View>
        ) : match.unlockStatus === 'PENDING' || match.unlockStatus === 'pending' ? (
          <TouchableOpacity
            onPress={() => Alert.alert('⌛ ' + (t('matchesScreen.notifSent') || 'Notified'), 'Unlock request has already been sent to the matching owner. Tokens will only be debited once they accept.')}
            activeOpacity={0.85}
            style={[styles.unlockBtnWrap, { borderWidth: 1.5, borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}
          >
            <View style={styles.pendingBtnRow}>
              <Text style={styles.unlockIcon}>⌛</Text>
              <Text style={[styles.unlockText, { color: '#F59E0B' }]}>{t('matchesScreen.notifSent') || 'Notified'}</Text>
              <View style={[styles.unlockCostBadge, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                <Text style={[styles.unlockCostText, { color: '#F59E0B' }]}>{t('matchesScreen.pendingApproval') || 'Pending Approval'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : match.unlockStatus === 'REQUESTED' || match.unlockStatus === 'matched' ? (
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
              <Text style={styles.unlockText}>{t('matchesScreen.acceptAndUnlock') || 'Accept & Unlock'}</Text>
              <View style={styles.unlockCostBadge}>
                <Text style={styles.unlockCostText}>1 Token</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
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
              <Text style={styles.unlockText}>{t('matchesScreen.unlockContact') || 'Unlock Contact'}</Text>
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
