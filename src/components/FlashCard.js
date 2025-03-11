import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Animated, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Dimensions, 
  Platform, 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/config';

// Storage key for card layout preference (same as in settings.tsx)
const CARD_LAYOUT_PREF_KEY = 'cardLayoutPreference';
// Base key for tracking if user has seen the checkmark tutorial
const CHECKMARK_TUTORIAL_BASE_KEY = 'checkmarkTutorialSeen';

// Modern color palette with notebook additions
const Colors = {
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#EC4899', // Pink
  secondaryLight: '#F472B6',
  accent: '#3B82F6', // Blue
  surface: '#FFFFFF',
  surfaceAlt: '#F8F8FF',
  cardShadow: '#000000',
  text: '#111827',
  textSecondary: '#4B5563',
  hint: '#6B7280',
  success: '#10B981', // Green
  error: '#EF4444', // Red

  // Notebook card colors
  notebookBackground: '#ffffff', // Pure white paper
  notebookLine: '#6ba4d1', // Stronger, more vibrant blue for the lines
  notebookText: '#333333',
  notebookAccent: '#666666',
  notebookShadow: '#555555',
  notebookGradient: ['#ffffff', '#f9f9f9'], // Very subtle gradient for white notebook paper
  
  // Matching the study screen background
  pageBackground: '#f0e6e1', // Warm beige/cream background to match study screen
};

