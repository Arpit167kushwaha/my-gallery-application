import * as Speech from 'expo-speech';
import { Platform, Alert } from 'react-native';

// For speech-to-text need to use platform-specific solutions
// Mock implementation that shows the structure
// In real app use react-native-voice or expo-speech-recognition when available

class SpeechService {
  private isListening = false;
  private speechRecognitionAvailable = false;

  constructor() {
    this.checkSpeechRecognitionAvailability();
  }

  private async checkSpeechRecognitionAvailability() {

    // Mock implementation in reality check platform capabilities
    this.speechRecognitionAvailable = Platform.OS !== 'web';
  }

  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      if (!this.speechRecognitionAvailable) {
        // Fallback to manual input for web or unsupported platforms
        Alert.alert(
          'Voice Input',
          'Voice input is not available on this platform Use text input',
          [{ text: 'OK' }]
        );
        reject(new Error('Speech recognition not available'));
        return;
      }

      this.isListening = true;

      // Mock implementation in real app use proper speech recognition
      // For now simulate speech recognition with timeout
      setTimeout(() => {
        this.isListening = false;
        // Mock recognized text
        const mockResponses = [
          'A beautiful sunset at the beach',
          'My favorite coffee shop',
          'Weekend adventure with friends',
          'Delicious homemade dinner',
          'Morning walk in the park',
        ];
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        resolve(randomResponse);
      }, 2000);

      // Show listening indicator
      Alert.alert(
        'Listening...',
        'Speak now to add a caption',
        [
          {
            text: 'Stop',
            onPress: () => {
              this.stopListening();
              reject(new Error('User cancelled'));
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  stopListening(): void {
    this.isListening = false;
    // Stop speech recognition
  }

  async speak(text: string): Promise<void> {
    try {
      const options = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
      };
      
      Speech.speak(text, options);
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }

  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }

  async stop(): Promise<void> {
    Speech.stop();
  }


  isSpeechRecognitionAvailable(): boolean {
    return this.speechRecognitionAvailable;
  }

  // Show speech input options
  async showSpeechInputOptions(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.speechRecognitionAvailable) {
        Alert.alert(
          'Voice Input Not Available',
          'Voice input is not supported on this platform Use text input',
          [{ text: 'OK', onPress: () => resolve(null) }]
        );
        return;
      }

      Alert.alert(
        'Add Caption',
        'Choose how you would like to add a caption',
        [
          {
            text: 'Voice Input',
            onPress: async () => {
              try {
                const result = await this.startListening();
                resolve(result);
              } catch (error) {
                resolve(null);
              }
            },
          },
          {
            text: 'Text Input',
            onPress: () => resolve(''), // Empty string indicates text input should be shown
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
  }
}

export const speechService = new SpeechService();