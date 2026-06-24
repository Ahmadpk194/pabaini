import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Shimmer({ width, height, borderRadius = 0, style }: ShimmerProps) {
  const { theme, mode } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1.0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const baseColor = mode === 'dark' ? '#2A2A2A' : '#EEEEEE';

  return (
    <Animated.View style={[styles.container, { width, height, borderRadius, backgroundColor: baseColor, opacity } as ViewStyle, style]} />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
