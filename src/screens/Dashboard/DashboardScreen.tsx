import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { LogoLoader } from '../../components/common/LogoLoader';
import { BottomSheet } from '../../components/BottomSheet';
import { detectCurrentLocation, requestLocationPermissions } from '../../utils/location';
import { searchProperties, getMyListings, uploadBulkTxtFile } from '../../api/property';
import { getMatches } from '../../api/matches';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const mapApiToProperty = (item: any, isRental: boolean, mock: any) => ({
  id: item.id || item.propertyRequestId || item.listingId || Math.random().toString(),
  title: item.title || item.propertyTitle || item.buildingName || `${item.bhk || '2BHK'} ${item.propertyType || item.category || 'Flat'}`,
  subtitle: `${item.locality || item.city || 'Indore'} · ${item.category || item.propertyType || 'Residential'}`,
  badge: item.status || 'AVAILABLE',
  badgeType: item.category || 'Residential',
  freshLabel: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Active Listing',
  kiraya: item.price !== undefined ? (typeof item.price === 'number' ? `₹${item.price.toLocaleString('en-IN')}/mo` : `₹${item.price}/mo`) : (typeof item.askingPrice === 'number' ? `₹${item.askingPrice.toLocaleString('en-IN')}/mo` : (typeof item.expectedPrice === 'number' ? `₹${item.expectedPrice.toLocaleString('en-IN')}/mo` : '₹14,000/mo')),
  kirayaBuySell: item.price !== undefined ? (typeof item.price === 'number' ? `₹${(item.price / 100000).toFixed(2)}L` : `₹${item.price}`) : (typeof item.askingPrice === 'number' ? `₹${(item.askingPrice / 100000).toFixed(2)}L` : (typeof item.expectedPrice === 'number' ? `₹${(item.expectedPrice / 100000).toFixed(2)}L` : '₹52L')),
  area: item.builtUpSize ? `${item.builtUpSize} sqft` : (item.areaSqFt ? `${item.areaSqFt} sqft` : '950 sqft'),
  available: item.availableFrom || 'Immediate',
  features: Array.isArray(item.features) && item.features.length > 0 ? item.features : mock.features,
  preferences: Array.isArray(item.preferences) && item.preferences.length > 0 ? item.preferences : mock.preferences,
  locationLabel: item.locationLabel || `${item.locality || 'Nearby'} · PropSeekr Network`,
  isNearby: item.isNearby !== undefined ? item.isNearby : true,
  brokerInitials: item.brokerInitials || (item.brokerName || item.ownerName || 'VB').slice(0, 2).toUpperCase(),
  brokerName: item.brokerName || item.ownerName || 'Verified Broker',
  brokerSub: item.brokerSub || `${item.locality || item.city || 'PropSeekr'} · Network`,
  unlockCost: item.unlockCost !== undefined ? item.unlockCost : 1,
});

// ── Mock Data ────────────────────────────────────────────────
const BHK_FILTERS = ['Sab', '1BHK', '2BHK', '3BHK', 'Commercial', 'Plot', 'Villa'];

const MOCK_PROPERTY = {
  title: '2BHK Semi-Furnished Flat',
  subtitle: 'Vijay Nagar, Indore · 2nd Floor · West facing',
  badge: 'AVAILABLE',
  badgeType: 'Residential',
  freshLabel: 'Aaj dala',
  kiraya: '₹14,000/mo',
  kirayaBuySell: '₹52L',
  area: '950 sqft',
  available: 'Abhi se',
  features: [
    { icon: '🪑', label: 'Semi-furnished' },
    { icon: '🚗', label: 'Parking' },
    { icon: '🏢', label: '2nd floor' },
    { icon: '🧭', label: 'West' },
    { icon: '🛁', label: '2 bath' },
    { icon: '⚡', label: '24hr power' },
  ],
  preferences: [
    { label: 'Family preferred',        allowed: true },
    { label: 'Working professionals',   allowed: true },
    { label: 'No pets',                 allowed: false },
    { label: 'No non-veg',              allowed: false },
    { label: 'No bachelors',            allowed: false },
  ],
  locationLabel: '1.2 km · Vijay Nagar main road',
  isNearby: true,
  brokerInitials: 'RK',
  brokerName: 'Rahul Kumar',
  brokerSub: 'Vijay Nagar · PropSeekr',
  unlockCost: 1,
};

