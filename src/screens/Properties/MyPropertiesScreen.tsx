import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { PropSeekrLogo } from '../../components/PropSeekrLogo';

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
  const [activeTab, setActiveTab] = useState<'Properties' | 'Requirements'>('Properties');

  const handleAddProperty = () => {
    navigation.navigate('AddProperty', {});
  };

  const handleAddRequirement = () => {
    navigation.navigate('AddRequirement', {});
  };

  const renderPropertyCard = (item: PropertyItem) => (
    <View key={item.id} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <View style={styles.cardHeader}>
        <View style={styles.tagWrap}>
          <Text style={styles.tagText}>{item.type}</Text>
        </View>
        <View style={[
          styles.statusWrap, 
          { backgroundColor: item.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: item.status === 'Active' ? '#10B981' : '#F59E0B' }
          ]}>
            ● {item.status}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.cardLocation, { color: colors.textSecondary }]}>📍 {item.location}</Text>
      
      <Text style={styles.cardPrice}>{item.price}</Text>

      <View style={[styles.cardFooter, { borderTopColor: Brand.blueBorder }]}>
        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: colors.textDim }]}>👁️ {item.views} views</Text>
          <Text style={[styles.statText, { color: colors.textDim }]}>🤝 {item.matches} matches</Text>
        </View>
        
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={Brand.teal} />
          <Text style={[styles.editBtnText, { color: Brand.teal }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequirementCard = (item: RequirementItem) => (
    <View key={item.id} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.reqBadge}>CLIENT REQUIREMENT</Text>
        <View style={[
          styles.statusWrap, 
          { backgroundColor: 'rgba(16,185,129,0.15)' }
        ]}>
          <Text style={[styles.statusText, { color: '#10B981' }]}>● {item.status}</Text>
        </View>
      </View>

      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.lookingFor}</Text>
      <Text style={[styles.cardLocation, { color: colors.textSecondary }]}>📍 {item.location}</Text>
      
      <Text style={[styles.cardPrice, { color: Brand.teal }]}>Budget: {item.budget}</Text>

      <View style={[styles.cardFooter, { borderTopColor: Brand.blueBorder }]}>
        <Text style={[styles.statText, { color: Brand.blue }]}>🤝 {item.matchesFound} potential matches found</Text>
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={Brand.teal} />
          <Text style={[styles.editBtnText, { color: Brand.teal }]}>Edit</Text>
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
                <Text style={styles.actionBtnText}>+ Property</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAddRequirement} activeOpacity={0.8} style={[styles.actionBtnOutline, { borderColor: Brand.teal }]}>
              <Text style={[styles.actionBtnOutlineText, { color: Brand.teal }]}>+ Requirement</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tab Bar (Properties / Requirements) ── */}
        <View style={[styles.tabsRow, { backgroundColor: colors.cardBg, borderBottomColor: Brand.blueBorder }]}>
          {(['Properties', 'Requirements'] as const).map(tab => {
            const active = activeTab === tab;
            const count = tab === 'Properties' ? MOCK_MY_PROPERTIES.length : MOCK_MY_REQUIREMENTS.length;
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
                  My {tab}{' '}
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
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {activeTab === 'Properties' ? (
            MOCK_MY_PROPERTIES.map(renderPropertyCard)
          ) : (
            MOCK_MY_REQUIREMENTS.map(renderRequirementCard)
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
});
