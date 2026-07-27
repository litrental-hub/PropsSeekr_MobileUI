import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { searchProperties } from '../../api/property';

export default function SearchScreen() {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('Bandra'); // Simple mock query for locality
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await searchProperties({
        transactionType: 'RENTAL',
        listingType: 'SUPPLY',
        category: 'RESIDENTIAL',
        location: {
          city: 'Mumbai',
          locality: query,
          lat: 19.0596,
          lng: 72.8295,
          radiusKm: 10.0,
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      });
      setResults(res.results || []);
    } catch (error: any) {
      console.error('Search Error:', error);
      Alert.alert('Search Failed', error.response?.data?.message || 'Could not fetch properties.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Nearby</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Locality (e.g. Bandra)"
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity style={styles.btn} onPress={handleSearch} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Search</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title || 'Property'}</Text>
            <Text style={styles.cardSub}>Price: ₹{item.price}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No results found.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 16, borderBottomWidth: 1, borderColor: '#333' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 12, color: Colors.textPrimary },
  btn: { backgroundColor: '#10B981', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 16 },
  card: { backgroundColor: '#222', padding: 16, borderRadius: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  cardSub: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40 },
});
