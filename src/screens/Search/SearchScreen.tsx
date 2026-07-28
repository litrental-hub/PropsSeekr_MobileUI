import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';

import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { useAppStore } from '../../store/appStore';
import { detectCurrentLocation, forwardGeocode, reverseGeocode } from '../../utils/location';

const RADIUS_OPTIONS = [2, 5, 10, 15, 25];

export default function SearchScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();
  const { location, setLocation } = useAppStore();

  const [lat, setLat] = useState(location.lat || 22.7533);
  const [lng, setLng] = useState(location.lng || 75.8937);
  const [city, setCity] = useState(location.city || 'Indore');
  const [locality, setLocality] = useState(location.locality || 'Vijay Nagar');
  const [radiusKm, setRadiusKm] = useState(location.radiusKm || 5);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const webViewRef = useRef<any>(null);

  // Generate Leaflet OpenStreetMap HTML
  const getMapHtml = (initialLat: number, initialLng: number, initialRadius: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #050D1F; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-tile { filter: brightness(0.95); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    var marker = L.marker([${initialLat}, ${initialLng}]).addTo(map);
    var circle = L.circle([${initialLat}, ${initialLng}], {
      color: '#2563EB',
      fillColor: '#2563EB',
      fillOpacity: 0.22,
      weight: 2,
      radius: ${initialRadius * 1000}
    }).addTo(map);

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      map.panTo(e.latlng);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLICK', lat: e.latlng.lat, lng: e.latlng.lng }));
      }
    });

    function updatePosition(newLat, newLng, newRadiusKm) {
      var pos = [newLat, newLng];
      marker.setLatLng(pos);
      circle.setLatLng(pos);
      if (newRadiusKm) circle.setRadius(newRadiusKm * 1000);
      map.setView(pos, map.getZoom());
    }

    function updateRadius(newRadiusKm) {
      circle.setRadius(newRadiusKm * 1000);
    }
  </script>
</body>
</html>
`;

  // Handle map clicks from WebView
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CLICK') {
        setLat(data.lat);
        setLng(data.lng);
        setIsLoading(true);
        const res = await reverseGeocode(data.lat, data.lng);
        setLocality(res.locality);
        setCity(res.city);
        setIsLoading(false);
      }
    } catch (e) {
      console.warn('Error parsing message from map:', e);
    }
  };

  // Search locality text query
  const handleTextSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsLoading(true);
    const result = await forwardGeocode(searchQuery.trim());
    if (result) {
      setLat(result.lat);
      setLng(result.lng);
      const rev = await reverseGeocode(result.lat, result.lng);
      setLocality(rev.locality);
      setCity(rev.city);
      webViewRef.current?.injectJavaScript(`updatePosition(${result.lat}, ${result.lng}, ${radiusKm}); true;`);
    }
    setIsLoading(false);
  };

  // Detect GPS location button
  const handleDetectGPS = async () => {
    setIsLoading(true);
    const loc = await detectCurrentLocation(radiusKm);
    if (loc) {
      setLat(loc.lat);
      setLng(loc.lng);
      setCity(loc.city);
      setLocality(loc.locality);
      webViewRef.current?.injectJavaScript(`updatePosition(${loc.lat}, ${loc.lng}, ${loc.radiusKm}); true;`);
    }
    setIsLoading(false);
  };

  // Select Radius Option
  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    webViewRef.current?.injectJavaScript(`updateRadius(${newRadius}); true;`);
  };

  // Save & Confirm
  const handleConfirm = () => {
    setLocation({ lat, lng, city, locality, radiusKm });
    navigation.goBack();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      <LinearGradient colors={[Brand.blue, Brand.teal]} style={styles.accentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ── Top Header Bar ── */}
        <View style={[styles.header, { borderBottomColor: Brand.blueBorder, backgroundColor: colors.navy }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Select Location on Map</Text>
          <TouchableOpacity onPress={handleDetectGPS} style={styles.gpsBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="crosshairs-gps" size={22} color={Brand.teal} />
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <View style={[styles.searchBarWrap, { backgroundColor: colors.cardBgLight }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.cardBg, color: colors.textPrimary, borderColor: Brand.blueBorder }]}
            placeholder="Type locality or city (e.g. Bandra, Mumbai)..."
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleTextSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleTextSearch} style={styles.searchGoBtn} activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchGoText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Interactive Leaflet Map ── */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: getMapHtml(lat, lng, radiusKm) }}
            onMessage={handleMessage}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={[styles.mapLoader, { backgroundColor: colors.bgMid }]}>
                <ActivityIndicator size="large" color={Brand.teal} />
                <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Loading interactive map...</Text>
              </View>
            )}
          />

          {/* Floating GPS Target Trigger */}
          <TouchableOpacity style={styles.floatingGps} onPress={handleDetectGPS} activeOpacity={0.8}>
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#FFFFFF" />
            <Text style={styles.floatingGpsText}>Locate Me</Text>
          </TouchableOpacity>
        </View>

        {/* ── Bottom Configuration Overlay ── */}
        <View style={[styles.bottomPanel, { backgroundColor: colors.cardBg, borderTopColor: Brand.blueBorder }]}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.pinIcon}>📍</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.locationTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {locality}, {city}
              </Text>
              <Text style={[styles.locationCoords, { color: colors.textDim }]}>
                {lat.toFixed(4)}, {lng.toFixed(4)} · Tap map to change position
              </Text>
            </View>
            {isLoading && <ActivityIndicator color={Brand.teal} size="small" />}
          </View>

          {/* Radius Selector Pills */}
          <Text style={[styles.radiusLabel, { color: colors.textSecondary }]}>SEARCH RADIUS (KM)</Text>
          <View style={styles.radiusPillsRow}>
            {RADIUS_OPTIONS.map((opt) => {
              const active = radiusKm === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  activeOpacity={0.8}
                  onPress={() => handleRadiusChange(opt)}
                  style={[
                    styles.radiusPill,
                    { borderColor: active ? Brand.teal : colors.borderFaint },
                    active && { backgroundColor: Brand.teal },
                  ]}
                >
                  <Text style={[styles.radiusText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>
                    {opt} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.85} style={styles.confirmBtnWrap}>
            <LinearGradient
              colors={[Brand.blue, Brand.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmGrad}
            >
              <Text style={styles.confirmText}>Confirm Location & Radius →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  accentBar: { height: 3, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 8, marginLeft: -6 },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  gpsBtn: { padding: 8 },

  searchBarWrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  searchGoBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 10,
    height: 44,
  },
  searchGoText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  floatingGps: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    gap: 6,
  },
  floatingGpsText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  bottomPanel: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinIcon: { fontSize: 24 },
  locationTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  locationCoords: { fontSize: 12, marginTop: 2 },

  radiusLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10 },
  radiusPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  radiusPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusText: { fontSize: 13, fontWeight: '700' },

  confirmBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmGrad: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
