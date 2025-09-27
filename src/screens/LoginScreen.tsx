import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ThemedButton } from '../components/ThemedButton';

export const LoginScreen: React.FC = () => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { signIn, isLoading } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    icon: {
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      opacity: 0.7,
    },
    buttonContainer: {
      width: '100%',
      marginTop: 32,
    },
    themeToggle: {
      position: 'absolute',
      top: 60,
      right: 20,
      padding: 12,
    },
  });

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        'Unable to sign in with Google Please try again',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.themeToggle}>
        <ThemedButton
          title={isDarkMode ? 'Light' : 'Dark'}
          onPress={toggleTheme}
          variant="outline"
          size="small"
          style={{ padding: 8, minWidth: 40 }}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.icon}>
            <Ionicons
              name="images"
              size={80}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.title}>My Gallery</Text>
          <Text style={styles.subtitle}>
            Create your personal gallery with voice captions
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Sign in with Google"
            onPress={handleSignIn}
            loading={isLoading}
            size="large"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};