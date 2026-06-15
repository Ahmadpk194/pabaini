import React from 'react';
import { ViewStyle } from 'react-native';
import Shimmer from './Shimmer';

interface SkeletonCircleProps {
  size: number;
  style?: ViewStyle;
}

export default function SkeletonCircle({ size, style }: SkeletonCircleProps) {
  return <Shimmer width={size} height={size} borderRadius={size / 2} style={style} />;
}
