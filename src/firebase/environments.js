// Firebase environment configurations
// This file allows switching between different Firebase projects based on the build target

// Production (Android) Firebase configuration
const ANDROID_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_ANDROID_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_ANDROID_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_ANDROID_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_ANDROID_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_ANDROID_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_ANDROID_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_ANDROID_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_ANDROID_FIREBASE_MEASUREMENT_ID
};

// Current/Web Firebase configuration
const CURRENT_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Determine which configuration to use based on environment variables or platform
const getFirebaseConfig = () => {
  // Check if we're building specifically for Android with the Android config
  if (process.env.EXPO_PUBLIC_USE_ANDROID_CONFIG === 'true') {
    console.log('Using Android Firebase configuration');
    return ANDROID_CONFIG;
  }
  
  // Default to current config
  console.log('Using default Firebase configuration');
  return CURRENT_CONFIG;
};

export default getFirebaseConfig;
