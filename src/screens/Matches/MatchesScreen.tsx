import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Linking,
  ScrollView,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

import { BottomTabParamList } from '../../navigation/BottomTabNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { FontSize, FontWeight, Card, Shadow, Spacing } from '../../constants/theme';
import { getMatches, confirmMatch, rejectMatch, MatchDTO, RejectReasonCode } from '../../api/matches';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { formatPrice } from '../../utils/formatters';
import { resolveMatchSourceIds } from '../../utils/matchFilters';
import { LogoLoader } from '../../components/common/LogoLoader';
import { refreshWallet } from '../../services/walletSync';

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
  connectionRequestId: number | null;
  connectionRequestStatus: string | null;
  deliveryChannel: string | null;
  incomingConnectionRequest: boolean;
  currentBrokerRole: string;
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
  excellentMatches: number;
  goodMatches: number;
  fairMatches: number;
  unlockedMatches: number;
}

// ── Constants ─────────────────────────────────────────────────
const REJECTION_REASONS: Array<{ code: RejectReasonCode; label: string }> = [
  { code: 'PROPERTY_UNAVAILABLE', label: 'Property is unavailable' },
  { code: 'PRICE_CHANGED', label: 'Price or budget changed' },
  { code: 'CLIENT_REQUIREMENT_CLOSED', label: 'Client requirement is closed' },
  { code: 'ALREADY_CLOSED', label: 'Deal already closed' },
  { code: 'INCORRECT_MATCH', label: 'Incorrect match' },
  { code: 'OTHER', label: 'Other' },
];

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
    connectionRequestId: raw.connectionRequestId ?? null,
    connectionRequestStatus: raw.connectionRequestStatus ?? null,
    deliveryChannel: raw.deliveryChannel ?? null,
    incomingConnectionRequest: raw.incomingConnectionRequest === true,
    currentBrokerRole: raw.currentBrokerRole || '',
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
function getScoreColor(score: number, colors: any): string {
  if (score >= 80) return colors.successText;
  if (score >= 60) return colors.warningText;
  return colors.infoText;
}

function getQualityGradient(quality: string, colors: any): [string, string] {
  if (quality.includes('Excellent')) return [colors.successText, colors.successText];
  if (quality.includes('Good')) return [colors.warningText, colors.warningText];
  return [colors.infoText, colors.infoText];
}

