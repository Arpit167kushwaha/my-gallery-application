import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { mediaService } from '../services/mediaService';
import { speechService } from '../services/speechService';

export const useImagePicker = (addItem: (uri: string, caption: string) => Promise<void>) => {
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      setIsLoading(true);
      console.log('Starting image picker...');
      
      const imageUri = await mediaService.showImagePickerOptions();
      console.log('Image picked:', imageUri);
      
      if (imageUri) {
        console.log('Getting caption input...');
        // Get caption input
        const caption = await getCaptionInput();
        console.log('Caption received:', caption);
        
        if (caption !== null) {
          console.log('Adding item to gallery...');
          await addItem(imageUri, caption);
          console.log('Item added successfully');
        } else {
          console.log('Caption input cancelled');
        }
      } else {
        console.log('No image selected');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (Platform.OS === 'web') {
        alert('Failed to add image to gallery: ' + errorMessage);
      } else {
        Alert.alert('Error', 'Failed to add image to gallery');
      }
    } finally {
      setIsLoading(false);
      console.log('Image picker finished');
    }
  };

  const getCaptionInput = (): Promise<string | null> => {
    return new Promise((resolve) => {
      // On web simplify the process just ask for text input
      if (Platform.OS === 'web') {
        showTextInput(resolve);
        return;
      }

      // On mobile show full options
      Alert.alert(
        'Add Caption',
        'How would you like to add a caption?',
        [
          {
            text: 'Voice Input',
            onPress: async () => {
              if (speechService.isSpeechRecognitionAvailable()) {
                try {
                  const voiceCaption = await speechService.startListening();
                  resolve(voiceCaption);
                } catch (error) {
                  // Fallback to text input
                  showTextInput(resolve);
                }
              } else {
                showTextInput(resolve);
              }
            },
          },
          {
            text: 'Text Input',
            onPress: () => showTextInput(resolve),
          },
          {
            text: 'Skip',
            onPress: () => resolve(''),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  };

  const showTextInput = (resolve: (value: string | null) => void) => {
    // Alert prompt doesnt work on web use window prompt instead
    if (Platform.OS === 'web') {
      const caption = window.prompt('Enter a caption for your image:', '');
      resolve(caption);
    } else {
      Alert.prompt(
        'Add Caption',
        'Enter a caption for your image:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: 'OK',
            onPress: (text?: string) => resolve(text || ''),
          },
        ],
        'plain-text',
        '',
        'default'
      );
    }
  };

  return {
    pickImage,
    isLoading,
  };
};