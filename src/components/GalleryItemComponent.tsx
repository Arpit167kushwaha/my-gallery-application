import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useGallery } from '../contexts/GalleryContext';
import { GalleryItem } from '../types';
import { shareService } from '../services/shareService';
import { ResponsiveUtils } from '../utils/responsive';

interface GalleryItemComponentProps {
  item: GalleryItem;
  onPress?: (item: GalleryItem) => void;
}

export const GalleryItemComponent: React.FC<GalleryItemComponentProps> = ({
  item,
  onPress,
}) => {
  const { theme } = useTheme();
  const { removeItem, updateCaption } = useGallery();
  const [imageError, setImageError] = useState(false);
  const [dimensions, setDimensions] = useState(ResponsiveUtils.getScreenDimensions());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const responsiveConfig = ResponsiveUtils.getResponsiveConfig();
  const itemWidth = ResponsiveUtils.getItemWidth(responsiveConfig);

  const styles = StyleSheet.create({
    container: {
      width: itemWidth,
      marginBottom: ResponsiveUtils.getSpacing(16),
      backgroundColor: theme.colors.card,
      borderRadius: ResponsiveUtils.getBreakpoint() === 'desktop' ? 16 : 12,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    imageContainer: {
      width: '100%',
      height: itemWidth * responsiveConfig.itemAspectRatio,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.text,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
    },
    captionContainer: {
      padding: ResponsiveUtils.getSpacing(12),
    },
    caption: {
      color: theme.colors.text,
      fontSize: ResponsiveUtils.getFontSize(14),
      lineHeight: ResponsiveUtils.getFontSize(20),
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: ResponsiveUtils.getSpacing(12),
      paddingBottom: ResponsiveUtils.getSpacing(12),
    },
    timestamp: {
      color: theme.colors.text,
      fontSize: ResponsiveUtils.getFontSize(12),
      opacity: 0.6,
    },
    actionButtons: {
      flexDirection: 'row',
    },
    actionButton: {
      padding: ResponsiveUtils.getSpacing(8),
      marginLeft: ResponsiveUtils.getSpacing(4),
      borderRadius: 4,
      minWidth: ResponsiveUtils.getMinTouchTarget(),
      minHeight: ResponsiveUtils.getMinTouchTarget(),
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleShare = async () => {
    try {
      console.log('📤 Sharing gallery item:', item.id);
      const success = await shareService.shareImage(item, { 
        includeCaption: true, 
        shareFormat: 'both' 
      });
      
      if (success) {
        console.log('✅ Share successful');
      } else {
        console.log('❌ Share was cancelled or failed');
      }
    } catch (error) {
      console.error('❌ Error sharing image:', error);
      Alert.alert('Share Failed', 'Unable to share this image. Please try again.');
    }
  };

  const handleEdit = () => {
    if (Platform.OS === 'web') {
      // Use window.prompt for web
      const newCaption = window.prompt(
        'Update the caption for this image:',
        item.caption || ''
      );
      if (newCaption !== null) {
        performCaptionUpdate(newCaption);
      }
    } else {
      // Use Alert.prompt for mobile
      Alert.prompt(
        'Edit Caption',
        'Update the caption for this image:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Update',
            onPress: (text?: string) => performCaptionUpdate(text || ''),
          },
        ],
        'plain-text',
        item.caption
      );
    }
  };

  const performCaptionUpdate = async (text: string) => {
    try {
      await updateCaption(item.id, text);
    } catch (error) {
      console.error('Error updating caption:', error);
      if (Platform.OS === 'web') {
        alert('Failed to update caption. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to update caption');
      }
    }
  };

  const handleDelete = () => {
    console.log('🗑️ Delete button pressed for item:', item.id);
    console.log('🗑️ RemoveItem function available:', typeof removeItem);
    console.log('🗑️ Item details:', { id: item.id, caption: item.caption, timestamp: item.timestamp });
    
    // Cross-platform delete confirmation
    if (Platform.OS === 'web') {
      // Use window.confirm for web
      console.log('🗑️ Using web confirmation dialog');
      const confirmed = window.confirm('Are you sure you want to delete this image?');
      console.log('🗑️ User confirmed deletion:', confirmed);
      if (confirmed) {
        performDelete();
      } else {
        console.log('Delete cancelled by user');
      }
    } else {
      // Use Alert.alert for mobile
      console.log('🗑️ Using mobile Alert dialog');
      Alert.alert(
        'Delete Image',
        'Are you sure you want to delete this image?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled by user'),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const performDelete = async () => {
    try {
      console.log('🗑️ performDelete called for item:', item.id);
      console.log('🗑️ About to call removeItem function...');
      await removeItem(item.id);
      console.log('✅ removeItem completed successfully for item:', item.id);
    } catch (error) {
      console.error('❌ Error in performDelete:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
      if (Platform.OS === 'web') {
        alert('Failed to delete image. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to delete image');
      }
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="image-outline"
              size={48}
              color={theme.colors.text}
            />
            <Text style={styles.errorText}>Failed to load image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.uri }}
            style={styles.image}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        )}
      </View>

      {item.caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.caption} numberOfLines={3}>
            {item.caption}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionsContainer}>
        <Text style={styles.timestamp}>
          {formatTimestamp(item.timestamp)}
        </Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShare}
            activeOpacity={0.7}
            testID="share-button"
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleEdit}
            activeOpacity={0.7}
            testID="edit-button"
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => {
              console.log('🔥 BUTTON PHYSICALLY PRESSED!');
              handleDelete();
            }}
            activeOpacity={0.7}
            testID="delete-button"
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={theme.colors.notification}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};