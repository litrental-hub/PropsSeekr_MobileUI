import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';

import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
  const { creditsBalance, sectionType, setSectionType } = useAppStore();
  const user = useAuthStore(s => s.user);
  
  const theme = useAppTheme();
  const { colors, type, isDark } = theme;

  const [selectedBHK, setSelectedBHK] = useState('Sab');
  const [activeTab, setActiveTab] = useState<'Available' | 'Looking' | 'Matched'>('Available');

  const isRental = sectionType === 'Rentals';
  const tabCounts = isRental
    ? { Available: 84, Looking: 43, Matched: 12 }
    : { Available: 156, Looking: 72, Matched: 12 };

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
              { key: 'Rentals',  label: 'Rental',   emoji: '🔑' },
              { key: 'Buying',   label: 'Buy/Sell',  emoji: '🏠' },
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
            style={styles.creditsWrap}
            onPress={() => navigation.navigate('BuyCredits')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Brand.blue, Brand.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.creditsGrad}
            >
              <Text style={styles.creditsIcon}>⊙</Text>
              <View>
                <Text style={styles.creditsValue}>{creditsBalance}</Text>
                <Text style={styles.creditsLabel}>credits</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Location Bar ── */}
        <View style={[styles.locationBar, { backgroundColor: colors.cardBg, borderBottomColor: Brand.blueBorder }]}>
          <View style={styles.locationLeft}>
            <Text style={styles.locationPin}>📍</Text>
            <View>
              <Text style={[styles.locationName, { color: colors.textPrimary }]}>Vijay Nagar, Indore</Text>
              <Text style={[styles.locationSub, { color: colors.textDim }]}>
                5 km radius · {isRental ? '127 rental' : '228 buy/sell'} listings
              </Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.changeBtn}>Change →</Text>
          </TouchableOpacity>
        </View>

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
                placeholder="Area, property type, budget..."
                placeholderTextColor={colors.textDim}
                editable={false}
              />
            </View>
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={[Brand.blue, Brand.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterGrad}
              >
                <Text style={styles.filterIcon}>☰</Text>
                <Text style={styles.filterText}>Filter</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── BHK Chips ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bhkRow}
          >
            {BHK_FILTERS.map(f => {
              const active = selectedBHK === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setSelectedBHK(f)}
                  activeOpacity={0.75}
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
          </ScrollView>

          {/* ── Tabs: Available / Looking / Matched ── */}
          <View style={[styles.tabsRow, { backgroundColor: colors.cardBg, borderBottomColor: Brand.blueBorder }]}>
            {(['Available', 'Looking', 'Matched'] as const).map(tab => {
              const active = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabText, { color: active ? colors.textPrimary : colors.textDim }, active && { fontWeight: '700' }]}>
                    {tab}{' '}
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
            <Text style={styles.sectionTitle}>AAPKE AAS-PAAS</Text>
            <Text style={[styles.sectionSub, { color: colors.textDim }]}>Vijay Nagar · 1.2 km</Text>
          </View>

          {/* ── Property Card ── */}
          <PropertyCard property={MOCK_PROPERTY} isRental={isRental} theme={theme} />

          {/* ── Active Requirements ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>ACTIVE REQUIREMENTS</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllBtn}>Client dhoondh raha hai →</Text>
            </TouchableOpacity>
          </View>

          {MOCK_REQUIREMENTS.map(req => (
            <RequirementRow key={req.id} item={req} theme={theme} />
          ))}
        </ScrollView>

        {/* ── FAB (+ button) ── */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <LinearGradient
            colors={[Brand.blue, Brand.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGrad}
          >
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  property: typeof MOCK_PROPERTY;
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
        {property.features.map((f, i) => (
          <View key={i} style={[styles.featureChip, { backgroundColor: colors.cardBgLight, borderColor: colors.borderFaint }]}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Owner Preferences */}
      <Text style={[styles.prefTitle, { color: colors.textDim }]}>OWNER PREFERENCES</Text>
      <View style={styles.prefRow}>
        {property.preferences.map((p, i) => (
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

  // Credits
  creditsWrap: { borderRadius: 20, overflow: 'hidden' },
  creditsGrad: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  creditsIcon:  { fontSize: 16, color: Brand.white },
  creditsValue: { fontSize: 13, fontWeight: '800', color: Brand.white, lineHeight: 16 },
  creditsLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', lineHeight: 11 },

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
  tabItem:       { marginRight: 24, paddingVertical: 12, position: 'relative' },
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
});
