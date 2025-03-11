import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';

const ProgressBar = ({ progress, width = '100%', className = '', color, enableAnimation = true, style }) => {
  // Animation value for the shimmer effect
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  // Additional shimmer animations for multiple effect
  const shimmerAnim2 = useRef(new Animated.Value(0)).current;
  const shimmerAnim3 = useRef(new Animated.Value(0)).current;
  const shimmerAnim4 = useRef(new Animated.Value(0)).current;
  const shimmerAnim5 = useRef(new Animated.Value(0)).current;
  const shimmerAnim6 = useRef(new Animated.Value(0)).current;
  const shimmerAnim7 = useRef(new Animated.Value(0)).current;
  const shimmerAnim8 = useRef(new Animated.Value(0)).current;
  const shimmerAnim9 = useRef(new Animated.Value(0)).current;
  const shimmerAnim10 = useRef(new Animated.Value(0)).current;
  const shimmerAnim11 = useRef(new Animated.Value(0)).current;
  const shimmerAnim12 = useRef(new Animated.Value(0)).current;
  const shimmerAnim13 = useRef(new Animated.Value(0)).current;
  const shimmerAnim14 = useRef(new Animated.Value(0)).current;
  
  // Animation for pulsating effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animation for background neon glow effect
  const neonGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (enableAnimation) {
      // Create infinite shimmer animations with staggered delays
      const createShimmerAnimation = (animValue, delay = 0) => {
        return Animated.loop(
          Animated.timing(animValue, {
            toValue: 1,
            duration: 6000,
            delay: delay,
            useNativeDriver: Platform.OS !== 'web',
          })
        ).start();
      };
      
      // Start all shimmer animations with staggered delays
      createShimmerAnimation(shimmerAnim, 0);
      createShimmerAnimation(shimmerAnim2, 400);
      createShimmerAnimation(shimmerAnim3, 800);
      createShimmerAnimation(shimmerAnim4, 1200);
      createShimmerAnimation(shimmerAnim5, 1600);
      createShimmerAnimation(shimmerAnim6, 2000);
      createShimmerAnimation(shimmerAnim7, 2400);
      createShimmerAnimation(shimmerAnim8, 2800);
      createShimmerAnimation(shimmerAnim9, 3200);
      createShimmerAnimation(shimmerAnim10, 3600);
      createShimmerAnimation(shimmerAnim11, 4000);
      createShimmerAnimation(shimmerAnim12, 4400);
      createShimmerAnimation(shimmerAnim13, 4800);
      createShimmerAnimation(shimmerAnim14, 5200);
      
      // Create subtle pulsating effect (for blue bar)
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          })
        ])
      ).start();

      // Neon glow animation for the blue bar
      Animated.loop(
        Animated.sequence([
          Animated.timing(neonGlowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(neonGlowAnim, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    } else {
      // Set default values when animations are disabled
      shimmerAnim.setValue(0);
      shimmerAnim2.setValue(0);
      shimmerAnim3.setValue(0);
      shimmerAnim4.setValue(0);
      shimmerAnim5.setValue(0);
      shimmerAnim6.setValue(0);
      shimmerAnim7.setValue(0);
      shimmerAnim8.setValue(0);
      shimmerAnim9.setValue(0);
      shimmerAnim10.setValue(0);
      shimmerAnim11.setValue(0);
      shimmerAnim12.setValue(0);
      shimmerAnim13.setValue(0);
      shimmerAnim14.setValue(0);
      pulseAnim.setValue(1);
      neonGlowAnim.setValue(1);
    }
  }, [enableAnimation]);

  // Use a modern gradient for the bar - allow color customization
  const barColor = color || '#007AFF'; // Base color with fallback to blue
  
  // Interpolate shimmer animations
  const createShimmerInterpolation = (animValue) => {
    return animValue.interpolate({
      inputRange: [0, 1],
      outputRange: Platform.OS === 'web' ? ['0%', '100%'] : [0, 200]  // Modified to stay within the red section
    });
  };
  
  // Create opacity interpolation to fade out shimmer effects as they reach the right side
  const createShimmerOpacityInterpolation = (animValue) => {
    return animValue.interpolate({
      inputRange: [0, 0.75, 0.95, 1],  // Adjusted to fade out closer to the end
      outputRange: [1, 1, 0, 0]        // Fully visible until 75%, then fade to invisible
    });
  };
  
  const shimmerTranslate = createShimmerInterpolation(shimmerAnim);
  const shimmerTranslate2 = createShimmerInterpolation(shimmerAnim2);
  const shimmerTranslate3 = createShimmerInterpolation(shimmerAnim3);
  const shimmerTranslate4 = createShimmerInterpolation(shimmerAnim4);
  const shimmerTranslate5 = createShimmerInterpolation(shimmerAnim5);
  const shimmerTranslate6 = createShimmerInterpolation(shimmerAnim6);
  const shimmerTranslate7 = createShimmerInterpolation(shimmerAnim7);
  const shimmerTranslate8 = createShimmerInterpolation(shimmerAnim8);
  const shimmerTranslate9 = createShimmerInterpolation(shimmerAnim9);
  const shimmerTranslate10 = createShimmerInterpolation(shimmerAnim10);
  const shimmerTranslate11 = createShimmerInterpolation(shimmerAnim11);
  const shimmerTranslate12 = createShimmerInterpolation(shimmerAnim12);
  const shimmerTranslate13 = createShimmerInterpolation(shimmerAnim13);
  const shimmerTranslate14 = createShimmerInterpolation(shimmerAnim14);
  
  // Create opacity values for each shimmer effect
  const shimmerOpacity = createShimmerOpacityInterpolation(shimmerAnim);
  const shimmerOpacity2 = createShimmerOpacityInterpolation(shimmerAnim2);
  const shimmerOpacity3 = createShimmerOpacityInterpolation(shimmerAnim3);
  const shimmerOpacity4 = createShimmerOpacityInterpolation(shimmerAnim4);
  const shimmerOpacity5 = createShimmerOpacityInterpolation(shimmerAnim5);
  const shimmerOpacity6 = createShimmerOpacityInterpolation(shimmerAnim6);
  const shimmerOpacity7 = createShimmerOpacityInterpolation(shimmerAnim7);
  const shimmerOpacity8 = createShimmerOpacityInterpolation(shimmerAnim8);
  const shimmerOpacity9 = createShimmerOpacityInterpolation(shimmerAnim9);
  const shimmerOpacity10 = createShimmerOpacityInterpolation(shimmerAnim10);
  const shimmerOpacity11 = createShimmerOpacityInterpolation(shimmerAnim11);
  const shimmerOpacity12 = createShimmerOpacityInterpolation(shimmerAnim12);
  const shimmerOpacity13 = createShimmerOpacityInterpolation(shimmerAnim13);
  const shimmerOpacity14 = createShimmerOpacityInterpolation(shimmerAnim14);

  // Interpolate neon glow animation to create a pulsating crimson effect
  const neonOpacity = neonGlowAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.2, 0.5, 0.8, 1],
  });

  // Fix the shadow pattern - each value must use the same pattern format
  const neonShadow = neonGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0px 0px 15px #ff0000', '0px 0px 45px #ff0000']  
  });

  // Calculate progress width safely
  const progressWidth = `${Math.min(Math.max(progress, 0), 100)}%`;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.baseBar}>
        <Animated.View 
          style={[
            styles.bar, 
            { 
              width: progressWidth,
              backgroundColor: barColor,
              opacity: enableAnimation ? neonOpacity : 1,
              ...(Platform.OS !== 'web' ? {
                transform: enableAnimation ? [{ scaleY: pulseAnim }] : []
              } : {}),
              ...(Platform.OS === 'web' ? {
                backgroundColor: color || '#007AFF',
                backgroundImage: color 
                  ? `linear-gradient(90deg, ${color} 0%, ${color} 100%)`
                  : 'linear-gradient(90deg, #007AFF 0%, #8E54E9 100%)'
              } : {})
            }
          ]} 
        >
          <View key="highlight-blue" style={styles.highlight}/>
          <View key="shadow-blue" style={styles.shadow}/>
        </Animated.View>
        <Animated.View 
          style={[
            styles.remainingBar,
            {
              width: `${100 - progress}%`,
              backgroundColor: 'rgba(255, 0, 0, 0.7)', 
              ...(Platform.OS === 'web' ? {
                boxShadow: enableAnimation ? neonShadow : '0px 0px 15px #ff0000',
                position: 'relative',  // Ensure proper positioning context
                overflow: 'hidden'     // Ensure shimmers are clipped within
              } : {
                overflow: 'hidden'     // Ensure shimmers are clipped within for native
              })
            }
          ]}
        >
          {enableAnimation ? (
            <>
              {/* Create multiple shimmer elements with staggered animations and varying widths */}
              {[
                { key: 'shimmer1', translate: shimmerTranslate, opacity: shimmerOpacity, webWidth: '0.7%', nativeWidth: '1.2%' },
                { key: 'shimmer2', translate: shimmerTranslate2, opacity: shimmerOpacity2, webWidth: '3.5%', nativeWidth: '4.8%' },
                { key: 'shimmer3', translate: shimmerTranslate3, opacity: shimmerOpacity3, webWidth: '0.5%', nativeWidth: '0.9%' },
                { key: 'shimmer4', translate: shimmerTranslate4, opacity: shimmerOpacity4, webWidth: '2.8%', nativeWidth: '4.2%' },
                { key: 'shimmer5', translate: shimmerTranslate5, opacity: shimmerOpacity5, webWidth: '1.0%', nativeWidth: '1.5%' },
                { key: 'shimmer6', translate: shimmerTranslate6, opacity: shimmerOpacity6, webWidth: '4.0%', nativeWidth: '5.5%' },
                { key: 'shimmer7', translate: shimmerTranslate7, opacity: shimmerOpacity7, webWidth: '0.6%', nativeWidth: '1.0%' },
                { key: 'shimmer8', translate: shimmerTranslate8, opacity: shimmerOpacity8, webWidth: '3.2%', nativeWidth: '4.5%' },
                { key: 'shimmer9', translate: shimmerTranslate9, opacity: shimmerOpacity9, webWidth: '0.8%', nativeWidth: '1.3%' },
                { key: 'shimmer10', translate: shimmerTranslate10, opacity: shimmerOpacity10, webWidth: '2.5%', nativeWidth: '3.8%' },
                { key: 'shimmer11', translate: shimmerTranslate11, opacity: shimmerOpacity11, webWidth: '1.2%', nativeWidth: '1.8%' },
                { key: 'shimmer12', translate: shimmerTranslate12, opacity: shimmerOpacity12, webWidth: '3.8%', nativeWidth: '5.0%' },
                { key: 'shimmer13', translate: shimmerTranslate13, opacity: shimmerOpacity13, webWidth: '0.9%', nativeWidth: '1.4%' },
                { key: 'shimmer14', translate: shimmerTranslate14, opacity: shimmerOpacity14, webWidth: '3.0%', nativeWidth: '4.0%' }
              ].map(shimmer => (
                <Animated.View 
                  key={shimmer.key}
                  style={[
                    styles.shimmer,
                    Platform.OS === 'web' ? {
                      left: shimmer.translate,
                      opacity: shimmer.opacity,
                      position: 'absolute',
                      top: 0,
                      height: '100%',
                      width: shimmer.webWidth,
                      backgroundColor: 'transparent',
                      backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 160, 160, 0.22), transparent)',
                      right: 'auto', // Ensure it stays in position
                      maxWidth: '100%', // Prevent overflowing the container
                    } : {
                      transform: [{ translateX: shimmer.translate }],
                      opacity: shimmer.opacity,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: shimmer.nativeWidth,
                      height: '100%',
                      backgroundColor: 'rgba(255, 180, 180, 0.2)',
                      maxWidth: '100%', // Prevent overflowing the container
                    }
                  ]}
                />
              ))}
            </>
          ) : null}
          <View key="highlight-red" style={styles.highlight}/>
          <View key="shadow-red" style={styles.shadow}/>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  baseBar: {
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }
    }),
  },
  bar: {
    height: '100%',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backgroundColor: '#007AFF',
        backgroundImage: 'linear-gradient(90deg, #007AFF 0%, #8E54E9 100%)'
      },
      default: {
        backgroundColor: '#007AFF'
      }
    }),
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: '30%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 0,
        height: '100%',
        width: '15%',
        backgroundColor: 'transparent',
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      }
    })
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  shadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  remainingBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#983d5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default ProgressBar;