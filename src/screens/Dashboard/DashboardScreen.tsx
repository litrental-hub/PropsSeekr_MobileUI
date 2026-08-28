import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../store/appStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { LogoLoader } from '../../components/common/LogoLoader';
import { BottomSheet } from '../../components/BottomSheet';
import { detectCurrentLocation } from '../../utils/location';
import {
  MarketplaceListing,
  MarketplaceRequirement,
  searchProperties,
  uploadBulkTxtFile,
} from '../../api/property';
import {
  buildMarketplacePayload,
  formatMarketplaceArea,
  formatMarketplaceDistance,
  formatMarketplaceFreshness,
  formatMarketplacePrice,
  MARKETPLACE_FILTERS,
  MarketplaceFilter,
} from '../../utils/marketplaceSearch';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type LocationStatus = 'idle' | 'requesting' | 'ready' | 'unavailable';
const PAGE_SIZE = 20;

// ── Main Screen ──────────────────────────────────────────────
export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { sectionType, setSectionType, location, setLocation, unreadNotifications } = useAppStore();
  const { t } = useTranslation();
  
  const theme = useAppTheme();
  const { colors, type, isDark } = theme;

  const [locationStatus, setLocationStatus] = useState<LocationStatus>(location ? 'ready' : 'idle');
  const [selectedFilter, setSelectedFilter] = useState<MarketplaceFilter>('ALL');
  const [activeTab, setActiveTab] = useState<'Available' | 'Looking'>('Available');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [requirements, setRequirements] = useState<MarketplaceRequirement[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [lookingCount, setLookingCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const isRental = sectionType === 'Rentals';
  const tabCounts = {
    Available: availableCount,
    Looking: lookingCount,
  };

  const resolveCurrentLocation = useCallback(async () => {
    setLocationStatus('requesting');
    const detected = await detectCurrentLocation(5);
    if (detected) {
      setLocation(detected);
      setLocationStatus('ready');
    } else {
      setLocationStatus('unavailable');
    }
  }, [setLocation]);

  useEffect(() => {
    if (location) {
      setLocationStatus('ready');
      return;
    }
    if (locationStatus === 'idle') {
      resolveCurrentLocation();
    }
  }, [location, locationStatus, resolveCurrentLocation]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleChangeLocation = () => navigation.navigate('Search', {});

  const fetchProperties = useCallback(async (nextPage = 1, append = false, isRefresh = false) => {
    if (!location) return;
    const requestId = ++requestSequence.current;
    try {
      if (isRefresh) setRefreshing(true);
      else if (append) setLoadingMore(true);
      else setSearching(true);
      setSearchError(null);

      const response = await searchProperties(buildMarketplacePayload({
        transactionType: isRental ? 'RENTAL' : 'BUY_SELL',
        listingType: activeTab === 'Available' ? 'SUPPLY' : 'DEMAND',
        location,
        filter: selectedFilter,
        searchQuery: debouncedSearch,
        page: nextPage,
        limit: PAGE_SIZE,
      }));

      if (requestId !== requestSequence.current) return;
      setAvailableCount(response.availableCount);
      setLookingCount(response.lookingCount);
      setPage(nextPage);
      setHasMore(nextPage * response.limit < response.totalCount);

      if (activeTab === 'Available') {
        setListings(previous => append ? mergeById(previous, response.results) : response.results);
        setRequirements([]);
      } else {
        setRequirements(previous => append ? mergeById(previous, response.requirements) : response.requirements);
        setListings([]);
      }
    } catch (error: any) {
      if (requestId !== requestSequence.current) return;
      setSearchError(error?.response?.data?.message || error?.message || 'Unable to load nearby properties.');
      if (!append) {
        setListings([]);
        setRequirements([]);
        setHasMore(false);
      }
    } finally {
      if (requestId === requestSequence.current) {
        setSearching(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [activeTab, debouncedSearch, isRental, location, selectedFilter]);

  useEffect(() => {
    if (locationStatus === 'ready' && location) {
      fetchProperties(1);
    }
  }, [fetchProperties, location, locationStatus]);

  const visibleItems = activeTab === 'Available' ? listings : requirements;
  const totalForTab = activeTab === 'Available' ? availableCount : lookingCount;

  const refresh = () => fetchProperties(1, false, true);
  const loadMore = () => {
    if (!searching && !loadingMore && hasMore) fetchProperties(page + 1, true);
  };

  const selectedFilterLabel = MARKETPLACE_FILTERS.find(option => option.value === selectedFilter)?.label ?? 'All';

  const openListingMatches = useCallback((listingId: string) => {
    (navigation as any).navigate('Matches', { property: { listingId } });
  }, [navigation]);

  const openRequirementMatches = useCallback((requirementId: string) => {
    (navigation as any).navigate('Matches', {
      property: { type: 'Requirement', requirementId },
    });
  }, [navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      {/* ── Background gradient (skills.md §2) ── */}
      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Top accent bar (skills.md §2) ── */}
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
          <PropSeekrLogo size={30} theme={type} layout="horizontal" />

          {/* Rental / Buy-Sell toggle */}
          <View style={[styles.modeToggle, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
            {[
              { key: 'Rentals',  label: t('dashboard.rental'),   emoji: '🔑' },
              { key: 'Buying',   label: t('dashboard.buySell'),  emoji: '🏠' },
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

          <TouchableOpacity
            style={styles.notifIconWrap}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="bell-outline" size={26} color={colors.textPrimary} />
            {unreadNotifications > 0 ? <View style={styles.notifBadge} /> : null}
          </TouchableOpacity>
        </View>

        {location ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleChangeLocation}
            accessibilityRole="button"
            accessibilityLabel="Change search location"
            style={[styles.locationBar, { backgroundColor: colors.cardBg, borderBottomColor: Brand.blueBorder }]}
          >
            <View style={styles.locationLeft}>
              <Text style={styles.locationPin}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {[location.locality, location.city].filter(Boolean).join(', ') || 'Selected location'}
                </Text>
                <Text style={[styles.locationSub, { color: colors.textDim }]}>
                  {location.radiusKm} km radius · {totalForTab} {activeTab === 'Available' ? 'available' : 'looking'}
                </Text>
              </View>
            </View>
            <Text style={styles.changeBtn}>{t('dashboard.change')}</Text>
          </TouchableOpacity>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={location ? (
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Brand.teal} />
          ) : undefined}
        >
          {!location ? (
            <LocationGate
              status={locationStatus}
              onUseCurrentLocation={resolveCurrentLocation}
              onChooseManually={handleChangeLocation}
              onOpenSettings={() => Linking.openSettings()}
              theme={theme}
            />
          ) : (
            <>
              <View style={styles.searchRow}>
                <View style={[styles.searchBox, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
                  <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    placeholder={t('dashboard.searchPlaceholder')}
                    placeholderTextColor={colors.textDim}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    accessibilityLabel="Search nearby property inventory"
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                      <MaterialCommunityIcons name="close-circle" size={19} color={colors.textDim} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.filterBtn}
                  activeOpacity={0.85}
                  onPress={() => setIsFilterVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Property filter: ${selectedFilterLabel}`}
                >
                  <LinearGradient colors={[Brand.blue, Brand.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterGrad}>
                    <MaterialCommunityIcons name="tune-variant" size={18} color="#FFFFFF" />
                    <Text style={styles.filterText}>{selectedFilter === 'ALL' ? t('dashboard.filter') : selectedFilterLabel}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={[styles.tabsRow, { backgroundColor: colors.cardBg, borderBottomColor: Brand.blueBorder }]}>
                {(['Available', 'Looking'] as const).map(tab => {
                  const active = activeTab === tab;
                  return (
                    <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)} activeOpacity={0.75}>
                      <Text style={[styles.tabText, { color: active ? colors.textPrimary : colors.textDim }, active && { fontWeight: '700' }]}>
                        {tab === 'Available' ? t('dashboard.available') : t('dashboard.looking')}{' '}
                        <Text style={[styles.tabCount, active && { color: Brand.teal }]}>{tabCounts[tab]}</Text>
                      </Text>
                      {active ? <LinearGradient colors={[Brand.blue, Brand.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabUnderline} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('dashboard.nearby')}</Text>
                <Text style={[styles.sectionSub, { color: colors.textDim }]}>
                  {location.radiusKm} km · {totalForTab} result{totalForTab === 1 ? '' : 's'}
                </Text>
              </View>

              {searching ? (
                <LogoLoader size={56} theme={type} text={`Loading nearby ${activeTab === 'Available' ? 'listings' : 'requirements'}…`} />
              ) : searchError ? (
                <StatusPanel icon="cloud-alert-outline" title="Could not load nearby properties" message={searchError} action="Retry" onAction={() => fetchProperties(1)} theme={theme} />
              ) : visibleItems.length === 0 ? (
                <StatusPanel
                  icon="map-marker-off-outline"
                  title="No nearby results"
                  message={`No ${activeTab.toLowerCase()} ${isRental ? 'rental' : 'buy/sell'} records match this location and filter.`}
                  action={selectedFilter !== 'ALL' || debouncedSearch ? 'Clear filters' : undefined}
                  onAction={selectedFilter !== 'ALL' || debouncedSearch ? () => { setSelectedFilter('ALL'); setSearchQuery(''); } : undefined}
                  theme={theme}
                />
              ) : (
                <>
                  {activeTab === 'Available'
                    ? listings.map(item => (
                      <PropertyCard
                        key={`listing-${item.id}`}
                        property={item}
                        isRental={isRental}
                        onViewMatches={() => openListingMatches(item.id)}
                        theme={theme}
                      />
                    ))
                    : requirements.map(item => (
                      <RequirementCard
                        key={`requirement-${item.id}`}
                        requirement={item}
                        isRental={isRental}
                        onViewMatches={() => openRequirementMatches(item.id)}
                        theme={theme}
                      />
                    ))}
                  {hasMore ? (
                    <TouchableOpacity style={[styles.loadMoreButton, { borderColor: Brand.blueBorder }]} onPress={loadMore} disabled={loadingMore}>
                      <Text style={[styles.loadMoreText, { color: Brand.teal }]}>{loadingMore ? 'Loading…' : 'Load more'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>

        {/* ── FAB (+ button) ── */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setIsActionsVisible(true)}>
          <LinearGradient
            colors={[Brand.blue, Brand.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGrad}
          >
            <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <BottomSheet visible={isActionsVisible} onClose={() => setIsActionsVisible(false)}>
          <View style={styles.filterSheetContent}>
            <Text style={[styles.filterSheetTitle, { color: colors.textPrimary }]}>{t('dashboard.quickActions')}</Text>
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionCardRow, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}
                onPress={() => {
                  setIsActionsVisible(false);
                  navigation.navigate('AddProperty' as any, {});
                }}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                  <MaterialCommunityIcons name="home-plus" size={26} color={Brand.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionCardTitle, { color: colors.textPrimary }]}>{t('dashboard.addProperty')}</Text>
                  <Text style={[styles.actionCardSub, { color: colors.textDim }]}>List a new property for sale or rent</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDim} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionCardRow, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}
                onPress={() => {
                  setIsActionsVisible(false);
                  navigation.navigate('AddRequirement' as any, {});
                }}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={Brand.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionCardTitle, { color: colors.textPrimary }]}>{t('dashboard.addRequirement')}</Text>
                  <Text style={[styles.actionCardSub, { color: colors.textDim }]}>Post buyer or tenant requirements</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDim} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionCardRow, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}
                onPress={async () => {
                  setIsActionsVisible(false);
                  try {
                    const res = await pick({
                      type: [types.plainText, types.allFiles],
                      allowMultiSelection: false,
                    });
                    const pickerResult = res?.[0];
                    if (!pickerResult) return;

                    const fileName = pickerResult.name || 'upload.txt';
                    if (!fileName.toLowerCase().endsWith('.txt')) {
                      Alert.alert('Validation Error', 'Invalid file type! Only .txt (plain text) files are permitted for bulk upload.');
                      return;
                    }

                    if (!pickerResult.uri) {
                      Alert.alert('Error', 'Unable to retrieve file path.');
                      return;
                    }

                    Alert.alert('Uploading', `Uploading and processing ${fileName}... Please wait.`);
                    await uploadBulkTxtFile(pickerResult.uri, fileName);
                    Alert.alert('Processing Completed 🎉', 'Your bulk file was uploaded and processing has completed.');
                  } catch (err: any) {
                    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
                      // User cancelled file selection
                      return;
                    }
                    Alert.alert('Upload Failed', err?.message || 'An unexpected error occurred during file upload.');
                  }
                }}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={26} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionCardTitle, { color: colors.textPrimary }]}>{t('dashboard.uploadFile')}</Text>
                  <Text style={[styles.actionCardSub, { color: colors.textDim }]}>Bulk upload listings or requirement files (.txt only)</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDim} />
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        <BottomSheet visible={isFilterVisible} onClose={() => setIsFilterVisible(false)}>
          <View style={styles.filterSheetContent}>
            <Text style={[styles.filterSheetTitle, { color: colors.textPrimary }]}>Property Type</Text>
            <View style={styles.filterSheetOptions}>
              {MARKETPLACE_FILTERS.map(option => {
                const active = selectedFilter === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      setSelectedFilter(option.value);
                      setIsFilterVisible(false);
                    }}
                    activeOpacity={0.75}
                    style={styles.filterSheetOptionBtn}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[Brand.blue, Brand.teal]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bhkChipActive}
                      >
                        <Text style={[styles.bhkChipTextActive, { color: '#FFFFFF' }]}>{option.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.bhkChip, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
                        <Text style={[styles.bhkChipText, { color: colors.textSecondary }]}>{option.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}

// ── Property Card ───────────────────────────────────────────
function PropertyCard({
  property,
  isRental,
  onViewMatches,
  theme,
}: {
  property: MarketplaceListing;
  isRental: boolean;
  onViewMatches: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { colors } = theme;
  const price = formatMarketplacePrice(property.price, isRental);
  const area = formatMarketplaceArea(property.builtUpSize);
  const distance = formatMarketplaceDistance(property.distanceKm);
  const freshness = formatMarketplaceFreshness(property.lastRefreshedAt || property.createdAt);
  const stats = [
    price ? { label: isRental ? 'RENT' : 'PRICE', value: price } : null,
    area ? { label: 'AREA', value: area } : null,
    distance ? { label: 'DISTANCE', value: distance } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <View style={[styles.propCard, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <View style={styles.propTopRow}>
        <View style={styles.propBadgeRow}>
          {property.status ? (
            <LinearGradient colors={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.1)']} style={styles.availBadge}>
              <Text style={styles.availBadgeText}>{property.status.toUpperCase()}</Text>
            </LinearGradient>
          ) : null}
          {property.category || property.propertyType ? (
            <Text style={[styles.propType, { color: colors.textSecondary }]}>{property.category || property.propertyType}</Text>
          ) : null}
        </View>
        {freshness ? <Text style={[styles.freshText, { color: colors.textDim }]}>{freshness}</Text> : null}
      </View>

      <Text style={[styles.propTitle, { color: colors.textPrimary }]}>{property.title}</Text>
      {property.subtitle ? <Text style={[styles.propSubtitle, { color: colors.textSecondary }]}>{property.subtitle}</Text> : null}
      {stats.length ? <CardStats stats={stats} theme={theme} /> : null}

      {property.features.length ? (
        <View style={styles.featureRow}>
          {property.features.map(feature => (
            <View key={`${feature.icon}-${feature.label}`} style={[styles.featureChip, { backgroundColor: colors.cardBgLight, borderColor: colors.borderFaint }]}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>{feature.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {property.locationLabel ? (
        <View style={[styles.propLocRow, { borderTopColor: Brand.blueBorder }]}>
          <Text style={[styles.propLocText, { color: colors.textSecondary }]}>📍 {property.locationLabel}</Text>
          {property.isNearby ? (
          <View style={[styles.nearbyBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Text style={styles.nearbyText}>Within search radius</Text>
          </View>
          ) : null}
        </View>
      ) : null}

      <MatchUnlockAction onPress={onViewMatches} theme={theme} />
    </View>
  );
}

function RequirementCard({ requirement, isRental, onViewMatches, theme }: {
  requirement: MarketplaceRequirement;
  isRental: boolean;
  onViewMatches: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { colors } = theme;
  const budget = formatMarketplacePrice(requirement.budget, isRental);
  const area = formatMarketplaceArea(requirement.requiredSize);
  const distance = formatMarketplaceDistance(requirement.distanceKm);
  const freshness = formatMarketplaceFreshness(requirement.lastRefreshedAt || requirement.createdAt);
  const stats = [
    budget ? { label: 'BUDGET', value: budget } : null,
    area ? { label: 'AREA', value: area } : null,
    distance ? { label: 'DISTANCE', value: distance } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const preferences = [requirement.furnishingPreference, requirement.facingPreference].filter(Boolean) as string[];

  return (
    <View style={[styles.propCard, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <View style={styles.propTopRow}>
        <View style={styles.propBadgeRow}>
          {requirement.status ? (
            <View style={[styles.availBadge, { backgroundColor: 'rgba(37,99,235,0.12)' }]}>
              <Text style={[styles.availBadgeText, { color: Brand.blue }]}>{requirement.status.toUpperCase()}</Text>
            </View>
          ) : null}
          {requirement.propertyType ? <Text style={[styles.propType, { color: colors.textSecondary }]}>{requirement.propertyType}</Text> : null}
        </View>
        {freshness ? <Text style={[styles.freshText, { color: colors.textDim }]}>{freshness}</Text> : null}
      </View>
      <Text style={[styles.propTitle, { color: colors.textPrimary }]}>{requirement.title}</Text>
      {requirement.sub ? <Text style={[styles.propSubtitle, { color: colors.textSecondary }]}>{requirement.sub}</Text> : null}
      {stats.length ? <CardStats stats={stats} theme={theme} /> : null}
      {preferences.length ? (
        <View style={styles.featureRow}>
          {preferences.map(preference => (
            <View key={preference} style={[styles.featureChip, { backgroundColor: colors.cardBgLight, borderColor: colors.borderFaint }]}>
              <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>{preference}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <MatchUnlockAction onPress={onViewMatches} theme={theme} />
    </View>
  );
}

function MatchUnlockAction({ onPress, theme }: {
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { colors } = theme;
  return (
    <View style={[styles.matchUnlockFooter, { borderTopColor: Brand.blueBorder }]}>
      <View style={styles.contactProtectedRow}>
        <MaterialCommunityIcons name="shield-lock-outline" size={18} color={colors.textDim} />
        <Text style={[styles.contactProtectedText, { color: colors.textDim }]}>Broker details protected</Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="View matches to unlock broker contact"
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.viewMatchesButton}
      >
        <LinearGradient
          colors={[Brand.blue, Brand.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewMatchesGradient}
        >
          <Text style={styles.viewMatchesText}>View matches to unlock contact</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function CardStats({ stats, theme }: {
  stats: Array<{ label: string; value: string }>;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { colors } = theme;
  return (
    <View style={[styles.statsRow, { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg }]}>
      {stats.map((stat, index) => (
        <View key={stat.label} style={[styles.statCol, index > 0 && { borderLeftWidth: 1, borderColor: Brand.blueBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textDim }]}>{stat.label}</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={1}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

function LocationGate({ status, onUseCurrentLocation, onChooseManually, onOpenSettings, theme }: {
  status: LocationStatus;
  onUseCurrentLocation: () => void;
  onChooseManually: () => void;
  onOpenSettings: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { colors } = theme;
  const requesting = status === 'requesting';
  return (
    <View style={[styles.locationGate, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <View style={styles.locationGateIcon}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={38} color={Brand.teal} />
      </View>
      <Text style={[styles.locationGateTitle, { color: colors.textPrimary }]}>Find properties within 5 km</Text>
      <Text style={[styles.locationGateMessage, { color: colors.textSecondary }]}>
        Allow location access to detect your coordinates and show real nearby listings and requirements.
      </Text>
      <TouchableOpacity style={styles.primaryGateButton} onPress={onUseCurrentLocation} disabled={requesting}>
        <Text style={styles.primaryGateButtonText}>{requesting ? 'Detecting location…' : 'Use my current location'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.secondaryGateButton, { borderColor: Brand.blueBorder }]} onPress={onChooseManually}>
        <Text style={[styles.secondaryGateButtonText, { color: colors.textPrimary }]}>Choose on Google Map</Text>
      </TouchableOpacity>
      {status === 'unavailable' ? (
        <TouchableOpacity onPress={onOpenSettings} style={styles.settingsLink}>
          <Text style={{ color: Brand.teal, fontWeight: '700' }}>Open app settings</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatusPanel({ icon, title, message, action, onAction, theme }: {
  icon: string;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { colors } = theme;
  return (
    <View style={styles.statusPanel}>
      <MaterialCommunityIcons name={icon} size={34} color={colors.textDim} />
      <Text style={[styles.statusPanelTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.statusPanelMessage, { color: colors.textDim }]}>{message}</Text>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} style={[styles.statusAction, { borderColor: Brand.blueBorder }]}>
          <Text style={{ color: Brand.teal, fontWeight: '700' }}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const merged = new Map(existing.map(item => [item.id, item]));
  incoming.forEach(item => merged.set(item.id, item));
  return Array.from(merged.values());
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1 },
  safeArea:{ flex: 1 },

  accentBar: {
    height: 3, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 12, borderWidth: 1,
    overflow: 'hidden', gap: 2, padding: 2,
  },
  modeBtn:          { borderRadius: 10, overflow: 'hidden' },
  modeBtnGrad:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  modeBtnInner:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  modeBtnEmoji:     { fontSize: 12 },
  modeBtnText:      { fontSize: 12, fontWeight: '600' },

  // Notifications
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444', // Red dot for unread notifications
    borderWidth: 1,
    borderColor: '#FFF',
  },

  // Location bar
  locationBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  locationLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 12 },
  locationPin:  { fontSize: 14 },
  locationName: { fontSize: 14, fontWeight: '700' },
  locationSub:  { fontSize: 11, marginTop: 1 },
  changeBtn:    { fontSize: 12, color: '#10B981', fontWeight: '600' },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 14,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchIcon:  { fontSize: 13 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterBtn:   { borderRadius: 14, overflow: 'hidden' },
  filterGrad:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14 },
  filterIcon:  { fontSize: 13, color: '#FFFFFF' },
  filterText:  { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // BHK Chips
  bhkRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  bhkChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5,
  },
  bhkChipActive: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  bhkChipText:       { fontSize: 13, fontWeight: '600' },
  bhkChipTextActive: { fontSize: 13, fontWeight: '700' },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem:       { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabText:       { fontSize: 14, fontWeight: '600' },
  tabCount:      { fontSize: 12 },
  tabUnderline:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, borderRadius: 2 },

  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#10B981', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionSub:   { fontSize: 11 },
  seeAllBtn:    { fontSize: 11, color: '#10B981', fontWeight: '600' },

  // Property Card (glass card — skills.md dark theme)
  propCard: {
    marginHorizontal: 16, borderRadius: 18,
    borderWidth: 1.5,
    padding: 16, marginBottom: 12,
  },
  propTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  propBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  availBadgeText: { fontSize: 11, fontWeight: '700', color: '#10B981', letterSpacing: 0.5 },
  propType:     { fontSize: 12 },
  freshRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  freshDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  freshText:    { fontSize: 11 },

  propTitle:    { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 3 },
  propSubtitle: { fontSize: 12, marginBottom: 10 },
  // Stats
  statsRow: {
    flexDirection: 'row', borderWidth: 1,
    borderRadius: 12, marginBottom: 14,
  },
  statCol:       { flex: 1, padding: 10 },
  statLabel:     { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  statValue:     { fontSize: 14, fontWeight: '800', marginTop: 2 },

  // Features
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  featureIcon:  { fontSize: 11 },
  featureLabel: { fontSize: 11, fontWeight: '500' },

  // Owner Preferences
  prefTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  prefRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  prefChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  prefChipText: { fontSize: 11, fontWeight: '600' },

  // Location
  propLocRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, paddingTop: 12,
    borderTopWidth: 1,
  },
  propLocText:  { fontSize: 11 },
  nearbyBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  nearbyText:   { fontSize: 11, color: '#10B981', fontWeight: '600' },

  // Protected broker contact action
  matchUnlockFooter: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 10 },
  contactProtectedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactProtectedText: { fontSize: 11, fontWeight: '600' },
  viewMatchesButton: { borderRadius: 10, overflow: 'hidden' },
  viewMatchesGradient: {
    minHeight: 42, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  viewMatchesText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  // Requirement rows
  reqRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 8,
    padding: 14,
    borderRadius: 16, borderWidth: 1.5,
  },
  reqAvatar:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  reqInitials: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  reqTitle:    { fontSize: 13, fontWeight: '700' },
  reqSub:      { fontSize: 11, marginTop: 2 },
  reqArrow:    { fontSize: 16 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    borderRadius: 28, overflow: 'hidden',
    shadowColor: Brand.blue, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 10,
  },
  fabGrad:  { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
  fabIcon:  { fontSize: 26, color: Brand.white, fontWeight: '700', lineHeight: 30 },

  // Filter BottomSheet styles
  filterSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  filterSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  filterSheetOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterSheetOptionBtn: {
    marginBottom: 4,
  },

  locationGate: {
    marginHorizontal: 20,
    marginTop: 36,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  locationGateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
    marginBottom: 18,
  },
  locationGateTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  locationGateMessage: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 22 },
  primaryGateButton: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Brand.teal,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryGateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryGateButton: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryGateButtonText: { fontSize: 14, fontWeight: '700' },
  settingsLink: { paddingHorizontal: 12, paddingTop: 18, paddingBottom: 4 },
  statusPanel: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 34 },
  statusPanelTitle: { fontSize: 16, fontWeight: '800', marginTop: 10 },
  statusPanelMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 },
  statusAction: { marginTop: 15, borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  loadMoreButton: {
    marginHorizontal: 16,
    marginTop: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  loadMoreText: { fontSize: 13, fontWeight: '800' },

  // Quick Action Modal Styles
  actionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  actionIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionCardSub: {
    fontSize: 13,
    marginTop: 2,
  },
});
