import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../../navigation/RootNavigator';
import {
  getAuthenticatedMediaSource,
  getMatchDetails,
  MatchDetailDTO,
  MatchMediaDTO,
} from '../../api/matches';
import { useAppTheme, Brand } from '../../theme/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetail'>;

const DETAIL_LABELS: Record<string, string> = {
  availableFrom: 'Available from',
  securityDeposit: 'Security deposit',
  maintenanceCharges: 'Maintenance charges',
  maintenanceIncluded: 'Maintenance included',
  societyCharges: 'Society charges',
  societyIncluded: 'Society charges included',
  totalFloors: 'Total floors',
  propertyAge: 'Property age',
  bathrooms: 'Bathrooms',
  balconies: 'Balconies',
  superBuiltupArea: 'Super built-up area',
  amenities: 'Amenities',
  tenantPreferences: 'Tenant preferences',
  dietaryPreference: 'Dietary preference',
  petPolicy: 'Pet policy',
  minLeasePeriod: 'Minimum lease period',
  maxOccupants: 'Maximum occupants',
  wfhAllowed: 'Work from home allowed',
  policeVerification: 'Police verification required',
  plotArea: 'Plot area',
  numberOfFloors: 'Number of floors',
  roadWidth: 'Road width',
  reraRegistered: 'RERA registered',
  reraNumber: 'RERA number',
};

const humanize = (key: string) => DETAIL_LABELS[key] || key
  .replace(/_/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/^./, value => value.toUpperCase());

