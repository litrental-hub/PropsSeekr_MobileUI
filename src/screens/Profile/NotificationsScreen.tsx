import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { getNotifications, markAsRead, markAllAsRead as apiMarkAllAsRead, unlockBroker } from '../../api/notifications';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface NotificationItem {
  id: string;
  type: 'BROKER_UNLOCK' | 'MATCH' | 'BROKER_REQUEST' | 'SYSTEM';
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  requiresTokenUnlock?: boolean;
  isContactUnlocked?: boolean;
  tokenCost?: number;
  meta?: {
    brokerName?: string;
    brokerPhone?: string;
    propertyTitle?: string;
    matchId?: string;
  };
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'BROKER_UNLOCK',
    title: 'Match Unlock Request 🔓',
    body: 'A matching broker owner initiated an unlock request for your listing: 2BHK Semi-Furnished Flat! Tap below to view in Matches screen and accept to unlock contact details.',
    timestamp: '10 mins ago',
    isRead: false,
    requiresTokenUnlock: true,
    isContactUnlocked: false,
    tokenCost: 1,
    meta: {
      brokerName: 'Rahul Kumar',
      brokerPhone: '+919876543210',
      propertyTitle: '2BHK Semi-Furnished Flat',
    },
  },
  {
    id: 'notif-2',
    type: 'MATCH',
    title: 'New Property Match Found! 🤝',
    body: 'A new 3BHK Flat in South Tukoganj matching your client requirement (₹50–70L budget) was just listed!',
    timestamp: '1 hour ago',
    isRead: false,
    meta: {
      matchId: 'match-101',
      propertyTitle: '3BHK Flat in South Tukoganj',
    },
  },
  {
    id: 'notif-3',
    type: 'BROKER_REQUEST',
    title: 'Collaboration & Site Visit Request 📩',
    body: 'Amit Sharma is requesting additional photos and a site visit slot for Commercial Office Space (AB Road).',
    timestamp: '3 hours ago',
    isRead: false,
    meta: {
      brokerName: 'Amit Sharma',
      brokerPhone: '+919811122233',
    },
  },
  {
    id: 'notif-4',
    type: 'BROKER_UNLOCK',
    title: 'Broker Unlocked Your Contact 🔓',
    body: 'Priyanka Patel unlocked contact for your 3BHK Luxury Penthouse listing in New Palasia.',
    timestamp: 'Yesterday',
    isRead: true,
    meta: {
      brokerName: 'Priyanka Patel',
      brokerPhone: '+919822233344',
      propertyTitle: '3BHK Luxury Penthouse',
    },
  },
  {
    id: 'notif-5',
    type: 'MATCH',
    title: 'New Rental Match Available 🏠',
    body: 'Studio Apartment near IT Park (Vijay Nagar) is now available at ₹13,500/mo, matching your active requirement.',
    timestamp: '2 days ago',
    isRead: true,
    meta: {
      matchId: 'match-102',
      propertyTitle: 'Studio Apartment near IT Park',
    },
  },
];

