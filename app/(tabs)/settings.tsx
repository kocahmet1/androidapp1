import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBarIcon from '../../src/components/TabBarIcon';
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';

// Storage key for card layout preference
const CARD_LAYOUT_PREF_KEY = 'cardLayoutPreference';

export default function SettingsScreen() {
  const [definitionFirst, setDefinitionFirst] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    loadPreferences();
    
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPref = await AsyncStorage.getItem(CARD_LAYOUT_PREF_KEY);
      if (savedPref !== null) {
        setDefinitionFirst(JSON.parse(savedPref));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const savePreferences = async (value) => {
    try {
      await AsyncStorage.setItem(CARD_LAYOUT_PREF_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleToggleChange = (value) => {
    setDefinitionFirst(value);
    savePreferences(value);
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              // Navigate to login screen first, then sign out
              // This order helps prevent navigation issues
              router.replace('/login');
              
              // Small delay to allow navigation to complete
              setTimeout(async () => {
                try {
                  await signOut(auth);
                  console.log('User signed out successfully');
                } catch (error) {
                  console.error('Error during sign out process:', error);
                  // Don't show an alert here as we've already navigated away
                }
              }, 500);
            } catch (error) {
              console.error('Error during sign out navigation:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Display Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Default Card Layout</Text>
            <Text style={styles.settingDescription}>
              {definitionFirst ? 'Definition shown first' : 'Term shown first'}
            </Text>
          </View>
          
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, !definitionFirst && styles.activeOption]}>Term First</Text>
            <Switch
              trackColor={{ false: '#3e3e3e', true: '#6366F1' }}
              thumbColor={definitionFirst ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleToggleChange}
              value={definitionFirst}
              style={styles.toggle}
            />
            <Text style={[styles.toggleLabel, definitionFirst && styles.activeOption]}>Definition First</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          This setting determines what side of the card is shown first when studying vocabulary sets.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        {userEmail ? (
          <View style={styles.settingItem}>
            <View style={styles.accountInfoContainer}>
              <View style={styles.avatarContainer}>
                <MaterialIcons name="account-circle" size={40} color="#6366F1" />
              </View>
              <View style={styles.userInfoContainer}>
                <Text style={styles.userEmail}>{userEmail}</Text>
                <Text style={styles.accountStatus}>Signed In</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <MaterialIcons name="logout" size={20} color="#FFFFFF" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Not Signed In</Text>
              <Text style={styles.settingDescription}>
                Sign in to save your vocabulary sets
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => router.push('/login')}
            >
              <MaterialIcons name="login" size={20} color="#FFFFFF" />
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  section: {
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingTextContainer: {
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#94A3B8',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  activeOption: {
    color: '#6366F1',
    fontWeight: '600',
  },
  toggle: {
    marginHorizontal: 8,
  },
  infoContainer: {
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  accountInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  userInfoContainer: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  accountStatus: {
    fontSize: 14,
    color: '#94A3B8',
  },
  signOutButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  signInButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});