const renderValue = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(renderValue).filter(Boolean).join(', ');
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${humanize(key.replace(/^(Tenant|Business)_/, ''))}: ${renderValue(item)}`)
      .join(' · ');
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString();
  }
  return String(value ?? '');
};

const money = (value?: number | null, unit?: string | null) => {
  if (!value) return 'Price on request';
  const suffix = String(unit || '').toUpperCase() === 'PER_MONTH' ? '/month' : '';
  return `₹${Number(value).toLocaleString('en-IN')}${suffix}`;
};

function Fact({ icon, label, value, colors }: { icon: string; label: string; value?: unknown; colors: ReturnType<typeof useAppTheme>['colors'] }) {
  if (value === null || value === undefined || value === '') return null;
  const display = renderValue(value);
  if (!display) return null;
  return (
    <View style={[styles.fact, { backgroundColor: colors.cardBgLight, borderColor: colors.borderFaint }]}>
      <MaterialCommunityIcons name={icon} size={18} color={Brand.teal} />
      <View style={styles.factCopy}>
        <Text style={[styles.factLabel, { color: colors.textDim }]}>{label}</Text>
        <Text style={[styles.factValue, { color: colors.textPrimary }]}>{display}</Text>
      </View>
    </View>
  );
}

export default function MatchDetailScreen({ route, navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const matchId = Number(route.params.matchId);
  const [details, setDetails] = useState<MatchDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeMedia, setActiveMedia] = useState<MatchMediaDTO | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setDetails(await getMatchDetails(matchId));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Could not load match details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  const structuredFacts = useMemo(() => Object.entries(details?.property.details || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== ''), [details]);

  const openPhone = () => {
    const phone = details?.unlockedContact?.ownerMobile;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = () => {
    const phone = details?.unlockedContact?.ownerMobile?.replace(/[^0-9]/g, '');
    if (!phone) return;
    Linking.openURL(`https://wa.me/${phone}`).catch(() => Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp on this device.'));
  };

  if (loading) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.navy }]}>
        <ActivityIndicator size="large" color={Brand.teal} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading property details…</Text>
      </View>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView style={[styles.fullScreen, { backgroundColor: colors.navy }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={42} color={colors.errorText} />
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Details unavailable</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity onPress={() => load()} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
        <TouchableOpacity onPress={navigation.goBack}><Text style={[styles.backLink, { color: colors.textSecondary }]}>Back to matches</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const property = details.property;
  const requirement = details.requirement;
  const media = property.media || [];
  const location = [property.locality || property.projectName, property.city].filter(Boolean).join(', ');

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />
      <LinearGradient colors={[colors.bgStart, colors.bgMid, colors.bgEnd]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.borderFaint }]}>
          <TouchableOpacity accessibilityLabel="Back" onPress={navigation.goBack} style={[styles.headerButton, { backgroundColor: colors.cardBg }]}>
            <MaterialCommunityIcons name="arrow-left" size={23} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Match details</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textDim }]}>Match #{details.matchId}</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: colors.successFaint }]}>
            <Text style={[styles.scoreText, { color: colors.successText }]}>{Math.round(Number(details.matchScore || 0))}%</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Brand.teal} colors={[Brand.teal]} />}
        >
          <View style={styles.roleBanner}>
            <MaterialCommunityIcons name="account-switch-outline" size={20} color={Brand.blue} />
            <Text style={[styles.roleText, { color: colors.textSecondary }]}>
              {details.currentBrokerRole === 'listing'
                ? 'Your property matches this broker’s client requirement.'
                : 'This broker’s property matches your client requirement.'}
            </Text>
          </View>

          <View style={styles.mediaSection}>
            {media.length > 0 ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
                {media.map((item, index) => {
                  const source = getAuthenticatedMediaSource(item.url);
                  return (
                    <TouchableOpacity key={item.mediaId} activeOpacity={0.9} onPress={() => setActiveMedia(item)} style={[styles.mediaCard, { backgroundColor: colors.cardBg }]}>
                      {item.mediaType === 'image' ? (
                        <Image source={source} style={styles.mediaImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.mediaImage, styles.videoCard]}>
                          <MaterialCommunityIcons name="play-circle" size={58} color="#FFFFFF" />
                          <Text style={styles.videoCardText}>Play video</Text>
                        </View>
                      )}
                      <View style={styles.mediaCounter}><Text style={styles.mediaCounterText}>{index + 1}/{media.length}</Text></View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={[styles.emptyMedia, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint }]}>
                <MaterialCommunityIcons name="image-off-outline" size={34} color={colors.textDim} />
                <Text style={[styles.emptyMediaTitle, { color: colors.textPrimary }]}>No photos or videos added</Text>
                <Text style={[styles.emptyMediaText, { color: colors.textSecondary }]}>All available database details are shown below.</Text>
              </View>
            )}
          </View>

          <View style={styles.titleBlock}>
            <View style={[styles.statusPill, { backgroundColor: colors.successFaint }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.successText }]} />
              <Text style={[styles.statusText, { color: colors.successText }]}>{property.status || 'Status unavailable'}</Text>
            </View>
            <Text style={[styles.propertyTitle, { color: colors.textPrimary }]}>{[property.configuration, property.propertyType].filter(Boolean).join(' ') || 'Property'}</Text>
            <Text style={[styles.location, { color: colors.textSecondary }]}><MaterialCommunityIcons name="map-marker-outline" size={15} /> {location || 'Location not provided'}</Text>
            <Text style={styles.price}>{money(property.price, property.priceUnit)}</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Property information</Text>
            <View style={styles.factGrid}>
              <Fact icon="home-outline" label="Property type" value={property.propertyType} colors={colors} />
              <Fact icon="sofa-outline" label="Configuration" value={property.configuration} colors={colors} />
              <Fact icon="ruler-square" label="Area" value={property.size ? `${property.size} sq.ft` : null} colors={colors} />
              <Fact icon="sofa-single-outline" label="Furnishing" value={property.furnishing} colors={colors} />
              <Fact icon="compass-outline" label="Facing" value={property.facing} colors={colors} />
              <Fact icon="stairs" label="Floor" value={property.floorNumber} colors={colors} />
              <Fact icon="road-variant" label="Road / landmark" value={property.roadInfo} colors={colors} />
              <Fact icon="calendar-outline" label="Listed on" value={property.createdAt ? new Date(property.createdAt).toLocaleDateString() : null} colors={colors} />
            </View>
            {structuredFacts.length > 0 && (
              <View style={[styles.detailList, { borderTopColor: colors.borderFaint }]}>
                {structuredFacts.map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{humanize(key)}</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{renderValue(value)}</Text>
                  </View>
                ))}
              </View>
            )}
            {!!property.description && (
              <View style={[styles.notesBox, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.notesLabel, { color: colors.textDim }]}>Listing notes</Text>
                <Text style={[styles.notesText, { color: colors.textSecondary }]}>{property.description}</Text>
              </View>
            )}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.borderFaint }]}>
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Client requirement</Text>
              <Text style={[styles.idText, { color: colors.textDim }]}>#{requirement.requirementId}</Text>
            </View>
            <View style={styles.factGrid}>
              <Fact icon="home-search-outline" label="Looking for" value={requirement.propertyType} colors={colors} />
              <Fact icon="sofa-outline" label="Configurations" value={requirement.configurations} colors={colors} />
              <Fact icon="cash-multiple" label="Budget" value={money(requirement.budget, requirement.budgetUnit)} colors={colors} />
              <Fact icon="ruler-square" label="Minimum area" value={requirement.size ? `${requirement.size} sq.ft` : null} colors={colors} />
              <Fact icon="map-marker-radius-outline" label="City" value={requirement.city} colors={colors} />
              <Fact icon="sofa-single-outline" label="Furnishing" value={requirement.furnishingPreference} colors={colors} />
            </View>
            {!!requirement.description && (
              <View style={[styles.notesBox, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.notesLabel, { color: colors.textDim }]}>Requirement notes</Text>
                <Text style={[styles.notesText, { color: colors.textSecondary }]}>{requirement.description}</Text>
              </View>
            )}
          </View>

          {details.isRevealed && details.unlockedContact ? (
            <View style={[styles.contactCard, { backgroundColor: colors.successFaint, borderColor: colors.successText }]}>
              <View style={styles.contactHeading}>
                <MaterialCommunityIcons name="lock-open-check" size={23} color={colors.successText} />
                <View>
                  <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Contact unlocked</Text>
                  <Text style={[styles.contactName, { color: colors.textSecondary }]}>{details.unlockedContact.ownerName}</Text>
                </View>
              </View>
              <Text style={[styles.contactPhone, { color: colors.textPrimary }]}>{details.unlockedContact.ownerMobile}</Text>
              {!!details.unlockedContact.ownerEmail && <Text style={[styles.contactEmail, { color: colors.textSecondary }]}>{details.unlockedContact.ownerEmail}</Text>}
              <View style={styles.contactActions}>
                <TouchableOpacity onPress={openPhone} style={[styles.contactButton, { backgroundColor: Brand.blue }]}><MaterialCommunityIcons name="phone" size={18} color="#FFF" /><Text style={styles.contactButtonText}>Call</Text></TouchableOpacity>
                <TouchableOpacity onPress={openWhatsApp} style={[styles.contactButton, { backgroundColor: Brand.teal }]}><MaterialCommunityIcons name="whatsapp" size={18} color="#FFF" /><Text style={styles.contactButtonText}>WhatsApp</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.lockedCard, { backgroundColor: colors.warningFaint, borderColor: colors.warningText }]}>
              <MaterialCommunityIcons name="shield-lock-outline" size={25} color={colors.warningText} />
              <View style={styles.lockedCopy}>
                <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>Broker contact is protected</Text>
                <Text style={[styles.lockedText, { color: colors.textSecondary }]}>Photos and property information are visible here. Broker name, phone and email appear only after both brokers accept the unlock request.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={activeMedia !== null} animationType="fade" onRequestClose={() => setActiveMedia(null)}>
        <SafeAreaView style={styles.viewer}>
          <TouchableOpacity accessibilityLabel="Close media" onPress={() => setActiveMedia(null)} style={styles.viewerClose}>
            <MaterialCommunityIcons name="close" size={27} color="#FFFFFF" />
          </TouchableOpacity>
          {activeMedia?.mediaType === 'video' ? (
            <WebView source={getAuthenticatedMediaSource(activeMedia.url)} style={styles.webView} allowsFullscreenVideo mediaPlaybackRequiresUserAction />
          ) : activeMedia ? (
            <Image source={getAuthenticatedMediaSource(activeMedia.url)} style={styles.fullImage} resizeMode="contain" />
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  fullScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  loadingText: { marginTop: 12, fontSize: 13 },
  errorTitle: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  errorMessage: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  retryButton: { marginTop: 20, backgroundColor: Brand.teal, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '800' },
  backLink: { marginTop: 18, fontWeight: '600' },
  header: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 11 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 10, marginTop: 1 },
  scoreBadge: { minWidth: 48, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  scoreText: { fontSize: 14, fontWeight: '900' },
  content: { paddingBottom: 48 },
  roleBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 18, paddingVertical: 12 },
  roleText: { flex: 1, fontSize: 12, lineHeight: 18 },
  mediaSection: { minHeight: 190 },
  mediaRow: { paddingHorizontal: 16, gap: 12 },
  mediaCard: { width: 320, height: 190, borderRadius: 18, overflow: 'hidden' },
  mediaImage: { width: '100%', height: '100%' },
  mediaCounter: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(15,23,42,0.78)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  mediaCounterText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  videoCard: { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  videoCardText: { color: '#FFFFFF', marginTop: 5, fontSize: 12, fontWeight: '700' },
  emptyMedia: { marginHorizontal: 16, height: 160, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  emptyMediaTitle: { fontSize: 14, fontWeight: '800', marginTop: 8 },
  emptyMediaText: { fontSize: 11, marginTop: 3 },
  titleBlock: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 9 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  propertyTitle: { fontSize: 23, fontWeight: '900', letterSpacing: -0.5 },
  location: { fontSize: 13, marginTop: 5 },
  price: { fontSize: 21, fontWeight: '900', color: Brand.teal, marginTop: 10 },
  sectionCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 18, borderWidth: 1, padding: 15 },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 13 },
  idText: { fontSize: 11, marginBottom: 13 },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  fact: { width: '48%', minHeight: 65, borderRadius: 12, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  factCopy: { flex: 1 },
  factLabel: { fontSize: 9, textTransform: 'uppercase', fontWeight: '700' },
  factValue: { fontSize: 12, fontWeight: '700', marginTop: 3, lineHeight: 16 },
  detailList: { borderTopWidth: 1, marginTop: 15, paddingTop: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 8 },
  detailLabel: { flex: 1, fontSize: 12 },
  detailValue: { flex: 1.4, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  notesBox: { borderRadius: 12, padding: 12, marginTop: 13 },
  notesLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginBottom: 5 },
  notesText: { fontSize: 12, lineHeight: 18 },
  contactCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, borderWidth: 1, padding: 16 },
  contactHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  contactTitle: { fontSize: 15, fontWeight: '800' },
  contactName: { fontSize: 12, marginTop: 2 },
  contactPhone: { fontSize: 18, fontWeight: '900', marginTop: 14 },
  contactEmail: { fontSize: 12, marginTop: 3 },
  contactActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  contactButton: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  contactButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  lockedCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  lockedCopy: { flex: 1 },
  lockedTitle: { fontSize: 14, fontWeight: '800' },
  lockedText: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  viewer: { flex: 1, backgroundColor: '#000000' },
  viewerClose: { position: 'absolute', top: 14, right: 14, zIndex: 5, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(15,23,42,0.78)', alignItems: 'center', justifyContent: 'center' },
  fullImage: { flex: 1, width: '100%' },
  webView: { flex: 1, backgroundColor: '#000000' },
});
