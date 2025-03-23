import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { colors } from '../theme/colors';
import Feather from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

type ViewMode = 'avatar' | 'display';

interface ImageSelectorProps {
  url: string | null;
  size?: number;
  onSelect: (uri: string) => void;
  viewMode?: ViewMode;
  placeholder?: string;
  style?: any;
  editable?: boolean;
}

export default function ImageSelector({
  url,
  size = 150,
  onSelect,
  viewMode = 'display',
  placeholder = '',
  style,
  editable = true,
}: ImageSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [imageSize, setImageSize] = useState({ height: size, width: size });

  useEffect(() => {
    // Adjust size based on view mode
    if (viewMode === 'display') {
      const screenWidth = Dimensions.get('window').width;
      setImageSize({
        width: screenWidth - 32, // Full width minus padding
        height: (screenWidth - 32) * 0.75, // 4:3 aspect ratio
      });
    } else {
      setImageSize({ height: size, width: size });
    }
  }, [viewMode, size]);

  async function requestCameraPermission() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is required to take photos. Please enable it in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Settings', 
            onPress: () => Linking.openSettings() 
          }
        ]
      );
      return false;
    }
    return true;
  }

  async function requestMediaLibraryPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library access is required to select photos. Please enable it in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Settings', 
            onPress: () => Linking.openSettings() 
          }
        ]
      );
      return false;
    }
    return true;
  }

  async function handleImageSelection(source: 'camera' | 'gallery') {
    if (!editable) return;
    
    try {
      setLoading(true);
      setShowOptions(false);

      // Request appropriate permission
      const hasPermission = source === 'camera' 
        ? await requestCameraPermission()
        : await requestMediaLibraryPermission();

      if (!hasPermission) {
        setLoading(false);
        return;
      }

      // Launch image picker with appropriate options
      const result = await (source === 'camera' 
        ? ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            allowsEditing: true,
            aspect: viewMode === 'avatar' ? [1, 1] as [number, number] : [4, 3] as [number, number],
            quality: 0.5,
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            allowsEditing: true,
            aspect: viewMode === 'avatar' ? [1, 1] as [number, number] : [4, 3] as [number, number],
            quality: 0.5,
          }));

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setLoading(false);
        return;
      }

      const image = result.assets[0];
      if (!image.uri) {
        setLoading(false);
        throw new Error('No image uri!');
      }

      onSelect(image.uri);
    } catch (error) {
      console.error('Error in handleImageSelection:', error);
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.container, 
          style, 
          !editable && styles.nonEditable,
          viewMode === 'avatar' && styles.avatarContainer
        ]}
        onPress={() => editable && setShowOptions(true)}
        disabled={!editable || loading}
      >
        {url ? (
          <Image
            source={{ uri: url }}
            accessibilityLabel="Selected image"
            style={[
              imageSize,
              styles.image,
              viewMode === 'avatar' && styles.avatarImage
            ]}
          />
        ) : (
          <View style={[
            imageSize,
            styles.noImage,
            viewMode === 'avatar' && styles.avatarImage
          ]}>
            {placeholder && <Text style={styles.placeholderText}>{placeholder}</Text>}
          </View>
        )}
        {editable && (
          <View style={[
            styles.editOverlay,
            loading && styles.uploadingOverlay
          ]}>
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} size="large" />
            ) : (
              <Feather 
                name="camera" 
                size={24} 
                color={colors.text.inverse} 
              />
            )}
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.option}
              onPress={() => handleImageSelection('camera')}
            >
              <Feather name="camera" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.option}
              onPress={() => handleImageSelection('gallery')}
            >
              <Feather name="image" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, styles.cancelOption]}
              onPress={() => setShowOptions(false)}
            >
              <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.grey200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  avatarContainer: {
    borderRadius: 9999,
  },
  nonEditable: {
    opacity: 0.8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarImage: {
    borderRadius: 9999,
  },
  noImage: {
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  placeholderText: {
    fontSize: 48,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: colors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.grey200,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  cancelText: {
    color: colors.text.secondary,
  },
}); 