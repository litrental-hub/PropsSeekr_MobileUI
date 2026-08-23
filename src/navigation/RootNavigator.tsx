import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { useAuthStore } from '../store/authStore';

enableScreens(true);

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import RegistrationScreen from '../screens/Auth/RegistrationScreen';
import PinSetupScreen from '../screens/Auth/PinSetupScreen';
import LockScreen from '../screens/Auth/LockScreen';

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
import NotificationsScreen from '../screens/Profile/NotificationsScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';

export type RootStackParamList = {
  // Auth
  Login: undefined;
  OTP: { email: string };
  Registration: undefined;
  PinSetup: undefined;
  LockScreen: undefined;

  // Main
  MainTabs: undefined;

  // Modals
  AddProperty: { editId?: string; initialData?: any };
  AddRequirement: { editId?: string; initialData?: any };
  PropertyDetail: { propertyId: string };
  RequirementDetail: { requirementId: string };
  MatchDetail: { matchId: string };
  Search: { initialFilter?: string };
  Notifications: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isLocked = useAuthStore(s => s.isLocked);
  const appPin = useAuthStore(s => s.appPin);
  const setIsLocked = useAuthStore(s => s.setIsLocked);
  const isIgnoringAppLock = useAuthStore(s => s.isIgnoringAppLock);
  
  // Use a ref so the AppState listener always reads the LATEST value
  // without stale closure issues (the listener is created once, so
  // it would normally capture the initial value of isIgnoringAppLock forever)
  const isIgnoringAppLockRef = useRef(isIgnoringAppLock);
  useEffect(() => {
    isIgnoringAppLockRef.current = isIgnoringAppLock;
  }, [isIgnoringAppLock]);

  // Background security listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // If the app goes to background and we are authenticated and have a PIN, lock it!
      // Read from ref so we always get the latest value (avoids stale closure)
      if (nextAppState.match(/inactive|background/) && isAuthenticated && appPin && !isIgnoringAppLockRef.current) {
        setIsLocked(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, appPin, setIsLocked]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surfaceDark } }}>
        
        {!isAuthenticated ? (
          // Unauthenticated flow
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </Stack.Group>
        ) : isLocked ? (
          // Gatekeeper: App is locked
          <Stack.Screen name="LockScreen" component={LockScreen} options={{ animation: 'fade' }} />
        ) : !appPin ? (
          // User authenticated but hasn't set up PIN yet
          <Stack.Screen name="PinSetup" component={PinSetupScreen} options={{ animation: 'fade' }} />
        ) : (
          // Main App flow
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
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
