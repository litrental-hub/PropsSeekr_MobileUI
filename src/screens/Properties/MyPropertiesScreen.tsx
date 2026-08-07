import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMyRequirements } from '../../api/requirements';
import { getMyListings } from '../../api/property';

import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';
import { formatPrice } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface PropertyItem {
  id: string;
  title: string;
  location: string;
  price: string;
  type: 'RENTAL' | 'BUY/SELL';
  status: 'Active' | 'Under Review' | 'Rented' | 'Sold';
  views: number;
  matches: number;
}

interface RequirementItem {
  id: string;
  lookingFor: string;
  location: string;
  budget: string;
  status: 'Active' | 'Paused';
  matchesFound: number;
}

const MOCK_MY_PROPERTIES: PropertyItem[] = [
  {
    id: 'prop-1',
    title: '2BHK Semi-Furnished Flat',
    location: 'Vijay Nagar, Indore',
    price: '₹14,000 /mo',
    type: 'RENTAL',
    status: 'Active',
    views: 45,
    matches: 12,
  },
  {
    id: 'prop-2',
    title: 'Commercial Office Space 1500 sqft',
    location: 'AB Road, Indore',
    price: '₹85,000 /mo',
    type: 'RENTAL',
    status: 'Active',
    views: 110,
    matches: 24,
  },
  {
    id: 'prop-3',
    title: '3BHK Luxury Penthouse',
    location: 'New Palasia, Indore',
    price: '₹1.25 Cr',
    type: 'BUY/SELL',
    status: 'Under Review',
    views: 8,
    matches: 2,
  }
];

const MOCK_MY_REQUIREMENTS: RequirementItem[] = [
  {
    id: 'req-1',
    lookingFor: '3BHK Flat for Family',
    location: 'South Tukoganj · 5 km radius',
    budget: '₹50 – 70 Lakhs',
    status: 'Active',
    matchesFound: 8,
  },
  {
    id: 'req-2',
    lookingFor: '1BHK or Studio Apartment',
    location: 'Vijay Nagar · Walking distance to IT Park',
    budget: '₹10 – 15K /month',
    status: 'Active',
    matchesFound: 15,
  }
];

