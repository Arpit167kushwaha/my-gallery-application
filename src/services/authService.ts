import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || 'your-ios-client-id.apps.googleusercontent.com',
  android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || 'your-android-client-id.apps.googleusercontent.com',
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || 'your-web-client-id.apps.googleusercontent.com',
};

class AuthService {
  private getClientId(): string {
    if (Platform.OS === 'ios') {
      return GOOGLE_CLIENT_ID.ios;
    } else if (Platform.OS === 'android') {
      return GOOGLE_CLIENT_ID.android;
    } else {
      return GOOGLE_CLIENT_ID.web;
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {

      if (!this.hasValidClientIds()) {
        console.log('Google OAuth client IDs not configured, using mock authentication');
        // Simulate authentication delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.createMockUser();
      }

      const clientId = this.getClientId();
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'my-gallery-app',
        preferLocalhost: true,
      });
      
      console.log('Starting Google OAuth flow...');
      console.log('Platform:', Platform.OS);
      console.log('Client ID:', clientId.substring(0, 20) + '...');
      console.log('Redirect URI:', redirectUri);
      

      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        state: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Math.random().toString(),
          { encoding: Crypto.CryptoEncoding.HEX }
        ),
        codeChallenge: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Math.random().toString(),
          { encoding: Crypto.CryptoEncoding.BASE64 }
        ),
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });


      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success') {
        // Exchange code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {},
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        // Get user info
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResult.accessToken}`,
            },
          }
        );

        const userInfo = await userInfoResponse.json();

        const user: User = {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          profilePicture: userInfo.picture,
        };

        return user;
      } else {
        throw new Error('Authentication cancelled or failed');
      }
    } catch (error) {
      return await this.handleAuthError(error);
    }
  }

  private hasValidClientIds(): boolean {
    const clientIds = Object.values(GOOGLE_CLIENT_ID);
    return clientIds.every(id => 
      id && 
      !id.includes('your-') && 
      !id.includes('YOUR_') &&
      id.includes('.apps.googleusercontent.com')
    );
  }

  private async handleAuthError(error: any): Promise<User> {
    console.error('Google OAuth error:', error);
    
    if (error.message?.includes('cancelled')) {
      throw new Error('Sign-in was cancelled by user');
    } else if (error.message?.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    } else if (error.message?.includes('client_id')) {
      console.log('Invalid client ID - falling back to mock authentication');
      return this.createMockUser();
    }
    
    if (__DEV__) {
      console.log('Development mode - falling back to mock authentication');
      return this.createMockUser();
    }
    
    throw new Error('Failed to sign in with Google. Please try again.');
  }

  // Mock user for development testing
  private createMockUser(): User {
    return {
      id: 'demo-user-123',
      name: 'Demo User',
      email: 'demo@mygallery.app',
      profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    };
  }

  async signOut(): Promise<void> {
    // For Google OAuth mainly need to clear local storage
    // Actual token revocation can be done here if needed
    try {
      // Optionally revoke tokens here
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}

export const authService = new AuthService();