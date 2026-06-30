import React from 'react';
import Svg, { Rect, Line, Circle } from 'react-native-svg';

interface PabainiLogoProps {
  size?: number;
  color?: string; // Kept for compatibility
}

export function PabainiLogo({ size = 56, color }: PabainiLogoProps) {
  // Use the brand green as the background
  const bgFill = color || '#16A34A';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="0" y="0" width="100" height="100" rx="24" fill={bgFill} />
      {/* Connection lines */}
      <Line
        x1="50"
        y1="30"
        x2="27"
        y2="67"
        stroke="#DCFCE7"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <Line
        x1="50"
        y1="30"
        x2="73"
        y2="67"
        stroke="#DCFCE7"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <Line
        x1="27"
        y1="67"
        x2="73"
        y2="67"
        stroke="#DCFCE7"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Nodes */}
      <Circle cx="50" cy="30" r="11" fill="#FFFFFF" />
      <Circle cx="27" cy="67" r="11" fill="#FFFFFF" />
      <Circle cx="73" cy="67" r="11" fill="#FFFFFF" />
    </Svg>
  );
}

