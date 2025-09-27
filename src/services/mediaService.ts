import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export interface MediaPickerOptions {
  allowsEditing?: boolean;
  quality?: number;
  aspect?: [number, number];
}

class MediaService {
  async requestPermissions(): Promise<boolean> {
    try {
      // On web permissions are handled by the browser
      if (Platform.OS === 'web') {
        console.log('Web platform - skipping permission request');
        return true;
      }

      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permissions for saving accessing photos
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

      if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library permissions required to add images to gallery',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async pickImageFromLibrary(options: MediaPickerOptions = {}): Promise<string | null> {
    try {
      console.log('pickImageFromLibrary called with options:', options);
      
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Permission denied');
        return null;
      }

      console.log('Launching image library picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Image selected:', result.assets[0].uri);
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'Failed to pick image from library');
      return null;
    }
  }

  async takePhoto(options: MediaPickerOptions = {}): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  }

  async showImagePickerOptions(): Promise<string | null> {
    try {
      // For web directly use image library picker
      if (Platform.OS === 'web') {
        return await this.pickImageFromLibrary();
      }

      // For mobile show options
      return new Promise((resolve) => {
        Alert.alert(
          'Add Image',
          'Choose how you would like to add an image',
          [
            {
              text: 'Camera',
              onPress: async () => {
                const uri = await this.takePhoto();
                resolve(uri);
              },
            },
            {
              text: 'Photo Library',
              onPress: async () => {
                const uri = await this.pickImageFromLibrary();
                resolve(uri);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(null),
            },
          ],
          { cancelable: true, onDismiss: () => resolve(null) }
        );
      });
    } catch (error) {
      console.error('Error showing image picker options:', error);
      return null;
    }
  }

  async shareImage(uri: string, caption?: string): Promise<void> {
    try {
      // Legacy method - redirect to new shareService for consistency
      const { shareService } = await import('./shareService');
      const galleryItem = {
        id: `temp-${Date.now()}`,
        uri,
        caption: caption || '',
        timestamp: Date.now(),
        userId: '', // Temporary user ID for legacy sharing
      };
      
      await shareService.shareImage(galleryItem, { includeCaption: !!caption });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  }

  async saveToLibrary(uri: string): Promise<boolean> {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission denied', 'Cannot save image without permission');
        return false;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch (error) {
      console.error('Error saving to library:', error);
      Alert.alert('Error', 'Failed to save image to library');
      return false;
    }
  }

  // Get file size for optimization
  async getImageInfo(uri: string): Promise<{ width: number; height: number; size?: number } | null> {
    try {
      // Note simplified version In production app use expo-file-system for detailed info
      return null;
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }
}

export const mediaService = new MediaService();