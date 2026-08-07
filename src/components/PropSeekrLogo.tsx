import React from 'react';
import { View, Image } from 'react-native';

interface PropSeekrLogoProps {
  size?: number;
  theme?: 'dark' | 'light';
  layout?: 'vertical' | 'horizontal'; // vertical = Login/Reg, horizontal = Dashboard header
}

export function PropSeekrLogo({
  size = 88,
  theme = 'dark',
  layout = 'vertical',
}: PropSeekrLogoProps) {
  const isDark = theme === 'dark';

  const logoSource = isDark
    ? require('../assets/clean-logo/propseekr-logo-dark-plain-transparent.png')
    : require('../assets/clean-logo/propseekr-logo-light-plain-transparent.png');

  // Scale the image based on the original base size to match previous dimensions
  const scale = layout === 'horizontal' ? 2.2 : 2.3; // Increased scale for prominent top-left logo visibility across all screens
  const imgSize = size * scale;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={logoSource}
        style={{
          width: imgSize,
          height: imgSize,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
}
