import React from 'react';
import { ViewStyle } from 'react-native';
import Shimmer from './Shimmer';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonBox({ width, height, borderRadius = 4, style }: SkeletonBoxProps) {
  return <Shimmer width={width} height={height} borderRadius={borderRadius} style={style} />;
}
