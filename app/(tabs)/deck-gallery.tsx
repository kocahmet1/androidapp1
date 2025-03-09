import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '../../src/firebase/config';
import { MaterialIcons } from '@expo/vector-icons';
import { useDecks } from '../../src/hooks/useDecks';

export default function SetGallery() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyingIds, setCopyingIds] = useState([]);
  const router = useRouter();
  const { forkDeck } = useDecks();

  useEffect(() => {
    if (!auth.currentUser) {
      setSets([]);
      setLoading(false);
      return;
    }

    const setsRef = ref(db, 'decks');
    const unsubscribe = onValue(setsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const setsArray = Object.entries(data)
            .map(([id, set]) => ({
              id,
              ...set,
            }))
            .filter(set => set.isShared); // Only show shared sets

          setSets(setsArray);
        } else {
          setSets([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error processing sets data:', err);
        setError('Error loading sets');
        setSets([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error loading sets:', error);
      setError('Error loading sets');
      setSets([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopySet = async (e, item) => {
    // Prevent navigation to set detail page
    e.stopPropagation();
    if (Platform.OS === 'web' && e.preventDefault) {
      e.preventDefault();
    }

    try {
      // Add to copying state to show loading indicator
      setCopyingIds(prev => [...prev, item.id]);
      
      const forkedDeckId = await forkDeck(item);
      
      if (forkedDeckId) {
        Alert.alert(
          "Success",
          `"${item.name}" has been copied to your sets.`,
          [
            {
              text: "View Set",
              onPress: () => router.push(`/deck/${forkedDeckId.id}`),
            },
            {
              text: "OK",
              style: "cancel"
            }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to copy set. Please try again.");
      }
    } catch (error) {
      console.error("Error copying set:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      // Remove from copying state
      setCopyingIds(prev => prev.filter(id => id !== item.id));
    }
  };

  const renderSetItem = ({ item }) => {
    const cardsArray = item.cards ? Object.values(item.cards) : [];
    const totalCards = cardsArray.length;
    const isCopying = copyingIds.includes(item.id);
    
    // Determine creator display name
    let creatorDisplay = 'Unknown';
    if (item.creatorName) {
      creatorDisplay = item.creatorName;
    } else if (item.ownerEmail) {
      creatorDisplay = item.ownerEmail;
    }

    return (
      <TouchableOpacity 
        style={styles.setCard}
        onPress={() => router.push(`/deck/${item.id}`)}
      >
        <Text style={styles.setName}>{item.name}</Text>
        <Text style={styles.creatorName}>by {creatorDisplay}</Text>
        <Text style={styles.cardCount}>{totalCards} words</Text>
        
        <TouchableOpacity
          style={styles.copyButton}
          onPress={(e) => handleCopySet(e, item)}
          disabled={isCopying}
        >
          {isCopying ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <MaterialIcons name="content-copy" size={16} color="#007AFF" />
              <Text style={styles.copyButtonText}>Copy</Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sets}
        renderItem={renderSetItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No shared sets available</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  setCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  setName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    paddingRight: 80, // Make room for copy button
  },
  creatorName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  copyButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e9f5',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
});
