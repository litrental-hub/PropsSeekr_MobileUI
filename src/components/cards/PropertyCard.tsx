import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, PropertyStatusColors, LeadStatusColors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '../../constants/theme';
import { formatPrice, timeAgo, getFreshness, getInitials } from '../../utils/formatters';
import { PropertyStatus, LeadStatus } from '../../constants';

export interface Property {
  id: string;
  title: string;
  type: string;
  bhk: string;
  locality: string;
  price: number;
  area: number;
  furnishing: string;
  floor: string;
  facing: string;
  sectionType: 'Buying' | 'Selling' | 'Rentals';
  status: PropertyStatus;
  matchCount: number;
  leadStages: { status: LeadStatus; count: number }[];
  lastUpdated: string;
  lastConfirmed?: string;
  isRent?: boolean;
}

interface Props {
  property: Property;
  onEdit: (id: string) => void;
  onViewMatches: (id: string) => void;
}

export default function PropertyCard({ property, onEdit, onViewMatches }: Props) {
  const statusColor = PropertyStatusColors[property.status] ?? PropertyStatusColors['Active'];
  const freshness = getFreshness(property.lastUpdated);

  const freshnessConfig = {
    fresh: { color: Colors.success, label: 'Fresh', dot: Colors.success },
    stale: { color: Colors.brandAmber, label: 'Getting old', dot: Colors.brandAmber },
    old:   { color: Colors.error,   label: 'Needs refresh', dot: Colors.error },
  }[freshness];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🏠 ${property.title}\n📍 ${property.locality}\n💰 ${formatPrice(property.price)}\n🏢 ${property.bhk} | ${property.area} sqft | ${property.furnishing}\n\nShared via PropSeekr`,
        title: property.title,
      });
    } catch {}
  };

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {property.sectionType === 'Rentals' ? '🔑' : '🏠'} {property.type}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
          <View style={styles.localityRow}>
            <Text style={styles.localityIcon}>📍</Text>
            <Text style={styles.locality}>{property.locality}</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceWrap}>
          <Text style={styles.price}>{formatPrice(property.price)}</Text>
          {property.isRent && <Text style={styles.priceUnit}>/mo</Text>}
        </View>
      </View>

      {/* ── Property Details Chips ── */}
      <View style={styles.detailsRow}>
        {[
          { icon: '🛏', label: property.bhk },
          { icon: '📐', label: `${property.area} sqft` },
          { icon: '🪑', label: property.furnishing },
          { icon: '🏢', label: `${property.floor} Floor` },
          { icon: '🧭', label: property.facing },
        ].map((d, i) => (
          <View key={i} style={styles.detailChip}>
            <Text style={styles.detailIcon}>{d.icon}</Text>
            <Text style={styles.detailLabel}>{d.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Status + Match Count Row ── */}
      <View style={styles.statusRow}>
        {/* Property Status */}
        <View style={[styles.statusChip, { backgroundColor: statusColor.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {property.status}
          </Text>
        </View>

        {/* Match Count */}
        <TouchableOpacity
          style={styles.matchBadge}
          onPress={() => onViewMatches(property.id)}
          activeOpacity={0.75}>
          <Text style={styles.matchBadgeText}>🤝 {property.matchCount} Matches</Text>
          <Text style={styles.matchBadgeArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* ── Lead Stage Summary ── */}
      {property.leadStages.length > 0 && (
        <View style={styles.leadStagesRow}>
          {property.leadStages.map((ls, i) => {
            const c = LeadStatusColors[ls.status];
            if (!c) return null;
            return (
              <View key={i} style={[styles.leadMini, { backgroundColor: c.bg }]}>
                <View style={[styles.leadMiniDot, { backgroundColor: c.dot }]} />
                <Text style={[styles.leadMiniText, { color: c.text }]}>
                  {ls.count} {ls.status}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Freshness + Dates ── */}
      <View style={styles.metaRow}>
        <View style={styles.freshnessRow}>
          <View style={[styles.freshDot, { backgroundColor: freshnessConfig.dot }]} />
          <Text style={styles.metaText}>
            {freshnessConfig.label} · Updated {timeAgo(property.lastUpdated)}
          </Text>
        </View>
        {property.lastConfirmed && (
          <Text style={styles.metaText}>
            Last confirmed {timeAgo(property.lastConfirmed)}
          </Text>
        )}
      </View>

      {/* ── Footer Actions ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(property.id)}
          activeOpacity={0.8}>
          <Text style={styles.editBtnText}>✏️  Quick Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.matchBtn}
          onPress={() => onViewMatches(property.id)}
          activeOpacity={0.8}>
          <LinearGradient
            colors={[Colors.brandTealLight, Colors.brandTeal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.matchBtnGrad}>
            <Text style={styles.matchBtnText}>View Matches</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.8}>
          <Text style={styles.shareBtnText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flex: 1, marginRight: Spacing.md },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(13,145,120,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: 6,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.brandTealLight,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  localityRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  localityIcon: { fontSize: 11 },
  locality: { fontSize: FontSize.sm, color: Colors.textSecondary },

  priceWrap: { alignItems: 'flex-end' },
  price: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.brandTeal,
    letterSpacing: -0.5,
  },
  priceUnit: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  // Details
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  detailIcon: { fontSize: 11 },
  detailLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13,145,120,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  matchBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.brandTeal,
  },
  matchBadgeArrow: { fontSize: 11, color: Colors.brandTeal, fontWeight: FontWeight.bold },

  // Lead stages
  leadStagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  leadMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  leadMiniDot: { width: 5, height: 5, borderRadius: 3 },
  leadMiniText: { fontSize: 10, fontWeight: FontWeight.semibold },

  // Meta / freshness
  metaRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 3,
  },
  freshnessRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  freshDot: { width: 7, height: 7, borderRadius: 4 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  editBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  matchBtn: { flex: 1.4, borderRadius: Radius.md, overflow: 'hidden' },
  matchBtnGrad: { paddingVertical: 8, alignItems: 'center' },
  matchBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  shareBtn: {
    width: 36, height: 36,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  shareBtnText: { fontSize: 16 },
});
