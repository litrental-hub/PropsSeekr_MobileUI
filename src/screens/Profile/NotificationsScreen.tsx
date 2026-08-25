import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
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
import { getNotifications, markAsRead, markAllAsRead as apiMarkAllAsRead } from '../../api/notifications';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface NotificationItem {
  id: string;
  type: 'BROKER_UNLOCK' | 'BROKER_ACCEPTED' | 'BROKER_REJECTED' | 'MATCH' | 'BROKER_REQUEST' | 'SYSTEM';
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  requiresTokenUnlock?: boolean;
  isContactUnlocked?: boolean;
  tokenCost?: number;
  actionStatus?: string | null;
  meta?: {
    brokerName?: string;
    brokerPhone?: string;
    propertyTitle?: string;
    matchId?: number;
    requestId?: number;
  };
}

type FilterType = 'All' | 'Unread' | 'Matches' | 'Broker Requests';

function formatNotificationTime(value: string): string {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return 'Recently';
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes} min${elapsedMinutes === 1 ? '' : 's'} ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`;
  return createdAt.toLocaleDateString();
}

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, type } = useAppTheme();
  const isDark = type === 'dark';
  const setUnreadNotifications = useAppStore(s => s.setUnreadNotifications);
  const unreadCount = useAppStore(s => s.unreadNotifications);
  const brokerId = useAuthStore(s => s.user?.brokerId);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    if (!brokerId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const filterParam = selectedFilter.toUpperCase().replace(' ', '_');
      const res = await getNotifications(brokerId, 1, 20, filterParam);
      setNotifications(res.data.map(n => ({
        id: n.notificationId,
        type: n.type,
        title: n.title,
        body: n.message,
        timestamp: formatNotificationTime(n.createdAt),
        isRead: n.isRead,
        requiresTokenUnlock: n.type === 'BROKER_UNLOCK',
        isContactUnlocked: false,
        tokenCost: 1,
        actionStatus: n.actionStatus,
        meta: n.meta,
      })));
      setUnreadNotifications(res.unreadCount);
    } catch (e) {
      console.warn('Failed to fetch notifications from API.', e);
      setNotifications([]);
      setLoadError('Could not load notifications. Pull back and try again.');
    } finally {
      setLoading(false);
    }
  }, [brokerId, selectedFilter, setUnreadNotifications]);

  useFocusEffect(
    React.useCallback(() => {
      if (brokerId) {
        fetchNotifications();
      }
    }, [brokerId, fetchNotifications])
  );

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadNotifications(0);
    if (brokerId) {
      try {
        await apiMarkAllAsRead(brokerId);
      } catch (e) {
        console.warn('Mark all read error:', e);
      }
    }
  };

  const handleToggleRead = async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      return updated;
    });
    if (brokerId) {
      try {
        const response = await markAsRead(brokerId, id);
        if (response.unreadCount !== undefined) {
          setUnreadNotifications(response.unreadCount);
        }
      } catch (e) {
        console.warn('Mark read error:', e);
      }
    }
  };

  const handleViewMatch = (item: NotificationItem) => {
    if (!item.isRead) {
      void handleToggleRead(item.id);
    }
    if (!item.meta?.matchId) return;
    navigation.navigate('MainTabs', {
      screen: 'Matches',
      params: { matchId: item.meta.matchId },
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedFilter === 'Unread') return !n.isRead;
    if (selectedFilter === 'Matches') return n.type === 'MATCH';
    if (selectedFilter === 'Broker Requests') return n.type === 'BROKER_UNLOCK' || n.type === 'BROKER_REQUEST' || n.type === 'BROKER_ACCEPTED' || n.type === 'BROKER_REJECTED';
    return true;
  });

  const getNotificationIcon = (type: string, colors: any) => {
    switch (type) {
      case 'CONTACT_UNLOCKED':
        return { name: 'lock-open-check-outline', color: colors.successText, bg: colors.successFaint };
      case 'BROKER_ACCEPTED':
        return { name: 'handshake-outline', color: colors.infoText, bg: colors.infoFaint };
      case 'CONNECTION_REQUESTED':
        return { name: 'account-question-outline', color: colors.warningText, bg: colors.warningFaint };
      case 'BROKER_CONFIRMED':
        return { name: 'check-decagram-outline', color: colors.successText, bg: colors.successFaint };
      case 'BROKER_REJECTED':
        return { name: 'close-circle-outline', color: colors.errorText, bg: colors.errorFaint };
      default:
        return { name: 'bell-outline', color: colors.textSecondary, bg: colors.borderFaint };
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
          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Brand.teal} />
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Loading notifications...</Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bell-sleep-outline" size={60} color={colors.textDim} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {loadError ? 'Notifications unavailable' : 'No Notifications Here'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {loadError || 'We will notify you when another broker requests an unlock or a matching property is found.'}
              </Text>
              {loadError ? (
                <TouchableOpacity style={styles.dismissBtn} onPress={fetchNotifications}>
                  <Text style={styles.markReadText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            filteredNotifications.map(item => {
              const iconConfig = getNotificationIcon(item.type, colors);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.card,
                    { backgroundColor: item.isRead ? colors.cardBg : 'rgba(37,99,235,0.11)', borderColor: Brand.blueBorder }
                  ]}
                  onPress={() => item.meta?.matchId ? handleViewMatch(item) : handleToggleRead(item.id)}
                  activeOpacity={0.85}
                >
                  {/* Unread Indicator Dot */}
                  {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.successText }]} />}

                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
                      <MaterialCommunityIcons name={iconConfig.name} size={22} color={iconConfig.color} />
                    </View>
                    <View style={styles.headerTextWrap}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                      <Text style={[styles.cardTime, { color: colors.textDim }]}>{item.timestamp}</Text>
                    </View>
                  </View>

                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>

                  {/* Action Buttons based on notification type */}
                  <View style={styles.actionRow}>
                    {(item.type === 'BROKER_UNLOCK' || item.type === 'BROKER_REQUEST') && item.actionStatus === 'pending' && item.meta?.matchId ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.85}
                        onPress={() => handleViewMatch(item)}
                      >
                        <LinearGradient
                          colors={[colors.successText, colors.successText]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.actionBtnGrad}
                        >
                          <Text style={{ fontSize: 13, marginRight: 6 }}>🤝</Text>
                          <Text style={styles.actionBtnText}>View & Accept in Matches</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}

                    {(item.type === 'BROKER_ACCEPTED' || item.type === 'BROKER_REJECTED') && item.meta?.matchId ? (
                      <TouchableOpacity style={styles.dismissBtn} onPress={() => handleViewMatch(item)}>
                        <Text style={[styles.dismissText, { color: item.type === 'BROKER_ACCEPTED' ? Brand.teal : colors.errorText }]}>View Match</Text>
                      </TouchableOpacity>
                    ) : null}

                    {item.type === 'MATCH' ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.8}
                        onPress={() => handleViewMatch(item)}
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
