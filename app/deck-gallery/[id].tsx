import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ref, get } from 'firebase/database';
import { db, auth } from '../../src/firebase/config';

export default function DeckGalleryDetail() {
  const { id } = useLocalSearchParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const deckRef = ref(db, `sharedDecks/${id}`);
        const snapshot = await get(deckRef);
        
        if (snapshot.exists()) {
          setDeck({
            id: snapshot.key,
            ...snapshot.val()
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shared deck:', error);
        setLoading(false);
      }
    };
    
    fetchDeck();
  }, [id]);
  
  // Rest of your component logic...
  
  return (
    <ScrollView style={styles.container}>
      {/* Your existing deck detail UI */}
      
      {/* Rest of your UI */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  // Your existing styles...
});
