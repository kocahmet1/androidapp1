import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Linking } from 'react-native';
import { auth } from '../src/firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { clearAuthData } from '../src/utils/authUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/Colors';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Custom logger to suppress specific Firebase errors
const safeConsoleError = (message, error) => {
  // List of error codes we want to suppress from console
  const suppressedErrorCodes = [
    'auth/email-already-in-use',
    'auth/user-not-found',
    'auth/wrong-password',
    'auth/invalid-email'
  ];
  
  // Only log to console if it's not a suppressed error
  if (!error || !error.code || !suppressedErrorCodes.includes(error.code)) {
    console.error(message, error);
  }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await clearAuthData();
        setInitialCheckDone(true);
      } catch (error) {
        safeConsoleError('Error during initial auth check:', error);
        setInitialCheckDone(true);
      }
    };

    checkAuth();
  }, []);

  // Function to check if an email exists in Firebase
  const checkEmailExists = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      // Use a simple console.log for this non-critical error
      console.log('Error checking email existence - this is normal for some email formats');
      return false;
    }
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password) => {
    // Password must be at least 8 characters
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    // Password is valid
    return { valid: true, message: '' };
  };

  const validateInputs = () => {
    // Reset previous errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
    
    let isValid = true;
    
    if (!email) {
      setEmailError('Please enter your email');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    if (!password) {
      setPasswordError('Please enter your password');
      isValid = false;
    } else if (isSignUp) {
      // Only validate password strength for sign-up
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setPasswordError(passwordValidation.message);
        isValid = false;
      }
    }
    
    // Additional validations for sign-up
    if (isSignUp) {
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password');
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        isValid = false;
      }
      
      if (!acceptedTerms) {
        setTermsError('You must accept the Terms of Service and Privacy Policy');
        isValid = false;
      }
    }
    
    if (!isValid) {
      // Show alert for the first error
      if (emailError) {
        Alert.alert('Error', emailError);
      } else if (passwordError) {
        Alert.alert('Error', passwordError);
      } else if (confirmPasswordError) {
        Alert.alert('Error', confirmPasswordError);
      } else if (termsError) {
        Alert.alert('Error', termsError);
      }
    }
    
    return isValid;
  };

  const handleAuth = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // For sign-up, check if email already exists
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          Alert.alert(
            'Email Already Registered', 
            'This email is already registered. Please use a different email or login instead.',
            [
              { text: 'Login Instead', onPress: () => setIsSignUp(false) },
              { text: 'Try Again', style: 'cancel' }
            ]
          );
          setLoading(false);
          return;
        }
        
        // Create new user without email verification
        await createUserWithEmailAndPassword(auth, email, password);
        
        // Navigate to tabs directly
        router.replace('/(tabs)');
      } else {
        // For sign-in, check if email exists first
        const emailExists = await checkEmailExists(email);
        if (!emailExists) {
          Alert.alert(
            'Account Not Found', 
            'No account found with this email. Would you like to sign up instead?',
            [
              { text: 'Sign Up', onPress: () => setIsSignUp(true) },
              { text: 'Try Again', style: 'cancel' }
            ]
          );
          setLoading(false);
          return;
        }
        
        // Proceed with sign in
        await signInWithEmailAndPassword(auth, email, password);
        router.replace('/(tabs)');
      }
    } catch (error) {
      // Use our custom logger instead of console.error directly
      safeConsoleError('Auth error:', error);
      
      // Show user-friendly error messages based on error code
      let errorMessage = 'An unexpected error occurred. Please try again.';
      let errorTitle = isSignUp ? 'Sign-up Failed' : 'Sign-in Failed';
      
      switch(error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please sign up first.';
          errorTitle = 'Account Not Found';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          errorTitle = 'Incorrect Password';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or login instead.';
          errorTitle = 'Email Already Registered';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use a stronger password (at least 6 characters).';
          errorTitle = 'Weak Password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          errorTitle = 'Network Error';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many unsuccessful attempts. Please try again later.';
          errorTitle = 'Too Many Attempts';
          break;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSecureTextEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const toggleConfirmSecureTextEntry = () => {
    setConfirmSecureTextEntry(!confirmSecureTextEntry);
  };

  const openTermsOfService = () => {
    // Replace with your actual Terms of Service URL
    Linking.openURL('https://yourapp.com/terms');
  };

  const openPrivacyPolicy = () => {
    // Replace with your actual Privacy Policy URL
    Linking.openURL('https://yourapp.com/privacy');
  };

  if (!initialCheckDone) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary, Colors.accent]}
          style={styles.gradient}
        />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Preparing login...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.secondary, Colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeInDown.duration(800).springify()} 
          style={styles.logoContainer}
        >
          <Text style={styles.appName}>Flashcards</Text>
          <Text style={styles.appTagline}>Master your knowledge</Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.duration(800).springify().delay(300)} 
          style={styles.formContainer}
        >
          <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
            <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                secureTextEntry={secureTextEntry}
                editable={!loading}
              />
              <TouchableOpacity onPress={toggleSecureTextEntry} style={styles.eyeIcon}>
                <Ionicons 
                  name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {isSignUp && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                    placeholder="Confirm Password"
                    placeholderTextColor={Colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setConfirmPasswordError('');
                    }}
                    secureTextEntry={confirmSecureTextEntry}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={toggleConfirmSecureTextEntry} style={styles.eyeIcon}>
                    <Ionicons 
                      name={confirmSecureTextEntry ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color={Colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                <View style={styles.termsContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox} 
                    onPress={() => {
                      setAcceptedTerms(!acceptedTerms);
                      setTermsError('');
                    }}
                  >
                    <Ionicons 
                      name={acceptedTerms ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={acceptedTerms ? Colors.accent : Colors.textSecondary} 
                    />
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    I accept the{' '}
                    <Text style={styles.termsLink} onPress={openTermsOfService}>
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text style={styles.termsLink} onPress={openPrivacyPolicy}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
                {termsError ? <Text style={styles.errorText}>{termsError}</Text> : null}
              </>
            )}

            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setIsSignUp(!isSignUp);
                // Reset form when switching modes
                setConfirmPassword('');
                setPasswordError('');
                setConfirmPasswordError('');
                setTermsError('');
                setAcceptedTerms(false);
              }} 
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  appTagline: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 5,
  },
  formContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurContainer: {
    padding: 25,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  eyeIcon: {
    padding: 10,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
  },
});
