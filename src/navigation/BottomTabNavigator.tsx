import React, { useCallback, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppState, View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { FontWeight } from '../constants/theme';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { getNotifications } from '../api/notifications';
import { invalidateWalletRequests, refreshWallet } from '../services/walletSync';

// Tab Screens
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import MatchesScreen from '../screens/Matches/MatchesScreen';
import MyPropertiesScreen from '../screens/Properties/MyPropertiesScreen';
import CreditsScreen from '../screens/Credits/CreditsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

export type BottomTabParamList = {
  Dashboard: undefined;
  Matches: { property?: any; selectedProperty?: any; matchId?: number } | undefined;
  MyProperties: undefined;
  Credits: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

interface TabIconProps {
  iconName?: string;
  iconNameFocused?: string;
  label: string;
  focused: boolean;
  badge?: number;
  balance?: number | null;
}

function TabIcon({ iconName, iconNameFocused, label, focused, badge, balance }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        {balance !== undefined ? (
          <Text style={{ fontSize: 16, fontWeight: '800', color: focused ? Colors.brandTeal : Colors.textMuted }}>
            {balance === null ? '—' : balance}
          </Text>
        ) : (
          <MaterialCommunityIcons 
            name={focused ? iconNameFocused! : iconName!} 
            size={24} 
            color={focused ? Colors.brandTeal : Colors.textMuted} 
          />
        )}
        {!!badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </View>
  );
}

export default function BottomTabNavigator() {
  const unseenMatches = useAppStore(s => s.unseenMatches);
  const unreadNotifications = useAppStore(s => s.unreadNotifications);
  const setUnreadNotifications = useAppStore(s => s.setUnreadNotifications);
  const creditsBalance = useAppStore(s => s.creditsBalance);
  const walletBrokerId = useAppStore(s => s.walletBrokerId);
  const brokerId = useAuthStore(s => s.user?.brokerId);
  const insets = useSafeAreaInsets();

  const refreshUnreadNotifications = useCallback(async () => {
    if (!brokerId) return;
    try {
      const response = await getNotifications(brokerId, 1, 1, 'ALL');
      setUnreadNotifications(response.unreadCount);
    } catch (error) {
      console.warn('Could not refresh notification badge.', error);
    }
  }, [brokerId, setUnreadNotifications]);

  useEffect(() => {
    refreshUnreadNotifications();
    const timer = setInterval(refreshUnreadNotifications, 30000);
    return () => clearInterval(timer);
  }, [refreshUnreadNotifications]);

  useEffect(() => {
    if (!brokerId) {
      invalidateWalletRequests();
      return;
    }

    refreshWallet(brokerId).catch(error => {
      console.warn('Could not refresh wallet balance.', error?.message);
    });

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refreshWallet(brokerId, { showLoading: false }).catch(error => {
          console.warn('Could not refresh wallet after app resume.', error?.message);
        });
      }
    });
    return () => subscription.remove();
  }, [brokerId]);

  const displayedBalance = brokerId && walletBrokerId === String(brokerId)
    ? creditsBalance
    : null;

  // Dynamically pad the bottom tab bar according to device OS system buttons (e.g. Samsung 3-button navbar or gestures)
  const bottomInset = Math.max(insets.bottom, 12);
  const tabBarHeight = 60 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: bottomInset,
          },
        ],
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="home-outline" iconNameFocused="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.setParams({ matchId: undefined, property: undefined }),
        })}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="handshake-outline" iconNameFocused="handshake" label="Matches" focused={focused} badge={unseenMatches} />
          ),
        }}
      />
      <Tab.Screen
        name="MyProperties"
        component={MyPropertiesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="office-building-outline" iconNameFocused="office-building" label="My Listings" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Credits"
        component={CreditsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Tokens" focused={focused} balance={displayedBalance} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="account-outline" iconNameFocused="account" label="Profile" focused={focused} badge={unreadNotifications} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70, // Prevents text from wrapping too early
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapActive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.brandTeal,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 99,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
