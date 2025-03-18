import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import Feather from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../utils/supabase';

interface ImageUploadProps {
  url: string | null;
  size?: number;
  onUpload: (filePath: string) => void;
  bucket?: string;
  aspect?: [number, number];
  placeholder?: string;
  style?: any;
}

export default function ImageUpload({
  url,
  size = 150,
  onUpload,
  bucket = 'avatars',
  aspect = [1, 1],
  placeholder = '?',
  style,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const imageSize = { height: size, width: size };

  useEffect(() => {
    if (url) {
      if (url.startsWith('http')) {
        setImageUrl(url);
        return;
      }
      downloadImage(url);
    }
  }, [url]);

  async function downloadImage(path: string) {
    try {
      const fileName = path.split('/').pop();
      if (!fileName) throw new Error('Invalid file path');

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(fileName);

      if (error) {
        throw error;
      }

      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => {
        setImageUrl(fr.result as string);
      };
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error downloading image: ', error.message);
        setImageUrl(url);
      }
    }
  }

  async function uploadImage() {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect,
        quality: 1,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker.');
        return;
      }

      const image = result.assets[0];
      console.log('Got image', image);

      if (!image.uri) {
        throw new Error('No image uri!');
      }

      // Read the file as a Base64-encoded string using Expo's FileSystem
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Decode the Base64 string to an ArrayBuffer
      const arrayBuffer = decode(base64);

      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, arrayBuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      onUpload(data.path);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      } else {
        throw error;
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={[styles.container, style]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          accessibilityLabel="Uploaded image"
          style={[imageSize, styles.image]}
        />
      ) : (
        <View style={[imageSize, styles.noImage]}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}
      <TouchableOpacity 
        style={[styles.editButton, uploading && styles.uploadingButton]}
        onPress={uploadImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color={colors.text.inverse} size="small" />
        ) : (
          <Feather 
            name="camera" 
            size={20} 
            color={colors.text.inverse} 
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  image: {
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  noImage: {
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary.main,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.default,
  },
  uploadingButton: {
    opacity: 0.7,
  },
  placeholderText: {
    fontSize: 48,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
}); 