// ── Main Screen ───────────────────────────────────────────────
export default function MatchesScreen() {
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
  const [revealingMatchId, setRevealingMatchId] = useState<number | null>(null);
  const [actionMatch, setActionMatch] = useState<Match | null>(null);
  const [actionMode, setActionMode] = useState<'request' | 'accept' | 'reject' | 'result' | null>(null);
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(true);
  const [priceValid, setPriceValid] = useState(true);
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [readyToConnect, setReadyToConnect] = useState(true);
  const [rejectReason, setRejectReason] = useState<RejectReasonCode>('PROPERTY_UNAVAILABLE');
  const [rejectDetails, setRejectDetails] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionResultSuccess, setActionResultSuccess] = useState(true);

  type MatchesScreenRouteProp = RouteProp<BottomTabParamList, 'Matches'>;
  const route = useRoute<MatchesScreenRouteProp>();
  const selectedProperty = route.params?.selectedProperty || route.params?.property;
  const targetMatchId = route.params?.matchId;
  const [activeTab, setActiveTab] = useState<'All Matches' | 'Excellent' | 'Good' | 'Fair' | 'Unlocked'>('All Matches');

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
      const { listingId: selectedListingId, requirementId: selectedRequirementId } =
        resolveMatchSourceIds(selectedProperty);
      const data = await getMatches(
        pageNum,
        20,
        targetMatchId ? undefined : transactionType,
        selectedListingId,
        targetMatchId,
        selectedRequirementId,
      );
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
  }, [userId, transactionType, selectedProperty, targetMatchId]);

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

  const openConnectionAction = useCallback((match: Match, mode: 'request' | 'accept' | 'reject') => {
    if (!brokerId || !match.matchId) {
      Alert.alert('Error', 'Invalid match or broker ID.');
      return;
    }
    setActionMatch(match);
    setActionMode(mode);
    setAvailabilityConfirmed(true);
    setPriceValid(true);
    setPriceNegotiable(false);
    setReadyToConnect(true);
    setRejectReason(match.currentBrokerRole === 'requirement' ? 'CLIENT_REQUIREMENT_CLOSED' : 'PROPERTY_UNAVAILABLE');
    setRejectDetails('');
    setActionMessage('');
    setActionResultSuccess(true);
  }, [brokerId]);

  const applyConfirmedMatch = useCallback((match: Match, res: Awaited<ReturnType<typeof confirmMatch>>) => {
    const contact = res.unlockedContact || null;
    setMatches(prev => prev.map(item => item.matchId === match.matchId ? {
      ...item,
      state: res.state || item.state,
      currentBrokerConfirmed: true,
      windowExpiresAt: res.windowExpiresAt || null,
      connectionRequestId: res.connectionRequestId ?? item.connectionRequestId,
      connectionRequestStatus: res.connectionRequestStatus ?? item.connectionRequestStatus,
      deliveryChannel: res.deliveryChannel ?? item.deliveryChannel,
      incomingConnectionRequest: false,
      isRevealed: res.isRevealed === true || item.isRevealed,
      unlockedContact: contact || item.unlockedContact,
      property: contact ? { ...item.property, brokerName: contact.ownerName, brokerPhone: contact.ownerMobile } : item.property,
      buyer: contact ? { ...item.buyer, brokerName: contact.ownerName, brokerPhone: contact.ownerMobile } : item.buyer,
    } : item));
    if (brokerId && (res.isRevealed === true || res.creditsRemaining !== undefined)) {
      // A connection action can deduct a token; always re-read the authoritative wallet.
      refreshWallet(brokerId, { showLoading: false }).catch(error => {
        console.warn('Could not refresh wallet after match confirmation.', error?.message);
      });
    }
  }, [brokerId]);

  const submitConfirmation = useCallback(async () => {
    if (!actionMatch || actionSubmitting) return;
    if (!availabilityConfirmed || !priceValid || !readyToConnect) {
      setActionMessage('Confirm availability, price/budget validity, and readiness to connect.');
      return;
    }
    setActionSubmitting(true);
    setActionMessage('');
    try {
      const res = await confirmMatch(actionMatch.matchId, {
        matchId: actionMatch.matchId,
        availabilityConfirmed,
        priceValid,
        priceNegotiable,
        readyToConnect,
      });
      if (res.success) applyConfirmedMatch(actionMatch, res);
      else {
        setMatches(prev => prev.map(item => item.matchId === actionMatch.matchId ? {
          ...item,
          state: res.state || item.state,
          connectionRequestStatus: res.connectionRequestStatus ?? item.connectionRequestStatus,
        } : item));
      }
      setActionResultSuccess(res.success);
      setActionMatch(current => current ? {
        ...current,
        deliveryChannel: res.deliveryChannel ?? current.deliveryChannel,
        connectionRequestId: res.connectionRequestId ?? current.connectionRequestId,
        connectionRequestStatus: res.connectionRequestStatus ?? current.connectionRequestStatus,
      } : current);
      setActionMessage(res.message || (res.isRevealed ? 'Connection accepted and contacts unlocked.' : 'Request sent.'));
      setActionMode('result');
    } catch (err: any) {
      setActionMessage(err?.response?.data?.message || err?.message || 'Could not process this connection request.');
      setActionResultSuccess(false);
    } finally {
      setActionSubmitting(false);
    }
  }, [actionMatch, actionSubmitting, availabilityConfirmed, priceValid, priceNegotiable, readyToConnect, applyConfirmedMatch]);

  const submitRejection = useCallback(async () => {
    if (!actionMatch || actionSubmitting) return;
    if (rejectReason === 'OTHER' && !rejectDetails.trim()) {
      setActionMessage('Please add a rejection reason.');
      return;
    }
    setActionSubmitting(true);
    setActionMessage('');
    try {
      const res = await rejectMatch(actionMatch.matchId, {
        matchId: actionMatch.matchId,
        connectionRequestId: actionMatch.connectionRequestId,
        reasonCode: rejectReason,
        reasonText: rejectDetails.trim() || undefined,
      });
      setMatches(prev => prev.map(item => item.matchId === actionMatch.matchId ? {
        ...item,
        state: 'matched',
        currentBrokerConfirmed: false,
        incomingConnectionRequest: false,
        connectionRequestStatus: res.connectionRequestStatus,
      } : item));
      setActionMessage(res.message);
      setActionResultSuccess(true);
      setActionMode('result');
    } catch (err: any) {
      setActionMessage(err?.response?.data?.message || err?.message || 'Could not reject this request.');
      setActionResultSuccess(false);
    } finally {
      setActionSubmitting(false);
    }
  }, [actionMatch, actionSubmitting, rejectReason, rejectDetails]);

  const handleUnlock = useCallback((match: Match) => openConnectionAction(match, 'request'), [openConnectionAction]);
  const handleAccept = useCallback((match: Match) => openConnectionAction(match, 'accept'), [openConnectionAction]);
  const handleReject = useCallback((match: Match) => openConnectionAction(match, 'reject'), [openConnectionAction]);

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

  const excellentCount = pagination?.excellentMatches ?? matches.filter(m => m.scorePercent >= 80).length;
  const goodCount = pagination?.goodMatches ?? matches.filter(m => m.scorePercent >= 60 && m.scorePercent < 80).length;
  const fairCount = pagination?.fairMatches ?? matches.filter(m => m.scorePercent < 60).length;
  const unlockedCount = pagination?.unlockedMatches ?? matches.filter(m => m.isRevealed).length;

  const filteredMatches = matches.filter(match => {
    if (activeTab === 'Excellent') return match.scorePercent >= 80;
    if (activeTab === 'Good') return match.scorePercent >= 60 && match.scorePercent < 80;
    if (activeTab === 'Fair') return match.scorePercent < 60;
    if (activeTab === 'Unlocked') return match.isRevealed;
    return true;
  });

  const renderListHeader = () => {
    if (!selectedProperty) return null;
    const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    const propertyImageSource = selectedProperty.imageUrl
      ? { uri: selectedProperty.imageUrl }
      : { uri: DEFAULT_PROPERTY_IMAGE };
    const allCount = pagination?.totalMatches ?? matches.length;

    return (
      <View style={{ marginBottom: 16 }}>
        <View style={[styles.propertyCard, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder, marginHorizontal: 16, marginTop: 16 }]}> 
            <View style={styles.cardInnerLayout}>
              <View style={styles.cardImageContainer}>
                <Image source={propertyImageSource} style={styles.cardImage} resizeMode="cover" />
              </View>
              <View style={styles.cardDetailsContainer}>
                <View style={[styles.propertyCardHeader, { marginBottom: 6 }]}>
                  <View style={styles.tagWrap}>
                    <Text style={styles.tagText}>{selectedProperty.type || selectedProperty.propertyType || 'RENTAL'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <Text style={[styles.cardTitle, styles.propertyTitle, { color: colors.textPrimary, flex: 1, marginRight: 8 }]} numberOfLines={2}>
                    {selectedProperty.title || 'Property Listing'}
                  </Text>
                  <Text style={[styles.statusText, { color: colors.successText, marginTop: 2, fontSize: 11 }]}>
                    ● {selectedProperty.status || 'Active'}
                  </Text>
                </View>
                <View style={[styles.locationRow, { marginBottom: 6 }]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textDim} />
                  <Text style={[styles.cardLocation, { color: colors.textSecondary, marginBottom: 0 }]} numberOfLines={2}>
                    {selectedProperty.location || 'Location not specified'}
                  </Text>
                </View>
                <Text style={[styles.cardPrice, styles.propertyPrice, { marginBottom: 8 }]}>{formatPrice(selectedProperty.price)}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={styles.metaBadge}>
                    <MaterialCommunityIcons name="home-outline" size={12} color={colors.textDim} />
                    <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>3 BHK</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <MaterialCommunityIcons name="ruler-square" size={12} color={colors.textDim} />
                    <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>1500 sqft</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

        {/* Matches Summary Title */}
        <View style={{ marginHorizontal: 16, marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>All Matches</Text>
            <Text style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>
              Brokers interested in your property
            </Text>
          </View>
          <View style={[styles.statsCard, { backgroundColor: colors.cardBg }]}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.successText, lineHeight: 28 }}>{allCount}</Text>
            <Text style={styles.statsLabel}>{t('matches.totalFound', 'Matches found')}</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, marginTop: 16 }}>
          {[
            { label: 'All Matches', count: allCount, color: colors.textPrimary },
            { label: 'Excellent', count: excellentCount, color: colors.successText },
            { label: 'Good', count: goodCount, color: colors.infoText },
            { label: 'Fair', count: fairCount, color: colors.warningText },
            { label: 'Unlocked', count: unlockedCount, color: colors.infoText }
          ].map(tab => {
            const isActive = activeTab === tab.label;
            return (
              <TouchableOpacity
                key={tab.label}
                onPress={() => setActiveTab(tab.label as any)}
                activeOpacity={0.7}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isActive ? tab.color : colors.cardBg,
                    borderColor: isActive ? tab.color : colors.borderFaint
                  }
                ]}
              >
                <Text style={[styles.filterTabLabel, { color: isActive ? '#FFF' : tab.color }]}>{tab.label}</Text>
                <Text style={[styles.filterTabCount, { color: isActive ? '#FFF' : tab.color, opacity: isActive ? 0.9 : 1 }]}>{tab.count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

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
          data={filteredMatches}
          keyExtractor={item => String(item.matchId)}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              colors={colors}
              isRevealing={revealingMatchId === item.matchId}
              onUnlock={() => handleUnlock(item)}
              onAccept={() => handleAccept(item)}
              onReject={() => handleReject(item)}
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

        <Modal
          visible={actionMode !== null}
          transparent
          animationType="fade"
          onRequestClose={() => !actionSubmitting && setActionMode(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.actionModal, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
              <View style={styles.modalTitleRow}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {actionMode === 'request' ? 'Unlock Contact' : actionMode === 'accept' ? 'Accept Request' : actionMode === 'reject' ? 'Reject Request' : 'Request Update'}
                </Text>
                <TouchableOpacity
                  accessibilityLabel="Close"
                  disabled={actionSubmitting}
                  onPress={() => setActionMode(null)}
                  style={styles.modalClose}
                >
                  <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {actionMode === 'result' ? (
                <>
                  <View style={[styles.resultIcon, !actionResultSuccess && styles.resultErrorIcon]}>
                    <MaterialCommunityIcons name={actionResultSuccess ? 'check' : 'alert-outline'} size={28} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{actionMessage}</Text>
                  {actionMatch?.deliveryChannel === 'whatsapp' && (
                    <Text style={styles.plannedNotice}>WhatsApp delivery is planned for a later release; no WhatsApp message was sent.</Text>
                  )}
                  <TouchableOpacity style={styles.modalPrimaryButton} onPress={() => setActionMode(null)}>
                    <LinearGradient colors={[Brand.blue, Brand.teal]} style={styles.modalPrimaryGradient}>
                      <Text style={styles.modalPrimaryText}>Done</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : actionMode === 'reject' ? (
                <>
                  <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>Select a reason. Rejecting does not deduct tokens.</Text>
                  <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
                    {REJECTION_REASONS.map(reason => (
                      <TouchableOpacity
                        key={reason.code}
                        onPress={() => setRejectReason(reason.code)}
                        style={[styles.optionRow, { borderColor: rejectReason === reason.code ? Brand.teal : Brand.blueBorder }]}
                      >
                        <MaterialCommunityIcons
                          name={rejectReason === reason.code ? 'radiobox-marked' : 'radiobox-blank'}
                          size={20}
                          color={rejectReason === reason.code ? Brand.teal : colors.textDim}
                        />
                        <Text style={[styles.optionText, { color: colors.textPrimary }]}>{reason.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {rejectReason === 'OTHER' && (
                    <TextInput
                      value={rejectDetails}
                      onChangeText={setRejectDetails}
                      placeholder="Add rejection reason"
                      placeholderTextColor={colors.textDim}
                      multiline
                      maxLength={500}
                      style={[styles.reasonInput, { color: colors.textPrimary, borderColor: Brand.blueBorder }]}
                    />
                  )}
                  {!!actionMessage && <Text style={styles.validationMessage}>{actionMessage}</Text>}
                  <TouchableOpacity disabled={actionSubmitting} style={[styles.rejectSubmit, actionSubmitting && styles.disabledButton]} onPress={submitRejection}>
                    {actionSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>Reject Request</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                    {actionMode === 'accept'
                      ? 'Confirm the current details before connecting with the other broker.'
                      : 'Send a connection request. Tokens are charged only after the other broker accepts and contact reveal succeeds.'}
                  </Text>
                  {[
                    { label: actionMatch?.currentBrokerRole === 'requirement' ? 'Client requirement is active' : 'Property is available', value: availabilityConfirmed, set: setAvailabilityConfirmed },
                    { label: 'Price / budget is still valid', value: priceValid, set: setPriceValid },
                    { label: 'Ready to connect', value: readyToConnect, set: setReadyToConnect },
                  ].map(item => (
                    <TouchableOpacity key={item.label} onPress={() => item.set(!item.value)} style={[styles.checkRow, { borderColor: Brand.blueBorder }]}>
                      <MaterialCommunityIcons name={item.value ? 'checkbox-marked' : 'checkbox-blank-outline'} size={23} color={item.value ? Brand.teal : colors.textDim} />
                      <Text style={[styles.optionText, { color: colors.textPrimary }]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <View style={[styles.negotiableRow, { borderColor: Brand.blueBorder }]}>
                    <Text style={[styles.optionText, { color: colors.textPrimary }]}>Property / price negotiable?</Text>
                    <View style={styles.yesNoWrap}>
                      {[true, false].map(value => (
                        <TouchableOpacity key={String(value)} onPress={() => setPriceNegotiable(value)} style={[styles.yesNoButton, priceNegotiable === value && styles.yesNoButtonActive]}>
                          <Text style={[styles.yesNoText, priceNegotiable === value && styles.yesNoTextActive]}>{value ? 'Yes' : 'No'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.tokenNotice}>
                    <MaterialCommunityIcons name="information-outline" size={18} color={Brand.blue} />
                    <Text style={[styles.tokenNoticeText, { color: colors.textSecondary }]}>1 token from each broker is deducted only when both confirm and contacts are revealed.</Text>
                  </View>
                  {!!actionMessage && <Text style={styles.validationMessage}>{actionMessage}</Text>}
                  <TouchableOpacity disabled={actionSubmitting} style={[styles.modalPrimaryButton, actionSubmitting && styles.disabledButton]} onPress={submitConfirmation}>
                    <LinearGradient colors={[Brand.blue, Brand.teal]} style={styles.modalPrimaryGradient}>
                      {actionSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>{actionMode === 'accept' ? 'Accept & Connect' : 'Send Request'}</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                  {actionMode === 'accept' && (
                    <TouchableOpacity style={styles.modalRejectLink} onPress={() => { setActionMode('reject'); setActionMessage(''); }}>
                      <Text style={styles.modalRejectLinkText}>Reject Request</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// ── Screen Header ─────────────────────────────────────────────
function ScreenHeader({ colors, type, pagination, selectedProperty, navigation }: any) {
  const { t } = useTranslation();
  const { sectionType, setSectionType } = useAppStore();

  if (selectedProperty) {
    return (
      <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>Matches</Text>
        </TouchableOpacity>
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
function MatchCard({ match, colors, isRevealing, onUnlock, onAccept, onReject, onMoreDetails }: {
  match: Match;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isRevealing: boolean;
  onUnlock: () => void;
  onAccept: () => void;
  onReject: () => void;
  onMoreDetails: () => void;
}) {
  const scoreColor = getScoreColor(match.scorePercent, colors);
  const [g1, g2] = getQualityGradient(match.matchQuality, colors);
  const otherBroker = match.property || match.buyer;
  const matchTitle = `${match.property.config} ${match.property.type}`.trim();
  const matchPrice = match.property.price;

  return (
    <View style={[styles.compactMatchCard, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint }]}>
      <View style={styles.compactMatchHeader}>
        <LinearGradient colors={[Brand.blue, Brand.teal]} style={styles.compactAvatar}>
          <Text style={styles.compactAvatarText}>{otherBroker.brokerName.charAt(0)}</Text>
        </LinearGradient>
        <View style={styles.compactInfoWrap}>
          <View style={styles.compactTitleRow}>
            <Text style={[styles.compactBrokerName, { color: colors.textPrimary }]} numberOfLines={1}>{otherBroker.brokerName}</Text>
            <LinearGradient colors={[g1, g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.compactQualityBadge}>
              <Text style={[styles.compactQualityText, { color: '#FFF' }]}>{match.matchQuality}</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.compactDetailsLine, { color: colors.textSecondary }]} numberOfLines={1}>
            {matchTitle} • {formatPrice(matchPrice)}
          </Text>
          <Text style={[styles.compactDateLine, { color: colors.textDim }]}>
            Matched today • {otherBroker.location}
          </Text>
        </View>
        <View style={[styles.compactScoreRing, { borderColor: scoreColor }]}>
          <Text style={[styles.compactScoreText, { color: scoreColor }]}>
            {match.scorePercent}%
          </Text>
        </View>
      </View>

      <View style={styles.compactActionsRow}>
        <TouchableOpacity style={[styles.compactActionBtn, { flex: 1, borderColor: colors.borderFaint, backgroundColor: colors.cardBgLight }]} onPress={onMoreDetails}>
          <Text style={[styles.compactActionText, { color: colors.textSecondary }]}>View Details</Text>
        </TouchableOpacity>

        {match.isRevealed && match.unlockedContact ? (
          <TouchableOpacity style={[styles.compactActionBtn, { flex: 1, backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', flexDirection: 'row', gap: 6 }]} onPress={() => Linking.openURL(`tel:${match.unlockedContact?.ownerMobile}`)}>
            <MaterialCommunityIcons name="phone" size={14} color={Brand.teal} />
            <Text style={[styles.compactActionText, { color: Brand.teal }]}>Call Broker</Text>
          </TouchableOpacity>
        ) : isRevealing ? (
          <View style={[styles.compactActionBtn, { flex: 1, backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <ActivityIndicator size="small" color={Brand.teal} />
          </View>
        ) : match.connectionRequestStatus === 'credit_required' ? (
          <TouchableOpacity style={[styles.compactActionBtn, { flex: 1, backgroundColor: colors.warningFaint, borderColor: colors.warningText }]} onPress={onUnlock}>
            <Text style={[styles.compactActionText, { color: colors.warningText }]}>Retry Connection</Text>
          </TouchableOpacity>
        ) : match.state === 'confirmed' ? (
          <View style={[styles.compactActionBtn, { flex: 1, backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <ActivityIndicator size="small" color={Brand.teal} />
          </View>
        ) : match.state === 'pending_confirmation' && match.currentBrokerConfirmed ? (
          <View style={[styles.compactActionBtn, { flex: 1, borderColor: colors.borderFaint }]}>
            <Text style={[styles.compactActionText, { color: colors.warningText }]}>Pending</Text>
          </View>
        ) : match.incomingConnectionRequest || (match.state === 'pending_confirmation' && !match.currentBrokerConfirmed) ? (
          <View style={styles.incomingActionWrap}>
            <TouchableOpacity style={[styles.compactActionBtn, { flex: 1, borderColor: colors.errorText }]} onPress={onReject}>
              <Text style={[styles.compactActionText, { color: colors.errorText }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.compactActionBtn, { flex: 1, backgroundColor: Brand.teal, borderColor: Brand.teal }]} onPress={onAccept}>
              <Text style={[styles.compactActionText, { color: '#FFF' }]}>Accept</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.compactActionBtn, { flex: 1, backgroundColor: Brand.teal, borderColor: Brand.teal }]} onPress={onUnlock}>
            <Text style={[styles.compactActionText, { color: '#FFF' }]}>Unlock Contact</Text>
          </TouchableOpacity>
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
    paddingTop: 14,
    paddingBottom: 100,
  },

  // ── Card
  card: {
    borderRadius: Card.radius,   // 16dp — standardised token
    borderWidth: 1.5,
    padding: Card.padding,       // 16dp
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

  propertyCard: { borderRadius: 16, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardInnerLayout: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardImageContainer: { width: '32%', aspectRatio: 0.85 },
  cardImage: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#E5E7EB' },
  cardDetailsContainer: { flex: 1, justifyContent: 'flex-start' },
  propertyCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagWrap: { backgroundColor: 'rgba(37,99,235,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { color: '#60A5FA', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  matchesCtaTouchTarget: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  matchesCta: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  matchesCtaText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  propertyTitle: { lineHeight: 20 },
  statusText: { fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLocation: { fontSize: 12 },
  cardPrice: { fontSize: 18, fontWeight: '800', color: Brand.blue },
  propertyPrice: { marginTop: -2 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F3F4F6' },
  metaBadgeText: { fontSize: 10, fontWeight: '600' },

  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterTabLabel: { fontSize: 12, fontWeight: '700' },
  filterTabCount: { fontSize: 10, fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 4, borderRadius: 10 },

  compactMatchCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  compactMatchHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  compactAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  compactInfoWrap: { flex: 1 },
  compactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactBrokerName: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  compactQualityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  compactQualityText: { fontSize: 9, fontWeight: '800' },
  compactDetailsLine: { fontSize: 11, marginTop: 2 },
  compactDateLine: { fontSize: 10, marginTop: 4 },
  compactScoreRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  compactScoreText: { fontSize: 12, fontWeight: '800' },
  compactActionsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  incomingActionWrap: { flex: 1.5, flexDirection: 'row', gap: 6 },
  compactActionBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  compactActionText: { fontSize: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.68)', justifyContent: 'center', padding: 20 },
  actionModal: { borderWidth: 1, borderRadius: 20, padding: 20, maxHeight: '88%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10, marginTop: -10 },
  modalDescription: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  checkRow: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionRow: { minHeight: 46, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionText: { flex: 1, fontSize: 13, fontWeight: '600' },
  negotiableRow: { minHeight: 54, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  yesNoWrap: { flexDirection: 'row', backgroundColor: 'rgba(148,163,184,0.14)', borderRadius: 9, padding: 2 },
  yesNoButton: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 7 },
  yesNoButtonActive: { backgroundColor: Brand.teal },
  yesNoText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  yesNoTextActive: { color: '#FFFFFF' },
  tokenNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(37,99,235,0.08)', borderRadius: 11, padding: 11, marginBottom: 12 },
  tokenNoticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
  modalPrimaryButton: { minHeight: 50, borderRadius: 13, overflow: 'hidden' },
  modalPrimaryGradient: { minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  modalPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  modalRejectLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  modalRejectLinkText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
  reasonList: { maxHeight: 280, marginBottom: 4 },
  reasonInput: { minHeight: 82, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, textAlignVertical: 'top', marginBottom: 10 },
  rejectSubmit: { minHeight: 50, borderRadius: 13, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  validationMessage: { color: '#EF4444', fontSize: 12, lineHeight: 17, marginBottom: 10 },
  disabledButton: { opacity: 0.6 },
  resultIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: Brand.teal, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  resultErrorIcon: { backgroundColor: '#EF4444' },
  modalMessage: { textAlign: 'center', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  plannedNotice: { color: '#B45309', backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 10, padding: 10, fontSize: 11, lineHeight: 16, marginBottom: 14 },
});