const FlashCard = forwardRef(({ front, back, onKnow, onSwipe, isKnown, showFront, sampleSentence }, ref) => {
  // Get window dimensions
  const windowDimensions = Dimensions.get('window');
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;

  // Initialize state
  const [isFlipped, setIsFlipped] = useState(false);
  const [tickActive, setTickActive] = useState(isKnown);
  const [lightingPosition, setLightingPosition] = useState('50% 50%');
  const [definitionFirst, setDefinitionFirst] = useState(false);
  // State to track if the tutorial has been shown
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Animation values - we'll set initial values after loading preferences
  const flipAnim = useRef(new Animated.Value(0)).current;
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hintOpacity = useRef(new Animated.Value(1)).current;

  // Animation for tutorial elements
  const tutorialOpacity = useRef(new Animated.Value(0)).current;
  const tutorialArrowAnim = useRef(new Animated.Value(0)).current;

  // Update dimensions on window resize (web only)
  const [windowDimensionsState, setWindowDimensionsState] = useState(windowDimensions);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setWindowDimensionsState(Dimensions.get('window'));
      };
      
      // Add event listener for window resize
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Calculate responsive font size based on screen width
  const getResponsiveFontSize = (size) => {
    const scaleFactor = Math.min(windowWidth / 375, 1.3); // 375 is baseline width (iPhone 6/7/8)
    return Math.round(size * scaleFactor);
  };

  // Pulse animation for hints
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load layout preferences and check if tutorial has been seen before
  useEffect(() => {
    const loadLayoutPreference = async () => {
      try {
        const savedPref = await AsyncStorage.getItem(CARD_LAYOUT_PREF_KEY);
        const definitionFirstPref = savedPref !== null ? JSON.parse(savedPref) : false;
        setDefinitionFirst(definitionFirstPref);
        
        // Initialize flip state based on preference (if definitionFirst is true, we should show back first)
        const shouldFlip = definitionFirstPref;
        setIsFlipped(shouldFlip);
        flipAnim.setValue(shouldFlip ? 180 : 0);

        // Get current user ID
        const userId = auth.currentUser?.uid || 'anonymous';
        
        // Check if user has seen tutorial before (using user-specific key)
        const tutorialKey = `${CHECKMARK_TUTORIAL_BASE_KEY}_${userId}`;
        const tutorialSeen = await AsyncStorage.getItem(tutorialKey);
        
        if (tutorialSeen === null) {
          setShowTutorial(true);
          // Animate tutorial elements after a short delay
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(tutorialOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.loop(
                Animated.sequence([
                  Animated.timing(tutorialArrowAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: Platform.OS !== 'web',
                  }),
                  Animated.timing(tutorialArrowAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: Platform.OS !== 'web',
                  }),
                ])
              ),
            ]).start();
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to load card layout preference:', error);
      }
    };
    
    loadLayoutPreference();
  }, []);

  // Function to dismiss tutorial and save that user has seen it
  const dismissTutorial = async () => {
    try {
      // Get current user ID
      const userId = auth.currentUser?.uid || 'anonymous';
      
      // Use user-specific key
      const tutorialKey = `${CHECKMARK_TUTORIAL_BASE_KEY}_${userId}`;
      await AsyncStorage.setItem(tutorialKey, 'true');
      
      // Fade out tutorial
      Animated.timing(tutorialOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setShowTutorial(false);
      });
    } catch (error) {
      console.error('Failed to save tutorial status:', error);
      setShowTutorial(false);
    }
  };

  // Reset card state when front text changes (new card)
  useEffect(() => {
    // Reset tickActive when card changes
    setTickActive(isKnown);

    // Reset flip state based on the user's preference
    const shouldFlip = definitionFirst;
    setIsFlipped(shouldFlip);
    flipAnim.setValue(shouldFlip ? 180 : 0);

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Initial animation when card appears - smoother with stacked cards
    // Start with the card invisible
    fadeAnim.setValue(0);

    // Set initial position and scale
    translateX.setValue(0);
    translateY.setValue(0);
    scale.setValue(0.95);

    // Fade in the card with a slight delay
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }, 50);
  }, [front, isKnown, definitionFirst]);

  // Handle manual flipping when card is tapped
  const handleFlip = () => {
    const newFlipValue = isFlipped ? 0 : 180;
    
    // Flip animation with improved physics
    Animated.spring(flipAnim, {
      toValue: newFlipValue,
      friction: 8,
      tension: 30,
      useNativeDriver: Platform.OS !== 'web', // Use native driver except on web
    }).start();
    
    // Update state after animation begins
    setIsFlipped(!isFlipped);
    
    // Fade in the hint after flipping
    Animated.sequence([
      Animated.delay(150),
      Animated.timing(hintOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  // Handle gesture for swiping with proper detection and automatic callbacks
  const handleGesture = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { 
      useNativeDriver: Platform.OS !== 'web',
      listener: ({ nativeEvent }) => {
        // Dynamic tilt effect based on card movement
        const { translationX, translationY } = nativeEvent;
        
        if (translationX) {
          // Determine direction for proper corner pivot
          const direction = translationX > 0 ? 'right' : 'left';
          
          // More rotation for more dramatic swivel during gestures
          const tiltXValue = (translationX / windowWidth) * 25; // Increased from 10 to 25
          tiltX.setValue(tiltXValue);
          
          // Reduced Y tilt as we want to focus on the swivel around Z axis
          tiltY.setValue(translationY / windowHeight * -2);
          
          // Update transform origin reference for web
          if (Platform.OS === 'web') {
            setTransformOrigin(direction === 'right' ? 'bottom right' : 'bottom left');
          }
        }
      }
    }
  );

  // Handle the end of a swipe gesture with improved detection - optimized for seamless experience
  const handleGestureStateChange = (event) => {
    if (event.nativeEvent.state === 4 || event.nativeEvent.state === 5) { // State.END or CANCELLED
      const { translationX, velocityX } = event.nativeEvent;
      
      // More sensitive threshold for left swipes (next card) to make progression more seamless
      // This creates an automated, effortless experience requiring minimal user effort
      const leftSwipeThreshold = Math.abs(velocityX) > 500 ? windowWidth * 0.05 : windowWidth * 0.15;
      const rightSwipeThreshold = Math.abs(velocityX) > 800 ? windowWidth * 0.1 : windowWidth * 0.25;
      
      // Determine direction and apply appropriate threshold
      const direction = translationX > 0 ? 'right' : 'left';
      const threshold = direction === 'left' ? leftSwipeThreshold : rightSwipeThreshold;
      
      if (Math.abs(translationX) > threshold) {
        // Faster animation for left swipes to make the experience feel more responsive
        const duration = direction === 'left' ? 300 : 350; // Increased duration for more visible swivel
        
        // Immediately fade out the card as it swipes away
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: duration * 0.6, // Fade out faster than the swipe animation
          useNativeDriver: Platform.OS !== 'web',
        }).start();
        
        // Enhanced Tinder-like pivot effect from the bottom corner with progressive rotation
        Animated.parallel([
          // Move card horizontally with easing for more natural movement
          Animated.timing(translateX, {
            toValue: direction === 'left' ? -windowWidth * 1.5 : windowWidth * 1.5, // Move further for more dramatic exit
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
          
          // More dramatic rotation around Z-axis for authentic Tinder effect
          Animated.timing(tiltX, {
            toValue: direction === 'left' ? -80 : 80, // Greatly increased rotation for more swivel
            duration: duration,
            easing: Easing.bezier(0.42, 0, 0.58, 1), // Added easing for more natural swivel
            useNativeDriver: Platform.OS !== 'web',
          }),
          
          // Vertical movement that complements the swivel
          Animated.timing(translateY, {
            toValue: -30, // Changed to negative to move up slightly as it rotates out
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
          
          // Progressive scaling to enhance 3D effect during rotation
          Animated.timing(scale, {
            toValue: 0.8,
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          // Keep the card invisible until the parent component updates
          // Don't reset position values that would make the card momentarily visible
          
          // Call the parent component's swipe handler with the direction
          if (onSwipe) {
            onSwipe(direction);
          }
          
          // Only reset position values AFTER a delay to ensure the next card is in view
          setTimeout(() => {
            translateX.setValue(0);
            translateY.setValue(0);
            tiltX.setValue(0);
            scale.setValue(1);
            fadeAnim.setValue(1); // Reset opacity for the next card
          }, 300); // Delay longer than the parent's state update
        });
      } else {
        // Return to center with spring animation
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: Platform.OS !== 'web',
          }),
          // Reset tilt back to neutral
          Animated.spring(tiltX, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(tiltY, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: Platform.OS !== 'web',
          }),
          // Reset scale
          Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      }
    }
  };

  // Handle marking card as known
  const handleKnow = () => {
    // If tutorial is showing, dismiss it
    if (showTutorial) {
      dismissTutorial();
    }
    
    // Toggle the tick state and trigger animation only when marking as known
    setTickActive(current => {
      const newState = !current;
      
      // Call onKnow callback
      onKnow(newState);
      
      // If marking as known (not unmarking), trigger automatic left swipe
      if (newState === true) {
        // Small delay to allow the tick animation to be visible first
        setTimeout(() => {
          // Trigger the same animation as a left swipe
          // Immediately fade out the card as it swipes away
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 350, // Increased from 180 for slower fade out
            useNativeDriver: Platform.OS !== 'web',
          }).start();
          
          // Enhanced Tinder-like pivot effect from the bottom corner
          Animated.parallel([
            // Move card horizontally with easing for natural movement
            Animated.timing(translateX, {
              toValue: -windowWidth * 1.5, // Move left (same as left swipe)
              duration: 650, // Increased from 300 for much slower animation
              useNativeDriver: Platform.OS !== 'web',
            }),
            
            // Rotation around Z-axis for authentic Tinder effect
            Animated.timing(tiltX, {
              toValue: -80, // Same rotation as left swipe
              duration: 650, // Increased from 300 for much slower animation
              easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Adjusted for slower, more controlled easing
              useNativeDriver: Platform.OS !== 'web',
            }),
            
            // Vertical movement that complements the swivel
            Animated.timing(translateY, {
              toValue: -30,
              duration: 650, // Increased from 300 for much slower animation
              useNativeDriver: Platform.OS !== 'web',
            }),
            
            // Progressive scaling
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 650, // Increased from 300 for much slower animation
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]).start(() => {
            // Call onSwipe with 'left' direction to trigger next card
            if (onSwipe) {
              onSwipe('left');
            }
            
            // Only reset position values AFTER a delay
            setTimeout(() => {
              translateX.setValue(0);
              translateY.setValue(0);
              tiltX.setValue(0);
              scale.setValue(1);
              fadeAnim.setValue(1); // Reset opacity for next card
            }, 300);
          });
        }, 250); // Delay to see the check mark animation first
      }
      
      return newState;
    });

    // Animation for tick - make it more noticeable
    Animated.sequence([
      Animated.timing(hintOpacity, {
        toValue: 1.8, // Increased from 1.5 for more visible effect
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(hintOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start();
  };

  // Handler refs
  const panResponderRef = useRef(null);
  
  // Simplified lighting effect for web - no animation tracking needed
  const renderLightingEffect = () => {
    if (Platform.OS !== 'web') return null;
    
    return (
      <div 
        key="lighting-effect"
        className="card-lighting-effect"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.2,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 75%)',
          pointerEvents: 'none',
        }} 
      />
    );
  };

  const renderEmbossEffect = () => {
    if (Platform.OS !== 'web') return null;
    
    return (
      <View 
        key="emboss-effect"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.35,
          shadowColor: 'rgba(255,255,255,0.8)',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.15,
          shadowRadius: 1,
        }}
      />
    );
  };

  // Function to render dynamic notebook lines for React Native
  const renderNotebookLines = () => {
    // Calculate how many lines we need based on card height
    const estimatedCardHeight = windowHeight * 0.7; // Same calculation used for cardHeight
    const lineSpacing = 35; // Increased from 25px to 35px for more space between lines
    const lineCount = Math.ceil(estimatedCardHeight / lineSpacing) + 5; // Add extra lines to ensure coverage
    const lines = [];
    
    for (let i = 0; i < lineCount; i++) {
      lines.push(
        <View 
          key={`line-${i}`} 
          style={[
            styles.notebookLine, 
            { top: (i + 1) * lineSpacing } // Position each line with increased spacing
          ]} 
        />
      );
    }
    
    return lines;
  };

  // State for transform origin (for web platform)
  const [transformOrigin, setTransformOrigin] = useState('bottom left');

  useImperativeHandle(ref, () => ({
    handleFlip,
    handleKnow,
  }));

  // Front to back rotation - fixed interpolation ranges
  const frontAnimatedStyle = {
    transform: [
      ...(Platform.OS === 'web' ? [
        { 
          rotateY: flipAnim.interpolate({
            inputRange: [0, 180],
            outputRange: ['0deg', '180deg'],
          }) 
        }
      ] : [
        { 
          rotateY: flipAnim.interpolate({
            inputRange: [0, 180],
            outputRange: ['0deg', '180deg'],
          }) 
        }
      ]),
    ],
    opacity: flipAnim.interpolate({
      inputRange: [90, 91],
      outputRange: [1, 0],
    }),
  };

  const backAnimatedStyle = {
    transform: [
      ...(Platform.OS === 'web' ? [
        { 
          rotateY: flipAnim.interpolate({
            inputRange: [0, 180],
            outputRange: ['180deg', '360deg'],
          }) 
        }
      ] : [
        { 
          rotateY: flipAnim.interpolate({
            inputRange: [0, 180],
            outputRange: ['180deg', '360deg'],
          }) 
        }
      ]),
    ],
    opacity: flipAnim.interpolate({
      inputRange: [89, 90],
      outputRange: [0, 1],
    }),
  };

  // Transformations for the card to create enhanced Tinder-like pivot from bottom corner
  const getCardTransform = () => {
    // Interactive rotation that responds to even small movements for a more fluid feel
    return [
      { perspective: 1500 }, // Increased for more dramatic effect
      
      // The order of these transforms is crucial for the Tinder effect
      { translateX },
      { translateY },
      
      // Add slight Y rotation for 3D effect
      { rotateY: tiltY.interpolate({
        inputRange: [-20, 0, 20],
        outputRange: ['10deg', '0deg', '-10deg']
      })},
      
      // Primary Z rotation for the swivel effect - more responsive to movement
      { rotateZ: tiltX.interpolate({
        inputRange: [-100, 0, 100],
        outputRange: ['-100deg', '0deg', '100deg'] // Greatly increased range for dramatic swivel
      })},
      
      // Scale applied last to maintain proper perspective during rotation
      { scale },
    ];
  };

  const cardAnimatedStyle = {
    // Single transform array with all transformations
    transform: getCardTransform(),
    opacity: fadeAnim,
  };

  const tickAnimatedStyle = {
    transform: [{ scale: hintOpacity }]
  };

  const hintAnimatedStyle = {
    transform: [{ scale: pulseAnim }],
    opacity: pulseAnim.interpolate({
      inputRange: [1, 1.1],
      outputRange: [0.7, 1]
    })
  };

  // Calculate card dimensions - taller rectangle that covers more vertical space
  const cardWidth = windowWidth * 0.9; // 90% of screen width
  const cardHeight = windowHeight * 0.7; // Increased from 0.5 to 0.7 for a taller card

  return (
    <PanGestureHandler
      onGestureEvent={handleGesture}
      onHandlerStateChange={handleGestureStateChange}
      ref={panResponderRef}>
      <Animated.View
        style={[
          styles.container,
          {
            width: cardWidth,
            height: cardHeight,
            opacity: fadeAnim,
            transform: getCardTransform(),
            ...(Platform.OS === 'web' ? {
              // Set transform origin to bottom-left or bottom-right based on swipe direction
              transformOrigin: transformOrigin,
              perspective: '1000px', // Add a better perspective for more natural 3D effect
              WebkitPerspective: '1000px', // Add webkit prefix for better browser support
              backgroundColor: Colors.pageBackground, // Use the warm beige color
            } : {})
          },
        ]}>
        <TouchableOpacity 
          activeOpacity={0.95}
          onPress={handleFlip}
          style={styles.card}>
          {/* Tick button for marking words as known */}
          <Animated.View style={[styles.tickButton, tickAnimatedStyle]}>
            <TouchableOpacity
              onPress={handleKnow}
              style={[
                styles.tickButtonContainer, 
                tickActive && styles.tickButtonActive
              ]}>
              <MaterialIcons
                name={tickActive ? "check-circle" : "check-circle-outline"}
                size={Math.min(32, windowWidth * 0.08)}
                color={tickActive ? Colors.success : Colors.hint}
                style={styles.tickIcon}
              />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Tutorial overlay */}
          {showTutorial && (
            <Animated.View 
              style={[
                styles.tutorialOverlay,
                { opacity: tutorialOpacity }
              ]}
            >
              <TouchableWithoutFeedback onPress={dismissTutorial}>
                <View style={styles.tutorialContainer}>
                  {/* Tutorial speech bubble first */}
                  <Animated.View 
                    style={[
                      styles.tutorialBubble,
                      {
                        transform: [
                          {
                            scale: tutorialArrowAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.03, 1]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <Text style={styles.tutorialText}>
                      You can tap the checkmark to mark words as known!
                    </Text>
                  </Animated.View>

                  {/* Animated hand pointing to checkmark */}
                  <Animated.View 
                    style={[
                      styles.handContainer,
                      {
                        transform: [
                          { 
                            translateX: tutorialArrowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 15]
                            })
                          },
                          {
                            translateY: tutorialArrowAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, -5, 0]
                            })
                          },
                          {
                            scale: tutorialArrowAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.1, 1]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <View style={styles.handPointer}>
                      <MaterialIcons name="touch-app" size={36} color={Colors.primary} style={styles.handIcon} />
                    </View>
                  </Animated.View>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          )}
          
          {/* Front of card */}
          <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
            <LinearGradient
              colors={Colors.notebookGradient}
              style={styles.gradientBackground}>
              {renderLightingEffect()}
              {renderEmbossEffect()}
              <View style={styles.cardBorder}/>
              {/* Render horizontal lines dynamically for React Native */}
              {Platform.OS !== 'web' && renderNotebookLines()}
              <View style={styles.contentContainer}>
                <View style={styles.mainContentContainer}>
                  <Text style={[styles.text, { fontSize: getResponsiveFontSize(28) }]}>{front}</Text>
                </View>
                <View style={styles.hintContainer}>
                  <Animated.Text style={[styles.hint, hintAnimatedStyle]}>Tap to flip</Animated.Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Back of card */}
          <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
            <LinearGradient
              colors={Colors.notebookGradient}
              style={styles.gradientBackground}>
              {renderLightingEffect()}
              {renderEmbossEffect()}
              <View style={styles.cardBorder}/>
              {/* Render horizontal lines dynamically for React Native */}
              {Platform.OS !== 'web' && renderNotebookLines()}
              <View style={styles.contentContainer}>
                <View style={styles.mainContentContainer}>
                  <Text style={[styles.text, { fontSize: getResponsiveFontSize(28) }]}>{back}</Text>
                  {sampleSentence ? (
                    <View key="sample-sentence" style={styles.sampleSentenceContainer}>
                      <Text style={styles.sampleSentenceLabel}>Sample:</Text>
                      <Text style={styles.sampleSentenceText}>{sampleSentence}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.hintContainer}>
                  <Animated.Text style={[styles.hint, hintAnimatedStyle]}>Tap to flip back</Animated.Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: Colors.pageBackground,
    justifyContent: 'center',
    perspective: 1000, // Need explicit value for Android
    marginVertical: 5,
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
    borderRadius: 0,
  },
  cardContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: Colors.pageBackground,
    borderWidth: 0,
    borderRadius: 0,
  },
  outerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.pageBackground,
    zIndex: -1, // Behind card
    borderWidth: 0,
    borderRadius: 0,
  },
  card: {
    flex: 1,
    borderRadius: 16, // Restore rounded corners for card only
    overflow: 'hidden',
    maxWidth: '100%',
    maxHeight: '100%',
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    backgroundColor: Colors.pageBackground,
    borderWidth: 0,
    ...(Platform.OS === 'web' ? {
      transformStyle: 'preserve-3d', // Ensure child elements preserve 3D
      boxShadow: 'none' // Remove box shadow on web
    } : {}),
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: Colors.notebookBackground,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  notebookLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderTopWidth: 0,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 34px, ${Colors.notebookLine} 34px, ${Colors.notebookLine} 35px)`,
      },
      default: {
        // For React Native, we use actual View elements instead (see renderNotebookLines)
      }
    }),
  },
  notebookLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.notebookLine,
  },
  notebookMargin: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 36,
    width: 1,
    backgroundColor: 'transparent', // Remove red margin line
    opacity: 0,
  },
  cardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none', // Don't intercept touches
    borderWidth: 0,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    backgroundColor: '#F5F5F5', // Softer white to match page background color
    ...(Platform.OS === 'web' ? {
      transformStyle: 'preserve-3d',
      webkitBackfaceVisibility: 'hidden' // Add webkit prefix for better browser support
    } : {}),
  },
  cardFront: {
    backfaceVisibility: 'hidden',
    backgroundColor: Colors.notebookBackground,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  cardBack: {
    backfaceVisibility: 'hidden',
    backgroundColor: Colors.notebookBackground,
    borderRadius: 16, 
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
    padding: 20,
    zIndex: 2, // Ensure content is above the background
  },
  mainContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  text: {
    color: Colors.notebookText,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    ...(Platform.OS === 'web' ? {
      textShadow: '0px 1px 2px rgba(74, 60, 43, 0.2), 0px 1px 0px rgba(255, 255, 255, 0.3)', // Enhanced text shadow for depth
    } : {}),
  },
  hint: {
    textAlign: 'center',
    color: Colors.hint,
    fontStyle: 'italic',
    fontSize: 14,
  },
  hintContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 10,
  },
  tickButton: {
    position: 'absolute',
    top: 10, 
    right: 10,
    zIndex: 5,
  },
  tickButtonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 4,
  },
  tickButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  tickIcon: {
    // Icon styling
  },
  logoWatermark: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 0,
    height: 0,
    resizeMode: 'contain',
    opacity: 0,
  },
  sampleSentenceContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
  },
  sampleSentenceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.notebookAccent,
    marginBottom: 4,
  },
  sampleSentenceText: {
    fontSize: 16,
    color: Colors.notebookText,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  // Tutorial styles
  tutorialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    zIndex: 10,
    paddingTop: 20,
    paddingRight: 20,
  },
  tutorialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  handContainer: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handPointer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  handIcon: {
    transform: [{ rotate: '45deg' }], // Rotate to point toward checkmark
  },
  tutorialBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 12,
    maxWidth: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  tutorialText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default FlashCard;