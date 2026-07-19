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

import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { FontSize, FontWeight } from '../../constants/theme';

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

// ── API ───────────────────────────────────────────────────────
const BASE_URL =
  'https://73t761f5q5.execute-api.ap-south-1.amazonaws.com/default/propseekr-file-processor/matches';
const PAGE_SIZE = 20;

async function fetchMatches(page: number): Promise<{ matches: Match[]; pagination: Pagination }> {
  const res = await fetch(`${BASE_URL}?page=${page}&size=${PAGE_SIZE}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function getQualityGradient(quality: string): [string, string] {
  if (quality === 'Excellent Match') return ['#10B981', '#059669'];
  if (quality === 'Good Match') return ['#2563EB', '#1D4ED8'];
  return ['#F59E0B', '#D97706'];
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

  const [matches, setMatches] = useState<Match[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Track which card indices have been unlocked
  const [unlockedIndices, setUnlockedIndices] = useState<Set<number>>(new Set());

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  // ── Initial load ─────────────────────────────────────────────
  const loadPage = useCallback(async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await fetchMatches(pageNum);
      if (!isMounted.current) return;
      if (reset) {
        setMatches(data.matches);
        setUnlockedIndices(new Set()); // reset unlock state on refresh
      } else {
        setMatches(prev => [...prev, ...data.matches]);
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
  }, []);

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

  // ── Unlock handler ───────────────────────────────────────────
  const handleUnlock = useCallback((index: number, match: Match) => {
    Alert.alert(
      '🔓 Unlock Match',
      `This will send a notification to the buyer's broker.\n\nIf the buyer confirms the property is still available, ₹${UNLOCK_COST_RS} will be deducted from your balance.\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Unlock (₹${UNLOCK_COST_RS})`,
          style: 'default',
          onPress: () => {
            // Mark as unlocked (reveals contact info)
            setUnlockedIndices(prev => new Set([...prev, index]));
            // Notification API — under development
            Alert.alert(
              '✅ Notification Sent',
              `A notification has been sent to ${match.buyer.brokerName}.\n\nOnce they confirm the property is still available, ₹${UNLOCK_COST_RS} will be deducted from your balance.`,
              [{ text: 'OK' }],
            );
          },
        },
      ],
    );
  }, []);

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
        <Text style={[styles.footerLoaderText, { color: colors.textDim }]}>Loading more…</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyEmoji}>🤝</Text>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No matches yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
          Check back soon. Matches are updated regularly.
        </Text>
      </View>
    );
  };

  // ── Full-screen loading ──────────────────────────────────────
  if (loading && matches.length === 0) {
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
            <ActivityIndicator size="large" color={Brand.teal} />
            <Text style={[styles.fullLoadText, { color: colors.textDim }]}>
              Fetching matches…
            </Text>
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
              isUnlocked={unlockedIndices.has(index)}
              onUnlock={() => handleUnlock(index, item)}
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
  return (
    <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
      <PropSeekrLogo size={30} theme={type} layout="horizontal" />
      <View style={styles.headerRight}>
        {pagination && (
          <View style={[styles.totalBadge, { backgroundColor: 'rgba(37,99,235,0.15)', borderColor: Brand.blueBorder }]}>
            <Text style={styles.totalBadgeText}>🤝 {pagination.totalMatches.toLocaleString()} matches</Text>
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
  onMoreDetails,
}: {
  match: Match;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isUnlocked: boolean;
  onUnlock: () => void;
  onMoreDetails: () => void;
}) {
  const scoreColor = getScoreColor(match.scorePercent);
  const [g1, g2] = getQualityGradient(match.matchQuality);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>

      {/* ── Card Header: score + quality badge ── */}
      <View style={styles.cardHeader}>
        {/* Score ring */}
        <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{match.scorePercent}%</Text>
          <Text style={[styles.scoreLabel, { color: colors.textDim }]}>score</Text>
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
            <Text style={[styles.partyLabelText, { color: Brand.teal }]}>🏠 PROPERTY</Text>
          </View>

          <View style={styles.partyDetails}>
            <View style={styles.partyRow2}>
              <Text style={[styles.partyConfig, { color: colors.textPrimary }]}>
                {match.property.config} {match.property.type}
              </Text>
              <View style={[styles.forSaleBadge, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
                <Text style={[styles.forSaleText, { color: '#60A5FA' }]}>{match.property.for}</Text>
              </View>
            </View>

            <Text style={[styles.partyPrice, { color: colors.textPrimary }]}>
              {match.property.price}
            </Text>
            <Text style={[styles.partyStat, { color: colors.textSecondary }]}>
              📐 {match.property.size}
            </Text>
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
            <Text style={[styles.partyLabelText, { color: '#60A5FA' }]}>👤 BUYER</Text>
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
              {match.buyer.budget}
            </Text>
            <Text style={[styles.partyStat, { color: colors.textSecondary }]}>
              💰 Budget
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
        {/* Unlock Button */}
        {isUnlocked ? (
          <View style={[styles.unlockedBanner, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={styles.unlockedBannerEmoji}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.unlockedBannerTitle, { color: Brand.teal }]}>Notification Sent</Text>
              <Text style={[styles.unlockedBannerSub, { color: colors.textDim }]}>
                Awaiting buyer confirmation · ₹{UNLOCK_COST_RS} pending deduction
              </Text>
            </View>
          </View>
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
              <Text style={styles.unlockText}>Unlock Contact</Text>
              <View style={styles.unlockCostBadge}>
                <Text style={styles.unlockCostText}>₹{UNLOCK_COST_RS}</Text>
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
          <Text style={[styles.moreDetailsText, { color: colors.textSecondary }]}>More Details</Text>
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
  root:     { flex: 1 },
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
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  emptySubtitle: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: 32 },

  // ── Full-screen loading / error
  fullLoadWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fullLoadText:  { fontSize: FontSize.sm, marginTop: 4 },
  errorEmoji:    { fontSize: 40 },
  errorTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  errorSub:      { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:      { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  retryGrad:     { paddingHorizontal: 28, paddingVertical: 12 },
  retryText:     { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});
