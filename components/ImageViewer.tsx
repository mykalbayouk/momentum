import React from 'react';
import { View, Text, Image, StyleSheet, ImageStyle } from 'react-native';
import { colors } from '../theme/colors';

interface ImageViewerProps {
  url: string | null;
  size?: number;
  placeholder?: string;
  style?: ImageStyle;
}

export default function ImageViewer({
  url,
  size = 48,
  placeholder = '?',
  style,
}: ImageViewerProps) {
  const imageSize = { height: size, width: size };

  return (
    <View style={[styles.container, style]}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={[imageSize, styles.image, style]}
          accessibilityLabel="User avatar"
        />
      ) : (
        <View style={[imageSize, styles.noImage, style]}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 9999,
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 9999,
  },
  noImage: {
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
  },
  placeholderText: {
    fontSize: 20,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
}); 