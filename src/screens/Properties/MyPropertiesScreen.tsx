import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMyRequirements } from '../../api/requirements';
import { getMyListings, PropertyListingItem } from '../../api/property';

import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { Radius, Shadow, FontSize, FontWeight, Card, Spacing } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { formatPrice } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { BottomSheet } from '../../components/BottomSheet';
import { inventoryItemMatchesSearch } from '../../utils/inventorySearch';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MyPropertiesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, type } = useAppTheme();
  const isDark = type === 'dark';
  const { t } = useTranslation();
  const { sectionType, setSectionType } = useAppStore();
  const transactionType = sectionType === 'Rentals' ? 'RENTAL' : 'BUY_SELL';
  const [activeTab, setActiveTab] = useState<'Properties' | 'Requirements'>('Properties');
  const [requirements, setRequirements] = useState<any[]>([]);
  const [properties, setProperties] = useState<PropertyListingItem[]>([]);
  const [loadingReq, setLoadingReq] = useState(false);
  const [loadingProp, setLoadingProp] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const propertyRequestId = React.useRef(0);
  const requirementRequestId = React.useRef(0);

  const filteredProperties = useMemo(() => properties.filter(item =>
    inventoryItemMatchesSearch(item as unknown as Record<string, unknown>, searchQuery, [
      'title', 'type', 'transactionType', 'listingType', 'propertyType',
      'configuration', 'locality', 'location', 'city', 'price', 'priceUnit',
      'builtUpSize', 'sizes', 'status',
    ])), [properties, searchQuery]);

  const filteredRequirements = useMemo(() => requirements.filter(item =>
    inventoryItemMatchesSearch(item as Record<string, unknown>, searchQuery, [
      'description', 'lookingFor', 'title', 'transactionType', 'category',
      'propertyType', 'configuration', 'locality', 'location', 'city',
      'budget', 'budgetMin', 'budgetMax', 'preferredLocation', 'requiredArea',
      'size', 'status',
    ])), [requirements, searchQuery]);

  const fetchProperties = React.useCallback(async () => {
    const requestId = ++propertyRequestId.current;
    try {
      setLoadingProp(true);
      setPropertyError(null);
      setProperties([]);
      const res = await getMyListings(1, 20, { transactionType });
      if (requestId === propertyRequestId.current) {
        setProperties(res.data ?? []);
      }
    } catch (err) {
      console.log('Error fetching properties:', err);
      if (requestId === propertyRequestId.current) {
        setPropertyError('Unable to load your listings. Pull down to retry.');
      }
    } finally {
      if (requestId === propertyRequestId.current) {
        setLoadingProp(false);
      }
    }
  }, [transactionType]);

  const fetchRequirements = React.useCallback(async () => {
    const requestId = ++requirementRequestId.current;
    try {
      setLoadingReq(true);
      setRequirements([]);
      const data = await getMyRequirements(1, 20, transactionType);
      if (requestId === requirementRequestId.current) {
        setRequirements(data?.data || data || []);
      }
    } catch (err) {
      console.log('Error fetching requirements:', err);
    } finally {
      if (requestId === requirementRequestId.current) {
        setLoadingReq(false);
      }
    }
  }, [transactionType]);

  useFocusEffect(
    React.useCallback(() => {
      // Load both collections so both tab counts always reflect the selected mode.
      fetchProperties();
      fetchRequirements();
    }, [fetchProperties, fetchRequirements])
  );

  const handleMatchesPress = (item: any) => {
    // Matches is a sibling route in the bottom-tab navigator.
    (navigation as any).navigate('Matches', { property: item });
  };

  const renderPropertyCard = (item: PropertyListingItem) => {
    const matchCount = item.matchCount ?? 0;
    const status = item.status || 'Active';
    const isActive = String(status).toLowerCase() === 'active';

    const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    // Use local fallback if needed, but keeping the current implementation
    const propertyImageSource = (item as any).imageUrl
      ? { uri: (item as any).imageUrl }
      : { uri: DEFAULT_PROPERTY_IMAGE };
      
    // Try to get area/size if available in the model
    const sizeStr = (item as any).size ? `${(item as any).size} sq ft` : null;
    const locationStr = item.locality || item.location || 'Location not specified';

    return (
      <View
        key={item.id}
        style={[styles.propertyCard, { backgroundColor: colors.cardBg }]}
      >
        <View style={styles.cardInnerLayout}>
          {/* Left Side: Property Image */}
          <View style={styles.cardImageContainer}>
            <Image
              source={propertyImageSource}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>

          {/* Right Side: Property Details */}
          <View style={styles.cardDetailsContainer}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.propertyTypeLabel}>{item.type || item.propertyType || 'PROPERTY'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: isActive ? colors.successFaint : colors.warningFaint }]}>
                <Text style={[styles.statusBadgeText, { color: isActive ? colors.successText : colors.warningText }]}>
                  {status}
                </Text>
              </View>
            </View>

            <Text style={[styles.propertyTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.title || 'Property Listing'}
            </Text>

            <View style={styles.priceAreaRow}>
              <Text style={[styles.propertyPrice, { color: colors.textPrimary }]}>{formatPrice(item.price)}</Text>
              {sizeStr && (
                <>
                  <Text style={styles.separatorText}>|</Text>
                  <Text style={styles.areaText}>{sizeStr}</Text>
                </>
              )}
            </View>

            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textDim} />
              <Text style={[styles.cardLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationStr}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            testID={`property-${item.id}-matches`}
            accessibilityRole="button"
            accessibilityLabel={`${matchCount} Matching Requirements`}
            activeOpacity={0.72}
            onPress={() => handleMatchesPress(item)}
            style={[styles.matchesCta, { backgroundColor: colors.brandFaint }]}
          >
            <Text style={styles.matchesCtaEmoji}>🤝</Text>
            <Text 
              style={styles.matchesCtaText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {matchCount} {matchCount === 1 ? 'Matching Requirement' : 'Matching Requirements'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={Brand.teal} style={{ marginLeft: 4, flexShrink: 0 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.editBtnOutline, { backgroundColor: colors.cardBg }]} 
            activeOpacity={0.7} 
            onPress={() => navigation.navigate('AddProperty', { editId: item.id, initialData: item })}
          >
            <MaterialCommunityIcons name="pencil-outline" size={14} color={Brand.teal} />
            <Text style={styles.editBtnOutlineText}>{t('myProperties.edit', 'Edit')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRequirementCard = (item: any) => {
    const matchCount = item.matchesFound ?? item.matchCount ?? 0;
    const status = item.status || 'Active';
    const isActive = String(status).toLowerCase() === 'active';

    // Use an office/building image for client requirements
    const DEFAULT_REQ_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    const propertyImageSource = item.imageUrl
      ? { uri: item.imageUrl }
      : { uri: DEFAULT_REQ_IMAGE };
      
    const sizeStr = item.size ? `${item.size} sq ft` : null;
    const locationStr = item.locality || item.location || 'Location not specified';

    return (
      <View
        key={item.id || Math.random().toString()}
        style={[styles.propertyCard, { backgroundColor: colors.cardBg }]}
      >
        <View style={styles.cardInnerLayout}>
          {/* Left Side: Property Image */}
          <View style={styles.cardImageContainer}>
            <Image
              source={propertyImageSource}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>

          {/* Right Side: Property Details */}
          <View style={styles.cardDetailsContainer}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.propertyTypeLabel}>{t('myProperties.clientReq', 'CLIENT REQ')}</Text>
              <View style={[styles.statusBadge, { backgroundColor: isActive ? colors.successFaint : colors.warningFaint }]}>
                <Text style={[styles.statusBadgeText, { color: isActive ? colors.successText : colors.warningText }]}>
                  {status}
                </Text>
              </View>
            </View>

            <Text style={[styles.propertyTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.description || item.lookingFor || item.title || 'Client Requirement'}
            </Text>

            <View style={styles.priceAreaRow}>
              <Text style={[styles.propertyPrice, { color: colors.textPrimary }]}>{formatPrice(item.budget || item.budgetMax || 0)}</Text>
              {sizeStr && (
                <>
                  <Text style={styles.separatorText}>|</Text>
                  <Text style={styles.areaText}>{sizeStr}</Text>
                </>
              )}
            </View>

            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textDim} />
              <Text style={[styles.cardLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationStr}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            testID={`req-${item.id}-matches`}
            accessibilityRole="button"
            accessibilityLabel={`${matchCount} Matching Listings`}
            activeOpacity={0.72}
            onPress={() => {
              handleMatchesPress({
                ...item,
                type: 'Requirement',
                requirementId: item.requirementId ?? item.id,
                title: item.description || item.lookingFor || item.title || 'Client Requirement',
                location: item.locality || item.location,
                price: item.budget?.max ?? item.budgetMax ?? item.budget,
              });
            }}
            style={styles.matchesCta}
          >
            <Text style={styles.matchesCtaEmoji}>🤝</Text>
            <Text 
              style={styles.matchesCtaText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {matchCount} {matchCount === 1 ? 'Matching Listing' : 'Matching Listings'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={Brand.teal} style={{ marginLeft: 4, flexShrink: 0 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.editBtnOutline, { backgroundColor: colors.cardBg }]} 
            activeOpacity={0.7} 
            onPress={() => navigation.navigate('AddRequirement', { editId: item.id, initialData: item })}
          >
            <MaterialCommunityIcons name="pencil-outline" size={14} color={Brand.teal} />
            <Text style={styles.editBtnOutlineText}>{t('myProperties.edit', 'Edit')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Top accent bar ── */}
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* ── Header with Centered Toggle ── */}
        <View style={[styles.header, { borderBottomColor: Brand.blueBorder, position: 'relative' }]}>
          <View style={{ position: 'absolute', left: 16 }}>
            <PropSeekrLogo size={28} theme={type} layout="horizontal" />
          </View>
          
          <View style={[styles.modeToggle, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
            {[
              { key: 'Rentals', label: t('dashboard.rental'), emoji: '🔑' },
              { key: 'Buying', label: t('dashboard.buySell'), emoji: '🏠' },
            ].map(({ key, label, emoji }) => {
              const active = (sectionType === 'Rentals' ? 'Rentals' : 'Buying') === key;
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
        </View>

        {/* ── Tab Bar (Properties / Requirements) ── */}
        <View style={[styles.tabsRow, { backgroundColor: colors.cardBg }]}>
          {(['Properties', 'Requirements'] as const).map(tab => {
            const active = activeTab === tab;
            const count = tab === 'Properties' ? properties.length : requirements.length;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.tabText, 
                  { color: active ? colors.textPrimary : colors.textDim }, 
                  active && { fontWeight: '700' }
                ]}>
                  {tab === 'Properties' ? t('myProperties.title', 'My Listings') : t('myProperties.clientReq', 'My Requirement')}{' '}
                  <Text style={[styles.tabCount, active && { color: Brand.teal }]}>
                    ({count})
                  </Text>
                </Text>
                {active && (
                  <LinearGradient
                    colors={[Brand.blue, Brand.teal]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activeIndicator}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Search Bar ── */}
        <View style={[styles.searchContainerWrap, { backgroundColor: colors.navy }]}> 
          <View style={[styles.searchContainer, { backgroundColor: colors.cardBg }]}> 
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              testID="inventory-search-input"
              accessibilityLabel={activeTab === 'Properties' ? 'Search my listings' : 'Search my requirements'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={activeTab === 'Properties'
                ? 'Search listings by location, title...'
                : 'Search requirements by location, details...'}
              placeholderTextColor={colors.textDim}
              style={[styles.searchInputText, { color: colors.textPrimary }]}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                testID="inventory-search-clear"
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={styles.filterBtn}
                onPress={() => setSearchQuery('')}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.textDim} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Lists ── */}
        <ScrollView 
          contentContainerStyle={styles.listContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={activeTab === 'Properties' ? loadingProp : loadingReq}
              onRefresh={activeTab === 'Properties' ? fetchProperties : fetchRequirements}
              tintColor={Brand.teal}
              colors={[Brand.teal]}
            />
          }
        >
          {activeTab === 'Properties' && propertyError ? (
            <Text style={[styles.errorText, { color: colors.errorText }]}>{propertyError}</Text>
          ) : null}
          {activeTab === 'Properties' ? (
            filteredProperties.length > 0 ? filteredProperties.map(renderPropertyCard) : (
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>
                {loadingProp
                  ? 'Loading listings...'
                  : searchQuery.trim()
                    ? 'No listings match your search.'
                    : t('myProperties.noProperties')}
              </Text>
            )
          ) : (
            filteredRequirements.length > 0 ? filteredRequirements.map(renderRequirementCard) : (
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>
                {loadingReq
                  ? 'Loading...'
                  : searchQuery.trim()
                    ? 'No requirements match your search.'
                    : t('myProperties.noRequirements')}
              </Text>
            )
          )}
          <View style={styles.footerSpacer} />
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
            <Text style={[styles.filterSheetTitle, { color: colors.textPrimary }]}>{t('dashboard.quickActions', 'Quick Actions')}</Text>
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionCardRow, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}
                onPress={() => {
                  setIsActionsVisible(false);
                  navigation.navigate('AddProperty', {});
                }}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                  <MaterialCommunityIcons name="home-plus" size={26} color={Brand.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionCardTitle, { color: colors.textPrimary }]}>{t('dashboard.addProperty', 'Add Property')}</Text>
                  <Text style={[styles.actionCardSub, { color: colors.textDim }]}>{t('dashboard.addPropertySub', 'List a new property for sale or rent')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDim} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionCardRow, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}
                onPress={() => {
                  setIsActionsVisible(false);
                  navigation.navigate('AddRequirement', {});
                }}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={Brand.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionCardTitle, { color: colors.textPrimary }]}>{t('dashboard.addRequirement', 'Add Requirement')}</Text>
                  <Text style={[styles.actionCardSub, { color: colors.textDim }]}>{t('dashboard.addRequirementSub', 'Post a client requirement')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDim} />
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnGrad: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnOutline: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
  },
  tabCount: {
    fontSize: 13,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 2,
  },
  // --- Search Bar Styles ---
  searchContainerWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
  },
  filterBtn: {
    padding: 8,
    marginLeft: 4,
  },

  // --- List & Card Styles ---
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    borderRadius: Card.radius,   // 16dp — standardised token
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Card.padding,
    marginBottom: Spacing.lg + 2,
    ...Shadow.sm,
  },
  cardInnerLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardImageContainer: {
    width: 115,
    height: 115,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  cardDetailsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  propertyTypeLabel: {
    color: Brand.teal,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  propertyTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  priceAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  separatorText: {
    marginHorizontal: 6,
    color: '#9CA3AF',
    fontSize: 14,
  },
  areaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocation: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // --- Card Footer (Actions) ---
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  matchesCta: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(13, 148, 136, 0.4)',
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  matchesCtaEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  matchesCtaText: {
    color: Brand.teal,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  editBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.2)',
    borderRadius: 14,
  },
  editBtnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.teal,
  },
  
  footerSpacer: {
    height: 100,
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center' as const,
    fontSize: FontSize.body,
    // color is applied inline via colors.errorText
  },
  toggleRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 12, borderWidth: 1,
    overflow: 'hidden', gap: 2, padding: 2,
  },
  modeBtn: { borderRadius: 10, overflow: 'hidden' },
  modeBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6 },
  modeBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6 },
  modeBtnEmoji: { fontSize: 12 },
  modeBtnText: { fontSize: 12, fontWeight: '600' },
  
  // --- FAB & BottomSheet Styles ---
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...Shadow.teal,
  },
  fabGrad: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    color: '#FFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
  filterSheetContent: {
    padding: 20,
    paddingBottom: 40,
  },
  filterSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  actionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionCardSub: {
    fontSize: 13,
  },
});
