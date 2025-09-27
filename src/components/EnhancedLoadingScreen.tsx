import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ResponsiveUtils } from '../utils/responsive';

interface EnhancedLoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const EnhancedLoadingScreen: React.FC<EnhancedLoadingScreenProps> = ({
  message = 'Loading...',
  showProgress = false,
  progress = 0,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for spinner
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, [fadeAnim, scaleAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: ResponsiveUtils.getSpacing(24),
    },
    content: {
      alignItems: 'center',
      maxWidth: 300,
    },
    spinner: {
      width: ResponsiveUtils.getSpacing(60),
      height: ResponsiveUtils.getSpacing(60),
      borderRadius: ResponsiveUtils.getSpacing(30),
      borderWidth: 4,
      borderColor: theme.colors.border,
      borderTopColor: theme.colors.primary,
      marginBottom: ResponsiveUtils.getSpacing(24),
    },
    message: {
      fontSize: ResponsiveUtils.getFontSize(16),
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: ResponsiveUtils.getSpacing(16),
    },
    progressContainer: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    progressText: {
      fontSize: ResponsiveUtils.getFontSize(14),
      color: theme.colors.text,
      opacity: 0.7,
      marginTop: ResponsiveUtils.getSpacing(8),
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.spinner,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />
        
        <Text style={styles.message}>{message}</Text>
        
        {showProgress && (
          <>
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress)}%
            </Text>
          </>
        )}
      </Animated.View>
    </View>
  );
};