const MOCK_REQUIREMENTS = [
  { id: '1', title: '3BHK flat for family',    sub: 'Budget ₹50–70L · South Tukoganj', initials: 'AM', color: '#7C3AED' },
  { id: '2', title: '2BHK rental for couple',  sub: 'Rent ₹12–18K · Vijay Nagar',     initials: 'SK', color: '#0A6E5E' },
];

// ── Main Screen ──────────────────────────────────────────────
export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { creditsBalance, sectionType, setSectionType, location, setLocation } = useAppStore();
  const user = useAuthStore(s => s.user);
  const { t } = useTranslation();
  
  const theme = useAppTheme();
  const { colors, type, isDark } = theme;

  useEffect(() => {
    // Automatically detect GPS location and geocode city/locality on boot/login
    (async () => {
      const detected = await detectCurrentLocation(location.radiusKm || 5);
      if (detected) {
        setLocation(detected);
      }
    })();
  }, []);

  const handleChangeLocation = () => {
    // Request permissions in parallel without blocking screen navigation
    requestLocationPermissions();
    navigation.navigate('Search' as any);
  };

  const [selectedBHK, setSelectedBHK] = useState('Sab');
  const [activeTab, setActiveTab] = useState<'Available' | 'Looking'>('Available');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [apiProperties, setApiProperties] = useState<any[]>([]);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [lookingCount, setLookingCount] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const authUser = useAuthStore(s => s.user);

  const isRental = sectionType === 'Rentals';
  const tabCounts = {
    Available: availableCount ?? (isRental ? 84 : 156),
    Looking: lookingCount ?? (isRental ? 43 : 72),
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setApiProperties(allProperties);
      return;
    }
    const q = text.toLowerCase().trim();
    const filtered = allProperties.filter(p => {
      const target = [p.title, p.subtitle, p.badge, p.badgeType, p.locationLabel, p.brokerName, p.kiraya, p.kirayaBuySell]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return target.includes(q);
    });
    setApiProperties(filtered);
  };

  const fetchProperties = async (query?: string) => {
    try {
      setSearching(true);
      const payload = {
        latitude: location.lat || 19.1136,
        longitude: location.lng || 72.8697,
        radiusKm: location.radiusKm || 10.0,
        transactionType: isRental ? 'RENTAL' : 'BUY_SELL',
        category: selectedBHK !== 'Sab' && selectedBHK !== 'Commercial' ? 'Residential' : (selectedBHK === 'Commercial' ? 'Commercial' : 'Residential'),
        page: 1,
        limit: 20,
        query: query !== undefined ? query : searchQuery,
      };

      const results: any[] = [];
      try {
        const searchRes = await searchProperties(payload);
        if (typeof searchRes.availableCount === 'number') setAvailableCount(searchRes.availableCount);
        else if (typeof searchRes.activeCount === 'number') setAvailableCount(searchRes.activeCount);
        else if (typeof searchRes.totalCount === 'number') setAvailableCount(searchRes.totalCount);

        if (typeof searchRes.lookingCount === 'number') setLookingCount(searchRes.lookingCount);

        const searchItems = searchRes.results || searchRes.data || (Array.isArray(searchRes) ? searchRes : []);
        searchItems.forEach((it: any) => results.push(mapApiToProperty(it, isRental, MOCK_PROPERTY)));
      } catch (err) {}

      try {
        const matchRes: any = await getMatches(authUser?.id || '3030be5f-703c-448d-aebb-33960f9d8f4e', 1, 30);
        const matchItems = matchRes.results || (Array.isArray(matchRes) ? matchRes : []);
        matchItems.forEach((it: any) => results.push(mapApiToProperty(it, isRental, MOCK_PROPERTY)));
      } catch (err) {}

      try {
        const myRes: any = await getMyListings();
        const myItems = Array.isArray(myRes) ? myRes : (myRes?.data || myRes?.listings || []);
        myItems.forEach((it: any) => results.push(mapApiToProperty(it, isRental, MOCK_PROPERTY)));
      } catch (err) {}

      // Deduplicate by title & locality
      const seen = new Set();
      const uniqueList = results.filter(item => {
        const key = item.title + '|' + item.subtitle;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const listToUse = uniqueList.length > 0 ? uniqueList : [MOCK_PROPERTY];
      setAllProperties(listToUse);

      const q = (query !== undefined ? query : searchQuery).toLowerCase().trim();
      if (!q) {
        setApiProperties(listToUse);
      } else {
        setApiProperties(listToUse.filter(p => {
          const target = [p.title, p.subtitle, p.badge, p.badgeType, p.locationLabel, p.brokerName, p.kiraya, p.kirayaBuySell]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return target.includes(q);
        }));
      }
    } catch (err) {
      console.log('Property search API error on home page:', err);
      setAllProperties([MOCK_PROPERTY]);
      setApiProperties([MOCK_PROPERTY]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [location.lat, location.lng, sectionType, selectedBHK]);

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
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="bell-outline" size={26} color={colors.textPrimary} />
            {/* Optional notification dot */}
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>

        {/* ── Location Bar ── */}
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleChangeLocation} 
          style={[styles.locationBar, { backgroundColor: colors.cardBg, borderBottomColor: Brand.blueBorder }]}
        >
          <View style={styles.locationLeft}>
            <Text style={styles.locationPin}>📍</Text>
            <View>
              <Text style={[styles.locationName, { color: colors.textPrimary }]}>{location.locality}, {location.city}</Text>
              <Text style={[styles.locationSub, { color: colors.textDim }]}>
                {location.radiusKm} km radius · {isRental ? '127 rental' : '228 buy/sell'} listings
              </Text>
            </View>
          </View>
          <Text style={styles.changeBtn}>{t('dashboard.change')}</Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* ── Search + Filter ── */}
          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder={t('dashboard.searchPlaceholder')}
                placeholderTextColor={colors.textDim}
                editable={true}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={() => fetchProperties()}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity 
              style={styles.filterBtn} 
              activeOpacity={0.85}
              onPress={() => setIsFilterVisible(true)}
            >
              <LinearGradient
                colors={[Brand.blue, Brand.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterGrad}
              >
                <Text style={styles.filterIcon}>☰</Text>
                <Text style={styles.filterText}>
                  {selectedBHK !== 'Sab' ? selectedBHK : t('dashboard.filter')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Tabs: Available / Looking ── */}
          <View style={[styles.tabsRow, { backgroundColor: colors.cardBg, borderBottomColor: Brand.blueBorder }]}>
            {(['Available', 'Looking'] as const).map(tab => {
              const active = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabText, { color: active ? colors.textPrimary : colors.textDim }, active && { fontWeight: '700' }]}>
                    {tab === 'Available' ? t('dashboard.available') : t('dashboard.looking')}{' '}
                    <Text style={[styles.tabCount, active && { color: Brand.teal }]}>
                      {tabCounts[tab]}
                    </Text>
                  </Text>
                  {active && (
                    <LinearGradient
                      colors={[Brand.blue, Brand.teal]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabUnderline}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── "AAPKE AAS-PAAS" Section ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('dashboard.nearby')}</Text>
            <Text style={[styles.sectionSub, { color: colors.textDim }]}>Vijay Nagar · 1.2 km</Text>
          </View>

          {/* ── Property Card ── */}
          {searching ? (
            <LogoLoader size={56} theme={type} text={`Loading ${isRental ? 'Rental' : 'Buy & Sell'} properties…`} />
          ) : apiProperties.length > 0 ? (
            apiProperties.map((prop, idx) => (
              <View key={`searched-${idx}`} style={{ marginBottom: 12 }}>
                <PropertyCard property={prop} isRental={isRental} theme={theme} />
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.textDim, fontSize: 15 }}>{t('dashboard.noMatches')} "{searchQuery}"</Text>
            </View>
          )}


          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── FAB (+ button) ── */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setIsActionsVisible(true)}>
          <LinearGradient
            colors={[Brand.blue, Brand.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGrad}
          >
            <Text style={styles.fabIcon}>+</Text>
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

                    Alert.alert('Uploading', `Uploading ${fileName}... Please wait.`);
                    await uploadBulkTxtFile(pickerResult.uri, fileName);
                    Alert.alert('Upload Successful 🎉', 'Your bulk file has been uploaded to AWS S3 successfully and scheduled for processing!');
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
              {BHK_FILTERS.map(f => {
                const active = selectedBHK === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => {
                      setSelectedBHK(f);
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
                        <Text style={[styles.bhkChipTextActive, { color: '#FFFFFF' }]}>{f}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.bhkChip, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
                        <Text style={[styles.bhkChipText, { color: colors.textSecondary }]}>{f}</Text>
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
  theme,
}: {
  property: any;
  isRental: boolean;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { colors } = theme;
  return (
    <View style={[styles.propCard, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      {/* Top Row */}
      <View style={styles.propTopRow}>
        <View style={styles.propBadgeRow}>
          <LinearGradient
            colors={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.1)']}
            style={styles.availBadge}
          >
            <Text style={styles.availBadgeText}>{property.badge}</Text>
          </LinearGradient>
          <Text style={[styles.propType, { color: colors.textSecondary }]}>{property.badgeType}</Text>
        </View>
        <View style={styles.freshRow}>
          <View style={styles.freshDot} />
          <Text style={[styles.freshText, { color: colors.textDim }]}>{property.freshLabel}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.propTitle, { color: colors.textPrimary }]}>{property.title}</Text>
      <Text style={[styles.propSubtitle, { color: colors.textSecondary }]}>{property.subtitle}</Text>

      {/* Stats Row */}
      <View style={[styles.statsRow, { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg }]}>
        {[
          { label: isRental ? 'KIRAYA' : 'PRICE',  value: isRental ? property.kiraya : property.kirayaBuySell },
          { label: 'AREA',      value: property.area,      center: true },
          { label: 'AVAILABLE', value: property.available },
        ].map(({ label, value, center }, i) => (
          <View key={i} style={[styles.statCol, center && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Brand.blueBorder }]}>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>{label}</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Features */}
      <View style={styles.featureRow}>
        {(property.features || []).map((f: any, i: number) => (
          <View key={i} style={[styles.featureChip, { backgroundColor: colors.cardBgLight, borderColor: colors.borderFaint }]}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Owner Preferences */}
      <Text style={[styles.prefTitle, { color: colors.textDim }]}>OWNER PREFERENCES</Text>
      <View style={styles.prefRow}>
        {(property.preferences || []).map((p: any, i: number) => (
          <View
            key={i}
            style={[
              styles.prefChip,
              { backgroundColor: p.allowed ? colors.successFaint : colors.errorFaint },
            ]}
          >
            <Text style={[styles.prefChipText, { color: p.allowed ? Brand.teal : colors.errorText }]}>
              {p.allowed ? '✓' : '✕'} {p.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Location Row */}
      <View style={[styles.propLocRow, { borderTopColor: Brand.blueBorder }]}>
        <Text style={[styles.propLocText, { color: colors.textSecondary }]}>📍 {property.locationLabel}</Text>
        {property.isNearby && (
          <View style={[styles.nearbyBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
            <Text style={styles.nearbyText}>Aapke paas hai</Text>
          </View>
        )}
      </View>

      {/* Broker + Actions */}
      <View style={styles.propFooter}>
        <View style={styles.brokerRow}>
          <LinearGradient
            colors={[Brand.blue, Brand.teal]}
            style={styles.brokerAvatar}
          >
            <Text style={styles.brokerInitials}>{property.brokerInitials}</Text>
          </LinearGradient>
          <View>
            <Text style={[styles.brokerName, { color: colors.textPrimary }]}>{property.brokerName}</Text>
            <Text style={[styles.brokerSub, { color: colors.textDim }]}>{property.brokerSub}</Text>
          </View>
        </View>

        <View style={styles.propActions}>
          <TouchableOpacity style={[styles.meraClientBtn, { borderColor: Brand.blueBorder, backgroundColor: colors.inputBg }]} activeOpacity={0.8}>
            <Text style={[styles.meraClientText, { color: colors.textSecondary }]}>+ Mera client hai</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient
              colors={[Brand.blue, Brand.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.unlockBtn}
            >
              <Text style={styles.unlockText}>Unlock ({property.unlockCost}cr)</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Requirement Row ─────────────────────────────────────────
function RequirementRow({
  item,
  theme,
}: {
  item: { id: string; title: string; sub: string; initials: string; color: string };
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { colors } = theme;
  return (
    <TouchableOpacity style={[styles.reqRow, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]} activeOpacity={0.8}>
      <View style={[styles.reqAvatar, { backgroundColor: item.color }]}>
        <Text style={styles.reqInitials}>{item.initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.reqTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.reqSub, { color: colors.textDim }]}>{item.sub}</Text>
      </View>
      <Text style={[styles.reqArrow, { color: colors.textDim }]}>→</Text>
    </TouchableOpacity>
  );
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
  locationLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  propSubtitle: { fontSize: 12, marginBottom: 14 },

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

  // Broker footer
  propFooter:    {},
  brokerRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  brokerAvatar:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  brokerInitials:{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  brokerName:    { fontSize: 13, fontWeight: '700' },
  brokerSub:     { fontSize: 11 },

  propActions:   { flexDirection: 'row', gap: 8, alignItems: 'center' },
  meraClientBtn: {
    flex: 1, borderWidth: 1.5,
    borderRadius: 10, paddingVertical: 9, alignItems: 'center',
  },
  meraClientText:{ fontSize: 11, fontWeight: '700' },
  unlockBtn:     { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  unlockText:    { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

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