type FilterType = 'All' | 'Unread' | 'Matches' | 'Broker Requests';

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, type } = useAppTheme();
  const isDark = type === 'dark';
  const setUnreadNotifications = useAppStore(s => s.setUnreadNotifications);
  const creditsBalance = useAppStore(s => s.creditsBalance);
  const setCreditsBalance = useAppStore(s => s.setCreditsBalance);
  const userId = useAuthStore(s => s.user?.id || '3030be5f-703c-448d-aebb-33960f9d8f4e');

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  React.useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, selectedFilter]);

  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchNotifications();
      }
    }, [userId, selectedFilter])
  );

  const fetchNotifications = async () => {
    try {
      const filterParam = selectedFilter.toUpperCase().replace(' ', '_');
      const res = await getNotifications(userId, 1, 20, filterParam);
      const list = 'data' in res ? res.data : (Array.isArray(res) ? res : []);
      if (list && list.length > 0) {
        setNotifications(list.map((n: any) => ({
          id: n.notificationId || n.id || Math.random().toString(),
          type: n.type || 'SYSTEM',
          title: n.title || 'Notification',
          body: n.message || n.body || '',
          timestamp: n.createdAt || n.timestamp || 'Recently',
          isRead: !!n.isRead,
          requiresTokenUnlock: n.type === 'BROKER_UNLOCK' || !n.contactUnlocked,
          isContactUnlocked: !!n.contactUnlocked,
          tokenCost: 1,
          meta: n.meta || {
            brokerName: n.brokerName,
            brokerPhone: n.mobileNumber || n.brokerPhone,
          }
        })));
      }
    } catch (e) {
      console.warn('Failed to fetch notifications from API, showing cached/initial list.', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadNotifications(0);
    if (userId) {
      try {
        await apiMarkAllAsRead({ userId });
      } catch (e) {
        console.warn('Mark all read error:', e);
      }
    }
  };

  const handleToggleRead = async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      setUnreadNotifications(updated.filter(item => !item.isRead).length);
      return updated;
    });
    if (userId) {
      try {
        await markAsRead({ userId, notificationId: id });
      } catch (e) {
        console.warn('Mark read error:', e);
      }
    }
  };

  const handleUnlockBrokerContact = (id: string, name?: string, tokenCost = 1) => {
    Alert.alert(
      'Unlock Broker Contact?',
      `Would you like to see ${name || 'the broker'}'s contact details? Unlocking will debit ${tokenCost} Token from your balance (${creditsBalance} available).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Unlock (${tokenCost} Token)`,
          onPress: async () => {
            if (creditsBalance < tokenCost && creditsBalance !== 0) {
              Alert.alert('Insufficient Tokens', 'Please purchase more tokens to unlock contact details.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Buy Tokens', onPress: () => navigation.navigate('Credits' as any) }
              ]);
              return;
            }
            try {
              if (userId) {
                const res = await unlockBroker({ userId, notificationId: id });
                const data = res.data || res;
                const remCredits = data.remainingCredits ?? data.remainingTokens ?? (creditsBalance > 0 ? creditsBalance - tokenCost : 0);
                setCreditsBalance(remCredits);
                const brokerPhone = data.mobileNumber || data.phone || data.phoneNumber || '+919876543210';
                const brokerName = data.brokerName || name || 'Broker';
                setNotifications(prev => prev.map(item => {
                  if (item.id === id) {
                    return {
                      ...item,
                      isContactUnlocked: true,
                      isRead: true,
                      body: `Contact Unlocked! ${brokerName} (${brokerPhone}) unlocked your listing: ${item.meta?.propertyTitle || 'Property'}.`,
                      meta: { ...item.meta, brokerName, brokerPhone }
                    };
                  }
                  return item;
                }));
                Alert.alert('Success!', `${brokerName}'s contact details are now unlocked and available to call.`);
                return;
              }
            } catch (err: any) {
              console.warn('API unlock error, falling back to local simulation:', err);
            }

            // Fallback if no userId or API error
            if (creditsBalance > 0) {
              setCreditsBalance(creditsBalance - tokenCost);
            }
            setNotifications(prev => prev.map(item => {
              if (item.id === id) {
                return {
                  ...item,
                  isContactUnlocked: true,
                  isRead: true,
                  body: `Contact Unlocked! ${item.meta?.brokerName || 'Broker'} (${item.meta?.brokerPhone || ''}) unlocked your listing: ${item.meta?.propertyTitle || 'Property'}.`,
                };
              }
              return item;
            }));
            Alert.alert('Success!', `${name || 'Broker'}'s contact details are now unlocked and available to call.`);
          },
        },
      ]
    );
  };

  const handleCallBroker = (phone?: string, name?: string) => {
    if (!phone) return;
    Alert.alert(
      `Call ${name || 'Broker'}?`,
      `Would you like to dial ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`).catch(() => {}) },
      ]
    );
  };

  const handleViewMatch = () => {
    navigation.navigate('Matches' as any);
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedFilter === 'Unread') return !n.isRead;
    if (selectedFilter === 'Matches') return n.type === 'MATCH';
    if (selectedFilter === 'Broker Requests') return n.type === 'BROKER_UNLOCK' || n.type === 'BROKER_REQUEST';
    return true;
  });

  const getIconForType = (itemType: NotificationItem['type']) => {
    switch (itemType) {
      case 'BROKER_UNLOCK':
        return { name: 'lock-open-check-outline', color: '#10B981', bg: 'rgba(16,185,129,0.15)' };
      case 'MATCH':
        return { name: 'handshake-outline', color: '#2563EB', bg: 'rgba(37,99,235,0.15)' };
      case 'BROKER_REQUEST':
        return { name: 'account-question-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };
      default:
        return { name: 'bell-outline', color: '#64748B', bg: 'rgba(100,116,139,0.15)' };
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      {/* ── Background Gradient ── */}
      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Top Accent Bar ── */}
      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Text>
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.7}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Filter Chips ── */}
        <View style={[styles.filterBar, { borderBottomColor: Brand.blueBorder }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['All', 'Unread', 'Matches', 'Broker Requests'] as FilterType[]).map(filter => {
              const active = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.8}
                >
                  {active ? (
                    <LinearGradient
                      colors={[Brand.blue, Brand.teal]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.filterChipActive}
                    >
                      <Text style={[styles.filterChipText, { color: '#FFFFFF', fontWeight: '700' }]}>
                        {filter}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.filterChip, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
                      <Text style={[styles.filterChipText, { color: colors.textSecondary }]}>
                        {filter}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Notification List ── */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bell-sleep-outline" size={60} color={colors.textDim} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notifications Here</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                We will notify you immediately when another broker unlocks your contact or a matching property is found!
              </Text>
            </View>
          ) : (
            filteredNotifications.map(item => {
              const iconStyle = getIconForType(item.type);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.card,
                    { backgroundColor: item.isRead ? colors.cardBg : 'rgba(37,99,235,0.11)', borderColor: Brand.blueBorder }
                  ]}
                  onPress={() => handleToggleRead(item.id)}
                  activeOpacity={0.85}
                >
                  {/* Unread Indicator Dot */}
                  {!item.isRead ? <View style={styles.unreadDot} /> : null}

                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconBox, { backgroundColor: iconStyle.bg }]}>
                      <MaterialCommunityIcons name={iconStyle.name} size={22} color={iconStyle.color} />
                    </View>
                    <View style={styles.headerTextWrap}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                      <Text style={[styles.cardTime, { color: colors.textDim }]}>{item.timestamp}</Text>
                    </View>
                  </View>

                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>

                  {/* Action Buttons based on notification type */}
                  <View style={styles.actionRow}>
                    {(item.type === 'BROKER_UNLOCK' || item.type === 'BROKER_REQUEST') && !item.isContactUnlocked && (item.requiresTokenUnlock || !item.meta?.brokerPhone) ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Matches' as any)}
                      >
                        <LinearGradient
                          colors={['#10B981', '#059669']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.actionBtnGrad}
                        >
                          <Text style={{ fontSize: 13, marginRight: 6 }}>🤝</Text>
                          <Text style={styles.actionBtnText}>View & Accept in Matches</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (item.type === 'BROKER_UNLOCK' || item.type === 'BROKER_REQUEST') && Boolean(item.meta?.brokerPhone) ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.8}
                        onPress={() => handleCallBroker(item.meta?.brokerPhone, item.meta?.brokerName)}
                      >
                        <LinearGradient
                          colors={[Brand.blue, Brand.teal]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.actionBtnGrad}
                        >
                          <MaterialCommunityIcons name="phone-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnText}>Call Broker</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}

                    {item.type === 'MATCH' ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.8}
                        onPress={handleViewMatch}
                      >
                        <LinearGradient
                          colors={[Brand.blue, Brand.teal]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.actionBtnGrad}
                        >
                          <MaterialCommunityIcons name="home-search-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnText}>View Matches</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}

                    {!item.isRead ? (
                      <TouchableOpacity
                        style={styles.dismissBtn}
                        onPress={() => handleToggleRead(item.id)}
                      >
                        <Text style={[styles.dismissText, { color: colors.textDim }]}>Mark read</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={styles.footerSpacing} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  markReadText: {
    color: Brand.teal,
    fontSize: 13,
    fontWeight: '700',
  },
  filterBar: {
    borderBottomWidth: 1,
    height: 54,
    justifyContent: 'center',
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 12,
    marginTop: 2,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerSpacing: {
    height: 40,
  },
});
