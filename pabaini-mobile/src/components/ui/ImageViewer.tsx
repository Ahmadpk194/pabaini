import React, { useState, ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform } from 'react-native';
import ImageView from 'react-native-image-viewing';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerProps {
  uri: string | null | undefined;
  children: ReactNode;
  style?: any;
}

export function ImageViewer({ uri, children, style }: ImageViewerProps) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  if (!uri) {
    return <>{children}</>;
  }

  // Adjust top offset to position below standard notch / status bar heights
  const headerPaddingTop = insets.top > 0 ? insets.top + 10 : (Platform.OS === 'ios' ? 44 : 20);

  return (
    <>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setVisible(true)} style={style}>
        {children}
      </TouchableOpacity>
      <ImageView
        images={[{ uri }]}
        imageIndex={0}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        HeaderComponent={() => (
          <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVisible(false)}
              activeOpacity={0.7}
            >
              <X color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
