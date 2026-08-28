import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { PropSeekrLogo } from '../PropSeekrLogo';
import { Brand } from '../../theme/useAppTheme';
import { FontSize, FontWeight } from '../../constants/theme';

interface LogoLoaderProps {
  text?: string;
  size?: number;
  theme?: 'dark' | 'light';
  color?: string;
}

export const LogoLoader: React.FC<LogoLoaderProps> = ({
  text = 'Fetching matches…',
  size = 50,
  theme = 'dark',
  color = Brand.teal,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation for the logo in the center
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Continuous rotation for the outer ring
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse.start();
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, [pulseAnim, rotateAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ringSize = size * 1.8;

  return (
    <View style={styles.container}>
      <View style={[styles.loaderWrap, { width: ringSize, height: ringSize }]}>
        {/* Animated outer spinning ring */}
        <Animated.View
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: 'transparent',
              borderTopColor: color,
              borderRightColor: Brand.blue,
              borderWidth: 3,
              transform: [{ rotate: spin }],
            },
          ]}
        />
        
        {/* Secondary faint ring background */}
        <View
          style={[
            styles.ringBg,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
              borderWidth: 2,
            },
          ]}
        />

        {/* Center pulsing Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
          <PropSeekrLogo size={size * 0.45} theme={theme} layout="vertical" />
        </Animated.View>
      </View>

      {/* Animated feedback text */}
      {!!text && (
        <Animated.Text style={[styles.loadingText, { color: theme === 'dark' ? '#94A3B8' : '#64748B', opacity }]}>
          {text}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ringBg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },
});
