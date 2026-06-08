import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '../../constants/theme';

export interface LiveMetric {
  id: string;
  icon: string;
  value: number;
  label: string;
  trend?: string;
  trendType?: 'up' | 'new' | 'warn';
  highlight?: boolean;
  gradientColors?: string[];
}

interface Props {
  metric: LiveMetric;
}

export default function LiveOverviewCard({ metric }: Props) {
  const animVal = useRef(new Animated.Value(0)).current;
  const scaleVal = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animVal, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleVal, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation for warn type
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (metric.trendType === 'warn') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [metric.trendType]);

  const trendBgColor =
    metric.trendType === 'up'
      ? '#DCFCE7'
      : metric.trendType === 'new'
      ? '#EFF6FF'
      : '#FEF3C7';

  const trendTextColor =
    metric.trendType === 'up'
      ? '#15803D'
      : metric.trendType === 'new'
      ? '#1D4ED8'
      : '#B45309';

  const CardContent = (
    <Animated.View
      style={[
        styles.card,
        metric.highlight && styles.cardHighlight,
        { opacity: animVal, transform: [{ scale: scaleVal }] },
      ]}>
      {/* Live dot indicator */}
      <View style={styles.liveDot} />

      <Text style={styles.icon}>{metric.icon}</Text>

      <Text style={[styles.value, metric.highlight && styles.valueHighlight]}>
        {metric.value}
      </Text>

      <Text style={styles.label}>{metric.label}</Text>

      {metric.trend && (
        <Animated.View
          style={[
            styles.trendBadge,
            { backgroundColor: trendBgColor },
            metric.trendType === 'warn' && { opacity: pulseAnim },
          ]}>
          <Text style={[styles.trendText, { color: trendTextColor }]}>
            {metric.trend}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );

  if (metric.gradientColors) {
    return (
      <LinearGradient
        colors={metric.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientWrapper}>
        {CardContent}
      </LinearGradient>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
    minHeight: 110,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHighlight: {
    borderColor: Colors.brandAmber,
    backgroundColor: '#FFFBF0',
  },
  gradientWrapper: {
    borderRadius: Radius.md,
    ...Shadow.teal,
  },
  liveDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: Colors.success,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  valueHighlight: {
    color: Colors.brandAmberDark,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    lineHeight: 14,
    marginTop: 2,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  trendText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