export default function MyPropertiesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, type } = useAppTheme();
  const isDark = type === 'dark';
  const { t } = useTranslation();
  const { sectionType, setSectionType } = useAppStore();
  const [activeTab, setActiveTab] = useState<'Properties' | 'Requirements'>('Properties');
  const [requirements, setRequirements] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>(MOCK_MY_PROPERTIES);
  const [loadingReq, setLoadingReq] = useState(false);
  const [loadingProp, setLoadingProp] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'Requirements') {
        fetchRequirements();
      } else {
        fetchProperties();
      }
    }, [activeTab])
  );

  const fetchProperties = async () => {
    try {
      setLoadingProp(true);
      const res = await getMyListings(1, 20);
      const list = (res as any)?.listings || (res as any)?.data || (Array.isArray(res) ? res : []);
      if (list && list.length > 0) {
        setProperties(list);
      }
    } catch (err) {
      console.log('Error fetching properties:', err);
    } finally {
      setLoadingProp(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      setLoadingReq(true);
      const data = await getMyRequirements(1, 20);
      setRequirements(data?.data || data || []);
    } catch (err) {
      console.log('Error fetching requirements:', err);
    } finally {
      setLoadingReq(false);
    }
  };

  const handleAddProperty = () => {
    navigation.navigate('AddProperty', {});
  };

  const handleAddRequirement = () => {
    navigation.navigate('AddRequirement', {});
  };

  const renderPropertyCard = (item: any) => (
    <View key={item.id || item.listingId || Math.random().toString()} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <View style={styles.cardHeader}>
        <View style={styles.tagWrap}>
          <Text style={styles.tagText}>{item.type || item.propertyType || 'RENTAL'}</Text>
        </View>
        <View style={[
          styles.statusWrap, 
          { backgroundColor: item.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: item.status === 'Active' ? '#10B981' : '#F59E0B' }
          ]}>
            ● {item.status || 'Active'}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title || item.buildingName || item.bhk || 'Property Listing'}</Text>
      <Text style={[styles.cardLocation, { color: colors.textSecondary }]}>📍 {item.location || item.locality || 'Unknown Location'}</Text>
      
      <Text style={styles.cardPrice}>{formatPrice(item.price || '₹0')}</Text>

      <View style={[styles.cardFooter, { borderTopColor: Brand.blueBorder }]}>
        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: colors.textDim }]}>👁️ {item.views || 0} {t('myProperties.views')}</Text>
          <Text style={[styles.statText, { color: colors.textDim }]}>🤝 {item.matches || item.leads || 0} {t('myProperties.matches')}</Text>
        </View>
        
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => navigation.navigate('AddProperty', { editId: item.id || item.listingId, initialData: item })}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={Brand.teal} />
          <Text style={[styles.editBtnText, { color: Brand.teal }]}>{t('myProperties.edit')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequirementCard = (item: any) => (
    <View key={item.id || Math.random().toString()} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.reqBadge}>{t('myProperties.clientReq')}</Text>
        <View style={[
          styles.statusWrap, 
          { backgroundColor: 'rgba(16,185,129,0.15)' }
        ]}>
          <Text style={[styles.statusText, { color: '#10B981' }]}>● {item.status || 'Active'}</Text>
        </View>
      </View>

      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.description || item.lookingFor || 'Requirement'}</Text>
      <Text style={[styles.cardLocation, { color: colors.textSecondary }]}>📍 {item.locality || item.location || 'Unknown Location'}</Text>
      
      <Text style={[styles.cardPrice, { color: Brand.teal }]}>{t('myProperties.budget')} {formatPrice(item.budget || item.budgetMax || 'N/A')}</Text>

      <View style={[styles.cardFooter, { borderTopColor: Brand.blueBorder }]}>
        <Text style={[styles.statText, { color: Brand.blue }]}>🤝 {item.matchesFound || 0} {t('myProperties.matches')}</Text>
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => navigation.navigate('AddRequirement', { editId: item.id, initialData: item })}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={Brand.teal} />
          <Text style={[styles.editBtnText, { color: Brand.teal }]}>{t('myProperties.edit')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        
        {/* ── Header with Add Buttons in Top Right Corner ── */}
        <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
          <PropSeekrLogo size={28} theme={type} layout="horizontal" />
          
          <View style={styles.headerRightButtons}>
            <TouchableOpacity onPress={handleAddProperty} activeOpacity={0.8}>
              <LinearGradient
                colors={[Brand.blue, Brand.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtnGrad}
              >
                <Text style={styles.actionBtnText}>{t('myProperties.addPropertyBtn')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAddRequirement} activeOpacity={0.8} style={[styles.actionBtnOutline, { borderColor: Brand.teal }]}>
              <Text style={[styles.actionBtnOutlineText, { color: Brand.teal }]}>{t('myProperties.addRequirementBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Rental / Buy-Sell Toggle Row ── */}
        <View style={[styles.toggleRow, { backgroundColor: colors.navy }]}>
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
        </View>

        {/* ── Tab Bar (Properties / Requirements) ── */}
        <View style={[styles.tabsRow, { backgroundColor: colors.cardBg, borderBottomColor: Brand.blueBorder }]}>
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
                  {tab === 'Properties' ? t('myProperties.title') : (t('myProperties.clientReq'))}{' '}
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
          {activeTab === 'Properties' ? (
            properties.length > 0 ? properties.map(renderPropertyCard) : (
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>
                {loadingProp ? 'Loading listings...' : t('myProperties.noProperties')}
              </Text>
            )
          ) : (
            requirements.length > 0 ? requirements.map(renderRequirementCard) : (
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>
                {loadingReq ? 'Loading...' : t('myProperties.noRequirements')}
              </Text>
            )
          )}
          <View style={styles.footerSpacer} />
        </ScrollView>
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
    justifyContent: 'space-between',
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
  listContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagWrap: {
    backgroundColor: 'rgba(37,99,235,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reqBadge: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardLocation: {
    fontSize: 13,
    marginBottom: 10,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerSpacer: {
    height: 40,
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
});
