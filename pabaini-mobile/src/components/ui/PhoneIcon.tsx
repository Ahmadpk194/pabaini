import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PhoneIconProps {
  color?: string;
  size?: number;
}

export function PhoneIcon({ color = '#FFFFFF', size = 18 }: PhoneIconProps) {
  const width = size * 0.62;
  const borderRadius = size * 0.18;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <View
        style={[
          styles.phone,
          {
            width,
            height: size,
            borderColor: color,
            borderRadius,
          },
        ]}
      >
        <View
          style={[
            styles.speaker,
            {
              width: width * 0.45,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 3,
  },
  speaker: {
    height: 2,
    borderRadius: 1,
  },
});
