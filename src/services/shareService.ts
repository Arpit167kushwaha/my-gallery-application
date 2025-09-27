import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { GalleryItem } from '../types';

export interface ShareOptions {
  includeCaption?: boolean;
  shareFormat?: 'native' | 'text' | 'both';
}

class ShareService {
  /**
   * Share an image with caption using native platform sharing
   * Works on iOS, Android, and Web with platform-specific optimizations
   */
  async shareImage(
    item: GalleryItem, 
    options: ShareOptions = { includeCaption: true, shareFormat: 'both' }
  ): Promise<boolean> {
    try {
      console.log('Sharing image:', item.id, 'Platform:', Platform.OS);


      const isAvailable = await this.isSharingAvailable();
      if (!isAvailable) {
        this.showSharingNotAvailableAlert();
        return false;
      }

      // Platform-specific sharing implementation
      switch (Platform.OS) {
        case 'ios':
        case 'android':
          return await this.shareMobile(item, options);
        case 'web':
          return await this.shareWeb(item, options);
        default:
          console.warn('Unsupported platform for sharing:', Platform.OS);
          return false;
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      this.showShareErrorAlert(error);
      return false;
    }
  }

  /**
   * Share multiple images (for future bulk sharing feature)
   */
  async shareMultipleImages(items: GalleryItem[]): Promise<boolean> {
    try {
      if (items.length === 0) return false;
      if (items.length === 1) return this.shareImage(items[0]);

      // For multiple images, create a summary
      const captions = items
        .filter(item => item.caption && item.caption.trim())
        .map((item, index) => `${index + 1}. ${item.caption}`)
        .join('\n');

      const shareText = `Gallery Collection (${items.length} images)${captions ? '\n\n' + captions : ''}`;

      if (Platform.OS === 'web') {
        return this.shareTextWeb(shareText);
      } else {
        // On mobile, share the first image with collection info
        const firstItem = { ...items[0], caption: shareText };
        return this.shareMobile(firstItem, { includeCaption: true });
      }
    } catch (error) {
      console.error('Error sharing multiple images:', error);
      this.showShareErrorAlert(error);
      return false;
    }
  }

  /**
   * Mobile sharing implementation (iOS/Android)
   */
  private async shareMobile(item: GalleryItem, options: ShareOptions): Promise<boolean> {
    try {
      const shareOptions: any = {
        mimeType: 'image/jpeg',
        UTI: 'public.jpeg', // iOS Universal Type Identifier
      };


      if (options.includeCaption && item.caption) {
        shareOptions.dialogTitle = `Share: ${item.caption}`;
        
        // For Android, we can include the caption in the share intent
        if (Platform.OS === 'android') {
          shareOptions.message = item.caption;
        }
      } else {
        shareOptions.dialogTitle = 'Share Image';
      }

      console.log('Sharing on mobile with options:', shareOptions);
      const result = await Sharing.shareAsync(item.uri, shareOptions);
      
      console.log('Mobile share result:', result);
      return true;
    } catch (error) {
      console.error('Mobile sharing failed:', error);
      throw error;
    }
  }

  /**
   * Web sharing implementation with Web Share API fallback
   */
  private async shareWeb(item: GalleryItem, options: ShareOptions): Promise<boolean> {
    try {
      // Try Web Share API first (modern browsers)
      if (typeof navigator !== 'undefined' && 'share' in navigator && this.isWebShareAPISupported()) {
        return await this.shareWithWebAPI(item, options);
      }
      
      // Fallback to traditional web sharing methods
      return await this.shareWebFallback(item, options);
    } catch (error) {
      console.error('Web sharing failed:', error);
      // Try fallback on Web API failure
      return await this.shareWebFallback(item, options);
    }
  }

  /**
   * Modern Web Share API implementation
   */
  private async shareWithWebAPI(item: GalleryItem, options: ShareOptions): Promise<boolean> {
    try {
      console.log('Using Web Share API');
      
      // Fetch the image as a blob for sharing
      const response = await fetch(item.uri);
      const blob = await response.blob();
      const file = new File([blob], `gallery-image-${item.id}.jpg`, { type: 'image/jpeg' });

      const shareData: any = {
        files: [file],
        title: 'Gallery Image',
      };

      if (options.includeCaption && item.caption) {
        shareData.text = item.caption;
        shareData.title = `Gallery: ${item.caption}`;
      }

      const nav = navigator as any;
      await nav.share(shareData);
      console.log('Web Share API successful');
      return true;
    } catch (error) {
      console.error('Web Share API failed:', error);
      throw error;
    }
  }

  /**
   * Fallback web sharing (copy to clipboard + download)
   */
  private async shareWebFallback(item: GalleryItem, options: ShareOptions): Promise<boolean> {
    try {
      console.log('Using web fallback sharing');


      let shareContent = 'Gallery Image';
      if (options.includeCaption && item.caption) {
        shareContent = `Gallery Image: ${item.caption}`;
      }

      // Try to copy to clipboard
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
        const nav = navigator as any;
        if (nav.clipboard && nav.clipboard.writeText) {
          await nav.clipboard.writeText(shareContent);
        }
      }


      const link = document.createElement('a');
      link.href = item.uri;
      link.download = `gallery-image-${item.id}.jpg`;
      
      // Show user-friendly sharing options
      this.showWebShareDialog(item, shareContent, link);
      
      return true;
    } catch (error) {
      console.error('Web fallback sharing failed:', error);
      throw error;
    }
  }

