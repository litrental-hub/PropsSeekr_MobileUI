import React from 'react';
import { View, Text } from 'react-native';

interface PropSeekrLogoProps {
  size?: number;
  theme?: 'dark' | 'light';
  layout?: 'vertical' | 'horizontal'; // vertical = Login/Reg, horizontal = Dashboard header
}

// Blue → Teal gradient — same palette used for Seekr text AND window panes
const SEEKR_COLORS = ['#2563EB', '#1E7FD8', '#1799C4', '#10B2B0', '#10B981'];

export function PropSeekrLogo({
  size = 88,
  theme = 'dark',
  layout = 'vertical',
}: PropSeekrLogoProps) {
  const isDark = theme === 'dark';
  const roofColor = isDark ? '#FFFFFF' : '#050D1F';
  const textColor = isDark ? '#FFFFFF' : '#050D1F';

  // ── All measurements strictly proportional to `size` ─────────
  const S = size;
  const strokeW = S * 0.08;          // roof arm thickness
  const roofW = S * 1.1;           // total width of the chevron
  const roofH = S * 0.40;          // chevron height (shallow/wide angle)
  const armLen = Math.sqrt((roofW / 2) ** 2 + roofH ** 2);
  const angleDeg = Math.atan(roofH / (roofW / 2)) * (180 / Math.PI);

  // Window (2×2 pane grid)
  const winW = S * 0.30;
  const winH = S * 0.26;
  const divider = S * 0.025;
  const paneW = (winW - divider) / 2;
  const paneH = (winH - divider) / 2;

  // Chimney — sits on right arm triangle, bit lower and more right
  const chimW     = strokeW * 1.6;
  const chimH     = S * 0.13;
  // 75% of roofW = further right on the right arm
  const chimLeft  = roofW * 0.75 - chimW / 2;
  // Proportional to roofH so it sits on the arm surface at that x position
  const chimTop   = roofH * 0.4;

  // Font size
  const fontSize = S * 0.34;

  // Total container height for icon area
  const iconH = chimH + roofH + winH + S * 0.04;

  // ── House icon (shared between layouts) ──────────────────────
  const HouseIcon = (
    <View style={{ width: roofW, height: iconH, position: 'relative', alignItems: 'center' }}>

      {/* Chimney */}
      <View style={{
        position: 'absolute',
        left: chimLeft,
        top: chimTop,
        width: chimW,
        height: chimH + strokeW * 0.8,
        backgroundColor: roofColor,
        borderRadius: chimW * 0.25,
        zIndex: 2,
      }} />

      {/* Left arm */}
      <View style={{
        position: 'absolute',
        width: armLen,
        height: strokeW,
        backgroundColor: roofColor,
        borderRadius: strokeW / 2,
        left: roofW / 4 - armLen / 2,
        top: chimH + roofH / 2 - strokeW / 2,
        transform: [{ rotate: `-${angleDeg}deg` }],
        zIndex: 1,
      }} />

      {/* Right arm */}
      <View style={{
        position: 'absolute',
        width: armLen,
        height: strokeW,
        backgroundColor: roofColor,
        borderRadius: strokeW / 2,
        left: (3 * roofW) / 4 - armLen / 2,
        top: chimH + roofH / 2 - strokeW / 2,
        transform: [{ rotate: `${angleDeg}deg` }],
        zIndex: 1,
      }} />

      {/* 2×2 window — centered, below apex */}
      <View style={{
        position: 'absolute',
        top: chimH + roofH - strokeW * 0.4,
        left: roofW / 2 - winW / 2,
        width: winW,
        height: winH,
      }}>
        {/* Top-left — blue */}
        <View style={{
          position: 'absolute', left: 0, top: 0,
          width: paneW, height: paneH, backgroundColor: SEEKR_COLORS[0], borderRadius: 2
        }} />
        {/* Top-right — cyan-teal */}
        <View style={{
          position: 'absolute', right: 0, top: 0,
          width: paneW, height: paneH, backgroundColor: SEEKR_COLORS[2], borderRadius: 2
        }} />
        {/* Bottom-left — mid blue */}
        <View style={{
          position: 'absolute', left: 0, bottom: 0,
          width: paneW, height: paneH, backgroundColor: SEEKR_COLORS[1], borderRadius: 2
        }} />
        {/* Bottom-right — teal */}
        <View style={{
          position: 'absolute', right: 0, bottom: 0,
          width: paneW, height: paneH, backgroundColor: SEEKR_COLORS[4], borderRadius: 2
        }} />
      </View>
    </View>
  );

  // ── Text (shared) ─────────────────────────────────────────────
  const LogoText = (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize, fontWeight: '800', color: textColor, letterSpacing: -0.5 }}>
        Prop
      </Text>
      {['S', 'e', 'e', 'k', 'r'].map((char, i) => (
        <Text
          key={i}
          style={{ fontSize, fontWeight: '800', color: SEEKR_COLORS[i], letterSpacing: -0.5 }}
        >
          {char}
        </Text>
      ))}
    </View>
  );

  // ── Layouts ───────────────────────────────────────────────────
  if (layout === 'horizontal') {
    // House icon left, text right — used in Dashboard header
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: S * 0.18 }}>
        {HouseIcon}
        {LogoText}
      </View>
    );
  }

  // Vertical — used on Login & Registration screens
  return (
    <View style={{ alignItems: 'center' }}>
      {HouseIcon}
      <View style={{ marginTop: S * 0.04 }}>
        {LogoText}
      </View>
    </View>
  );
}
