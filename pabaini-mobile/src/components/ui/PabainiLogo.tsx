/**
 * PabainiLogo
 * Bold, clean, and mathematically centered "P" monogram.
 * Uses react-native-svg.
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PabainiLogoProps {
  size?: number;
  color?: string;
}

export function PabainiLogo({ size = 56, color = '#FFFFFF' }: PabainiLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      {/*
       * Bold stroke "P" — large and mathematically centered.
       * 
       * Bounding box calculations:
       *   Stem: x=17, y=8 → y=48 (thickness = 6)
       *   Bowl: top at y=8, bottom at y=30, radius=11
       *         starts at x=17, goes right to x=28, curves out to x=39, returns to x=17
       * 
       *   Outer left boundary  = 17 - (6 / 2) = 14
       *   Outer right boundary = 39 + (6 / 2) = 42
       *   Center = (14 + 42) / 2 = 28 (exact midpoint of 56px canvas ✓)
       */}

      {/* P stem */}
      <Path
        d="M 17,8 L 17,48"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* P bowl — clean D-arc */}
      <Path
        d="M 17,8 L 28,8 A 11,11 0 0,1 28,30 L 17,30"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