  /**
   * Share text content on web
   */
  private async shareTextWeb(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share({ text, title: 'Gallery Collection' });
        return true;
      }

      // Fallback: copy to clipboard
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
        const nav = navigator as any;
        if (nav.clipboard && nav.clipboard.writeText) {
          await nav.clipboard.writeText(text);
          Alert.alert('Copied!', 'Gallery information copied to clipboard');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Text sharing failed:', error);
      return false;
    }
  }

  /**
   * Check if sharing is available on the current platform
   */
  private async isSharingAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web always has some form of sharing capability
        return true;
      }
      
      return await Sharing.isAvailableAsync();
    } catch (error) {
      console.error('Error checking sharing availability:', error);
      return false;
    }
  }

  /**
   * Check if Web Share API is supported and can handle files
   */
  private isWebShareAPISupported(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    return !!(
      'share' in navigator && 
      'canShare' in navigator && 
      navigator.canShare && 
      navigator.canShare({ files: [new File([], 'test')] })
    );
  }

  /**
   * Show web sharing dialog with multiple options
   */
  private showWebShareDialog(item: GalleryItem, shareContent: string, downloadLink: HTMLAnchorElement): void {
    const actions = [
      {
        text: 'Download Image',
        onPress: () => {
          downloadLink.click();
        }
      },
      {
        text: 'Copy Caption',
        onPress: async () => {
          try {
            if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
              const nav = navigator as any;
              if (nav.clipboard && nav.clipboard.writeText) {
                await nav.clipboard.writeText(shareContent);
                Alert.alert('Copied!', 'Image caption copied to clipboard');
              }
            }
          } catch (error) {
            console.error('Failed to copy to clipboard:', error);
          }
        }
      },
      {
        text: 'Cancel',
        style: 'cancel' as const
      }
    ];

    Alert.alert(
      'Share Options',
      'Choose how you would like to share this image:',
      actions
    );
  }

  /**
   * Show error when sharing is not available
   */
  private showSharingNotAvailableAlert(): void {
    Alert.alert(
      'Sharing Not Available',
      'Sharing is not available on this device or browser. You can save the image locally instead.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Show generic share error
   */
  private showShareErrorAlert(error: any): void {
    const errorMessage = error?.message || 'An unknown error occurred';
    Alert.alert(
      'Share Failed',
      `Failed to share image: ${errorMessage}`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Get shareable URL for web (future enhancement)
   */
  async getShareableUrl(item: GalleryItem): Promise<string | null> {
    try {
      // This would be implemented when we have web hosting
      // For now, return the local URI
      return item.uri;
    } catch (error) {
      console.error('Error getting shareable URL:', error);
      return null;
    }
  }

  /**
   * Share via specific social media platforms (future enhancement)
   */
  async shareToSocialMedia(item: GalleryItem, platform: 'facebook' | 'twitter' | 'instagram'): Promise<boolean> {
    try {
      // This would be implemented with deep linking to social media apps
      console.log(`Sharing to ${platform} - feature coming soon!`);
      
      // For now, fall back to native sharing
      return this.shareImage(item);
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      return false;
    }
  }
}

export const shareService = new ShareService();