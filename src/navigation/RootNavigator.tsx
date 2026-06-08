import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { useAuthStore } from '../store/authStore';

enableScreens(false);

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import RegistrationScreen from '../screens/Auth/RegistrationScreen';

import { Colors } from '../constants/colors';

// Main App
import BottomTabNavigator from './BottomTabNavigator';

// Shared / Modal Screens
import AddPropertyScreen from '../screens/Properties/AddPropertyScreen';
import AddRequirementScreen from '../screens/Requirements/AddRequirementScreen';
import PropertyDetailScreen from '../screens/Properties/PropertyDetailScreen';
import RequirementDetailScreen from '../screens/Requirements/RequirementDetailScreen';
import MatchDetailScreen from '../screens/Matches/MatchDetailScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import BuyCreditsScreen from '../screens/Credits/BuyCreditsScreen';
import NotificationsScreen from '../screens/Profile/NotificationsScreen';

export type RootStackParamList = {
  // Auth
  Login: undefined;
  OTP: { phone: string };
  Registration: undefined;

  // Main
  MainTabs: undefined;

  // Modals
  AddProperty: { editId?: string };
  AddRequirement: { editId?: string };
  PropertyDetail: { propertyId: string };
  RequirementDetail: { requirementId: string };
  MatchDetail: { matchId: string };
  Search: { initialFilter?: string };
  BuyCredits: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surfaceDark } }}>
        {!isAuthenticated ? (
          // Auth flow
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </Stack.Group>
        ) : (
          // App flow
          <>
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
            <Stack.Screen
              name="AddProperty"
              component={AddPropertyScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="AddRequirement"
              component={AddRequirementScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
            <Stack.Screen name="RequirementDetail" component={RequirementDetailScreen} />
            <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ animation: 'fade_from_bottom' }}
            />
            <Stack.Screen
              name="BuyCredits"
              component={BuyCreditsScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
