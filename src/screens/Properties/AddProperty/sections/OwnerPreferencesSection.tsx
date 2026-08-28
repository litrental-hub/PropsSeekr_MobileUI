import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAddPropertyForm } from '../AddPropertyContext';
import { MultiStateChip, ChipState } from '../../../../components/forms/MultiStateChip';
import { ChipSelector } from '../../../../components/forms/ChipSelector';
import { Stepper } from '../../../../components/forms/Stepper';
import { Toggle } from '../../../../components/forms/Toggle';
import { FormInput } from '../../../../components/forms/FormInput';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

const TENANT_OPTIONS = [
  'Family', 'Working Professionals', 'Bachelor Boys', 
  'Bachelor Girls', 'Students', 'Married Couples', 
  'Unmarried Couples', 'Senior Citizens', 'Anyone Welcome'
];

const BUSINESS_OPTIONS = [
  'IT / Tech companies', 'Finance / CA / Consulting', 'Healthcare / Clinic', 
  'Education / Coaching', 'Government office', 'Any business', 
  'Retail / shop', 'Food business', 'Manufacturing'
];

export function OwnerPreferencesSection({ themeColor }: { themeColor: string }) {
  const { state, updateState } = useAddPropertyForm();
  const { colors } = useAppTheme();

  // Helper to toggle multi-state chips for tenant preferences
  // Since we need to store 3 states, we will store them in the amenities object or a new object
  // For simplicity, let's store them in amenities as `{ 'Tenant_Family': 'allowed' | 'not_allowed' | 'ask' }`
  
  const handleTenantToggle = (opt: string) => {
    const key = `Tenant_${opt}`;
    const current = state.amenities[key] as ChipState || 'unselected';
    let next: ChipState = 'unselected';
    if (current === 'unselected') next = 'allowed';
    else if (current === 'allowed') next = 'not_allowed';
    else if (current === 'not_allowed') next = 'ask';
    
    updateState({
      amenities: { ...state.amenities, [key]: next }
    });
  };

  const getTenantState = (opt: string): ChipState => {
    return (state.amenities[`Tenant_${opt}`] as ChipState) || 'unselected';
  };

  const handleBusinessToggle = (opt: string) => {
    const key = `Business_${opt}`;
    const current = state.amenities[key] as ChipState || 'unselected';
    let next: ChipState = 'unselected';
    if (current === 'unselected') next = 'allowed';
    else if (current === 'allowed') next = 'not_allowed';
    else if (current === 'not_allowed') next = 'ask';
    
    updateState({
      amenities: { ...state.amenities, [key]: next }
    });
  };

  const getBusinessState = (opt: string): ChipState => {
    return (state.amenities[`Business_${opt}`] as ChipState) || 'unselected';
  };

  const isCommercial = 
    state.propertyType === 'Office Space' || 
    state.propertyType === 'Shop/Retail' || 
    state.propertyType === 'Warehouse' || 
    state.propertyType === 'Institution/Specialised';

  const pickMedia = async () => {
    const remaining = 12 - state.media.length;
    if (remaining <= 0) {
      Alert.alert('Media limit reached', 'You can add up to 12 photos and videos.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: remaining,
      quality: 0.8,
      videoQuality: 'high',
      assetRepresentationMode: 'compatible',
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Could not open gallery', result.errorMessage || 'Please try again.');
      return;
    }

    const selected = (result.assets || []).flatMap((asset, index) => {
      if (!asset.uri || !asset.type) return [];
      return [{
        uri: asset.uri,
        fileName: asset.fileName || `listing-media-${Date.now()}-${index}.${asset.type.startsWith('video/') ? 'mp4' : 'jpg'}`,
        mimeType: asset.type,
        fileSize: asset.fileSize,
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
      }];
    });
    updateState({ media: [...state.media, ...selected].slice(0, 12) });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🔐 Owner Preferences</Text>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>These preferences will be visible on your listing card.</Text>
      </View>

      {!isCommercial ? (
        <>
          <Text style={styles.label}>Preferred Tenant Types</Text>
          <View style={styles.chipGrid}>
            {TENANT_OPTIONS.map(opt => (
              <MultiStateChip
                key={opt}
                label={opt}
                state={getTenantState(opt)}
                onPress={() => handleTenantToggle(opt)}
              />
            ))}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Dietary Preferences</Text>
            <ChipSelector
              options={['Veg Only', 'Non-Veg Allowed', 'Egg ok, no meat', 'No Non-Veg Cooking', 'Strictly Veg', 'Flexible']}
              selected={state.dietaryPreference}
              onSelect={(v) => updateState({ dietaryPreference: v })}
              themeColor={themeColor}
              multiSelect={false}
              horizontal={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Pet Policy</Text>
            <ChipSelector
              options={['Pets Welcome', 'Small pets ok', 'No Pets', 'No Dogs', 'Negotiable']}
              selected={state.petPolicy}
              onSelect={(v) => updateState({ petPolicy: v })}
              themeColor={themeColor}
              multiSelect={false}
              horizontal={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Minimum Lease Period</Text>
            <ChipSelector
              options={['No minimum', '6 months', '11 months', '1 year', '2 years+']}
              selected={state.minLeasePeriod}
              onSelect={(v) => updateState({ minLeasePeriod: v })}
              themeColor={themeColor}
            />
          </View>

          <Stepper
            label="Max Occupants Allowed"
            value={state.maxOccupants}
            onValueChange={(v) => updateState({ maxOccupants: v })}
            min={1}
            max={20}
            containerStyle={styles.fieldGroup}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Work From Home Allowed</Text>
            <ChipSelector
              options={['Yes', 'No', 'Poochho']}
              selected={state.wfhAllowed}
              onSelect={(v) => updateState({ wfhAllowed: v })}
              themeColor={themeColor}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Preferred Tenant Business Type</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>What kind of business can use this space?</Text>
          <View style={styles.chipGrid}>
            {BUSINESS_OPTIONS.map(opt => (
              <MultiStateChip
                key={opt}
                label={opt}
                state={getBusinessState(opt)}
                onPress={() => handleBusinessToggle(opt)}
              />
            ))}
          </View>
        </>
      )}

      <Toggle
        label="Police Verification Required"
        value={state.policeVerification}
        onValueChange={(v) => updateState({ policeVerification: v })}
        containerStyle={styles.fieldGroup}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Photo Sharing Preference</Text>
        <ChipSelector
          options={['Share freely', 'On request', 'No photos']}
          selected={state.photoPreference}
          onSelect={(v) => updateState({ photoPreference: v, ...(v === 'No photos' ? { media: [] } : {}) })}
          themeColor={themeColor}
        />
      </View>

      {state.photoPreference !== 'No photos' && (
        <View style={styles.fieldGroup}>
          <View style={styles.mediaHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Property Photos & Videos</Text>
              <Text style={[styles.mediaHint, { color: colors.textSecondary }]}>Add up to 12 items. Videos can be up to 100 MB.</Text>
            </View>
            <Text style={[styles.mediaCount, { color: Brand.teal }]}>{state.media.length}/12</Text>
          </View>

          <View style={styles.mediaGrid}>
            {state.media.map((item, index) => (
              <View key={`${item.uri}-${index}`} style={[styles.mediaTile, { borderColor: Brand.blueBorder }]}>
                {item.mimeType.startsWith('image/') ? (
                  <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                ) : (
                  <View style={[styles.mediaPreview, styles.videoPreview]}>
                    <MaterialCommunityIcons name="play-circle" size={34} color="#FFFFFF" />
                    <Text style={styles.videoLabel}>Video</Text>
                  </View>
                )}
                <TouchableOpacity
                  accessibilityLabel="Remove media"
                  onPress={() => updateState({ media: state.media.filter((_, mediaIndex) => mediaIndex !== index) })}
                  style={styles.removeMedia}
                >
                  <MaterialCommunityIcons name="close" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {state.media.length < 12 && (
              <TouchableOpacity onPress={pickMedia} style={[styles.addMediaTile, { borderColor: Brand.teal }]}>
                <MaterialCommunityIcons name="image-plus" size={27} color={Brand.teal} />
                <Text style={[styles.addMediaText, { color: Brand.teal }]}>Add media</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <FormInput
        label="Additional Notes"
        placeholder="e.g. Only vegetarians preferred, strictly no drinking."
        value={state.additionalNotes}
        onChangeText={(v) => updateState({ additionalNotes: v })}
        multiline
        numberOfLines={3}
        maxLength={200}
        containerStyle={{ marginBottom: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  banner: {
    backgroundColor: '#FFFBEB', // soft yellow
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  bannerText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  mediaHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  mediaHint: { fontSize: 11, marginTop: -5, lineHeight: 16 },
  mediaCount: { fontSize: 12, fontWeight: '800' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  mediaTile: { width: 82, height: 82, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  mediaPreview: { width: '100%', height: '100%' },
  videoPreview: { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  videoLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginTop: 2 },
  removeMedia: { position: 'absolute', top: 5, right: 5, width: 23, height: 23, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.82)', alignItems: 'center', justifyContent: 'center' },
  addMediaTile: { width: 82, height: 82, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addMediaText: { fontSize: 10, fontWeight: '700', marginTop: 4 },
});
