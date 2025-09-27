import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useGallery } from '../contexts/GalleryContext';
import { shareService } from '../services/shareService';
import { GalleryItem } from '../types';

interface ShareTestComponentProps {
  visible: boolean;
  onClose: () => void;
}

export const ShareTestComponent: React.FC<ShareTestComponentProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { items } = useGallery();
  const [isSharing, setIsSharing] = useState(false);

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    testButtonDisabled: {
      opacity: 0.5,
    },
    testButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
    infoText: {
      color: theme.colors.text,
      fontSize: 12,
      opacity: 0.7,
      marginBottom: 16,
    },
    platformInfo: {
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    platformText: {
      color: theme.colors.text,
      fontSize: 14,
    },
  });

  if (!visible) return null;

  const testSingleImageShare = async () => {
    if (items.length === 0) {
      Alert.alert('No Images', 'Add some images to your gallery first!');
      return;
    }

    setIsSharing(true);
    try {
      const firstItem = items[0];
      const success = await shareService.shareImage(firstItem, {
        includeCaption: true,
        shareFormat: 'both',
      });
      
      Alert.alert(
        'Share Test Result',
        success ? 'Share successful!' : 'Share cancelled or failed'
      );
    } catch (error) {
      Alert.alert('Share Test Failed', `Error: ${error}`);
    } finally {
      setIsSharing(false);
    }
  };

  const testMultipleImageShare = async () => {
    if (items.length < 2) {
      Alert.alert('Need More Images', 'Add at least 2 images to test multiple sharing!');
      return;
    }

    setIsSharing(true);
    try {
      const multipleItems = items.slice(0, 3);
      const success = await shareService.shareMultipleImages(multipleItems);
      
      Alert.alert(
        'Multiple Share Test Result',
        success ? 'Multiple share successful!' : 'Multiple share cancelled or failed'
      );
    } catch (error) {
      Alert.alert('Multiple Share Test Failed', `Error: ${error}`);
    } finally {
      setIsSharing(false);
    }
  };

  const testImageWithoutCaption = async () => {
    if (items.length === 0) {
      Alert.alert('No Images', 'Add some images to your gallery first!');
      return;
    }

    setIsSharing(true);
    try {
      const itemWithoutCaption: GalleryItem = {
        ...items[0],
        caption: '', // Remove caption for this test
      };
      
      const success = await shareService.shareImage(itemWithoutCaption, {
        includeCaption: false,
        shareFormat: 'native',
      });
      
      Alert.alert(
        'No Caption Share Test Result',
        success ? 'Image-only share successful!' : 'Image-only share cancelled or failed'
      );
    } catch (error) {
      Alert.alert('No Caption Share Test Failed', `Error: ${error}`);
    } finally {
      setIsSharing(false);
    }
  };

  const getPlatformCapabilities = () => {
    switch (Platform.OS) {
      case 'ios':
        return 'iOS: Native share sheet with all installed apps';
      case 'android':
        return '🤖 Android: System share intent with app chooser';
      case 'web':
        return 'Web: Web Share API with clipboard fallback';
      default:
        return '❓ Unknown platform';
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sharing Test Center</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.platformInfo}>
            <Text style={styles.platformText}>
              Platform: {Platform.OS} {Platform.Version}
            </Text>
            <Text style={styles.platformText}>
              {getPlatformCapabilities()}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Single Image Tests</Text>
            <Text style={styles.infoText}>
              Test sharing individual images with different configurations
            </Text>
            
            <TouchableOpacity
              style={[styles.testButton, isSharing && styles.testButtonDisabled]}
              onPress={testSingleImageShare}
              disabled={isSharing}
            >
              <Ionicons name="share-outline" size={16} color="#FFFFFF" />
              <Text style={styles.testButtonText}>
                Share Image with Caption
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, isSharing && styles.testButtonDisabled]}
              onPress={testImageWithoutCaption}
              disabled={isSharing}
            >
              <Ionicons name="image-outline" size={16} color="#FFFFFF" />
              <Text style={styles.testButtonText}>
                Share Image Only (No Caption)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Multiple Images Tests</Text>
            <Text style={styles.infoText}>
              Test sharing multiple images as a collection
            </Text>
            
            <TouchableOpacity
              style={[styles.testButton, isSharing && styles.testButtonDisabled]}
              onPress={testMultipleImageShare}
              disabled={isSharing}
            >
              <Ionicons name="albums-outline" size={16} color="#FFFFFF" />
              <Text style={styles.testButtonText}>
                Share Multiple Images
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform-Specific Features</Text>
            <Text style={styles.infoText}>
              Each platform provides different sharing capabilities:
            </Text>
            
            {Platform.OS === 'ios' && (
              <Text style={styles.infoText}>
                • Native iOS share sheet{'\n'}
                • AirDrop support{'\n'}
                • Integration with Messages, Mail, Photos{'\n'}
                • Third-party app sharing
              </Text>
            )}
            
            {Platform.OS === 'android' && (
              <Text style={styles.infoText}>
                • Android share intent{'\n'}
                • Direct app sharing{'\n'}
                • Google services integration{'\n'}
                • Caption text in share content
              </Text>
            )}
            
            {Platform.OS === 'web' && (
              <Text style={styles.infoText}>
                • Web Share API (modern browsers){'\n'}
                • File sharing support{'\n'}
                • Clipboard fallback{'\n'}
                • Download option for older browsers
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <Text style={styles.infoText}>
              Gallery Items: {items.length}{'\n'}
              Sharing Service: Loaded{'\n'}
              Platform Support: {Platform.OS}
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};