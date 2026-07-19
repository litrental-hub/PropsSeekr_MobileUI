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
  const scale = layout === 'horizontal' ? 1.5 : 2.0; // Reduced scale from 2.5 to 2.0 to make it smaller
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
