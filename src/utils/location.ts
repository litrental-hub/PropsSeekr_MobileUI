import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import { LocationState } from '../store/appStore';

/**
 * Request runtime location permissions on Android.
 * Returns true if granted.
 */
export async function requestLocationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const checkFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (checkFine) return true;

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const fineGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
    const coarseGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

    if (!fineGranted && !coarseGranted) {
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error requesting location permissions:', err);
    return false;
  }
}

/**
 * Reverse geocode latitude/longitude into a clean Locality and City name using OpenStreetMap Nominatim (Free, No API Key).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ locality: string; city: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'PropSeekr-MobileApp' },
      timeout: 6000,
    });
    
    const addr = res.data?.address || {};
    const city = addr.city || addr.town || addr.district || addr.state || 'Indore';
    const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || 'Central Area';

    return { locality, city };
  } catch (error) {
    console.warn('Reverse geocode failed, using fallback coordinates name:', error);
    return { locality: 'Current Location', city: 'India' };
  }
}

/**
 * Geocode text query (e.g. "Bandra Mumbai") into Lat/Lng coordinates.
 */
export async function forwardGeocode(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'PropSeekr-MobileApp' },
      timeout: 6000,
    });

    if (res.data && res.data.length > 0) {
      const item = res.data[0];
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        label: item.display_name,
      };
    }
    return null;
  } catch (error) {
    console.warn('Forward geocode error:', error);
    return null;
  }
}

/**
 * Fetches current GPS coordinates and updates app location state.
 */
export async function detectCurrentLocation(currentRadiusKm: number = 5): Promise<LocationState | null> {
  const hasPerm = await requestLocationPermissions();
  if (!hasPerm) {
    Alert.alert('Permission Required', 'Please grant location access in device settings to detect your nearby property matches.');
    return null;
  }

  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const { locality, city } = await reverseGeocode(lat, lng);
        resolve({
          lat,
          lng,
          locality,
          city,
          radiusKm: currentRadiusKm,
        });
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  });
}
