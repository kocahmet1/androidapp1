import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, push, set, update, remove, get, query, orderByChild, equalTo } from 'firebase/database';
import { db, auth } from '../firebase/config';
import { Platform } from 'react-native';

export function useDecks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key to force re-fetching

  // Function to force refresh the decks data
  const refreshDecks = () => {
    console.log("Forcing refresh of decks data");
    setRefreshKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    console.log(`useDecks hook - refreshKey: ${refreshKey} - auth.currentUser:`, auth.currentUser ? auth.currentUser.uid : "No user");

    if (!auth.currentUser) {
      console.log("useDecks: No current user, returning empty decks");
      setDecks([]);
      setLoading(false);
      return;
    }

    let unsubscribe;
    try {
      const userDecksRef = ref(db, `users/${auth.currentUser.uid}/decks`);
      console.log("Fetching decks from:", `users/${auth.currentUser.uid}/decks`);

      unsubscribe = onValue(userDecksRef, (snapshot) => {
        try {
          const data = snapshot.val();
          console.log("Decks data received:", data ? "Data exists" : "No data");

          if (data) {
            const decksArray = Object.entries(data).map(([id, deck]) => ({
              id,
              ...deck,
            }));
            console.log(`Found ${decksArray.length} decks`);
            setDecks(decksArray);
          } else {
            console.log("No decks found, setting empty array");
            setDecks([]);
          }
          setError(null);
        } catch (err) {
          console.error('Error processing decks data:', err);
          setError('Error loading decks');
          setDecks([]);
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error('Error loading decks:', error);
        setError('Error loading decks');
        setDecks([]);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error setting up decks listener:', error);
      setError('Error loading decks');
      setDecks([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [auth.currentUser?.uid, refreshKey]); // Re-run when user ID changes or refreshKey changes

  const createDeck = async (name, isShared = false) => {
    if (!auth.currentUser) {
      console.error("Cannot create deck: No authenticated user");
      throw new Error('You must be logged in to create a deck');
    }

    try {
      console.log(`Creating deck: "${name}", isShared: ${isShared}`);

      const userDecksRef = ref(db, `users/${auth.currentUser.uid}/decks`);
      const newDeckRef = push(userDecksRef);
      const newDeckId = newDeckRef.key;

      const newDeck = {
        id: newDeckId,
        name,
        createdAt: new Date().toISOString(),
        creatorId: auth.currentUser.uid,
        isShared: isShared === true, // Ensure boolean
        cards: [],
      };

      console.log(`Setting deck with ID: ${newDeckId}`, newDeck);
      await set(newDeckRef, newDeck);
      console.log("Deck created successfully:", newDeckId);

      return {
        id: newDeckId,
        ...newDeck,
      };
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error;
    }
  };

  const deleteDeck = async (deckId) => {
    if (!auth.currentUser) {
      console.error("Cannot delete deck: No authenticated user");
      throw new Error('You must be logged in to delete a deck');
    }

    try {
      console.log("Attempting to delete deck:", deckId);

      // First check if this deck is shared
      const userDeckRef = ref(db, `users/${auth.currentUser.uid}/decks/${deckId}`);
      const userDeckSnapshot = await get(userDeckRef);

      if (userDeckSnapshot.exists()) {
        const deckData = userDeckSnapshot.val();

        // If deck is shared and user is creator, also delete from public decks
        if (deckData.isShared) {
          console.log("Deck is shared, checking if user is creator");

          if (deckData.creatorId === auth.currentUser.uid) {
            console.log("User is creator, deleting from public decks");
            const publicDeckRef = ref(db, `decks/${deckId}`);
            await remove(publicDeckRef);
          }
        }

        // Always delete from user's decks
        console.log("Deleting deck from user's decks");
        await remove(userDeckRef);

        if (Platform.OS === 'web') {
          // Manually update state on web platform
          setDecks(decks.filter(deck => deck.id !== deckId));
        }

        console.log("Deck deleted successfully:", deckId);

        return true;
      } else {
        console.error("Deck not found in user's decks");
        return false;
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error;
    }
  };

  const shareDeck = async (deckId, isShared = undefined) => {
    if (!auth.currentUser) {
      console.error("Cannot share deck: No authenticated user");
      throw new Error('You must be logged in to share a deck');
    }

    try {
      // First, get the deck data
      const userDeckRef = ref(db, `users/${auth.currentUser.uid}/decks/${deckId}`);

      // Create a new listener just for this operation
      return new Promise((resolve, reject) => {
        onValue(userDeckRef, async (snapshot) => {
          try {
            const deckData = snapshot.val();
            if (!deckData) {
              throw new Error('Deck not found');
            }

            // If isShared is not provided, toggle the current value or default to true
            const currentIsShared = deckData.isShared || false;
            const newIsShared = isShared !== undefined ? isShared : !currentIsShared;

            // Update the isShared flag in user's deck
            const userDeckShareRef = ref(db, `users/${auth.currentUser.uid}/decks/${deckId}/isShared`);
            await set(userDeckShareRef, newIsShared);

            if (newIsShared) {
              // If sharing, copy to public decks
              const publicDeckRef = ref(db, `decks/${deckId}`);
              await set(publicDeckRef, {
                ...deckData,
                isShared: true,
                owner: auth.currentUser.uid,
                ownerEmail: auth.currentUser.email,
              });

              console.log("Deck shared successfully:", deckId);
            } else {
              // If unsharing, remove from public decks
              const publicDeckRef = ref(db, `decks/${deckId}`);
              await remove(publicDeckRef);

              console.log("Deck unshared successfully:", deckId);
            }

            resolve(true);
          } catch (error) {
            console.error('Error in share deck operation:', error);
            reject(error);
          }
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.error('Error sharing deck:', error);
      throw error;
    }
  };

  const forkDeck = async (sourceDeck) => {
    if (!auth.currentUser) return null;
    
    try {
      console.log(`Forking deck: ${sourceDeck.id}`);

      // Create a new deck in the user's collection
      const userDecksRef = ref(db, `users/${auth.currentUser.uid}/decks`);
      const newDeckRef = push(userDecksRef);
      const newDeckId = newDeckRef.key;

      // Reset the known status for all cards in the source deck
      let cardsForNewDeck = [];
      
      if (sourceDeck.cards) {
        // Handle both array and object data structures for cards
        const sourceCards = Array.isArray(sourceDeck.cards) 
          ? sourceDeck.cards 
          : Object.values(sourceDeck.cards);
          
        // Create new cards with isKnown set to false
        cardsForNewDeck = sourceCards.map(card => ({
          ...card,
          isKnown: false  // Reset the known status for all cards
        }));
      }

      // Create the forked deck with the same cards as the source
      const forkedDeck = {
        id: newDeckId,
        name: `${sourceDeck.name} (Forked)`,
        createdAt: new Date().toISOString(),
        creatorId: auth.currentUser.uid,
        creatorName: auth.currentUser.displayName || auth.currentUser.email || 'User',
        isShared: false, // Default to not shared
        cards: cardsForNewDeck,
        forkedFrom: {
          id: sourceDeck.id,
          name: sourceDeck.name,
          creatorId: sourceDeck.creatorId
        }
      };

      // Save the forked deck
      await set(newDeckRef, forkedDeck);
      console.log(`Deck forked successfully. New ID: ${newDeckId}`);

      return {
        id: newDeckId,
        ...forkedDeck
      };
    } catch (error) {
      console.error('Error forking deck:', error);
      return null;
    }
  };

  const updateDeck = async (deckId, updates) => {
    if (!auth.currentUser) {
      console.error("Cannot update deck: No authenticated user");
      throw new Error('You must be logged in to update a deck');
    }

    try {
      // First, check if the deck exists in the user's collection
      const userDeckRef = ref(db, `users/${auth.currentUser.uid}/decks/${deckId}`);
      const snapshot = await get(userDeckRef);

      if (!snapshot.exists()) {
        throw new Error('Deck not found in your collection');
      }

      // Get the current deck data
      const currentDeck = snapshot.val();

      // Apply updates
      await update(userDeckRef, updates);

      // If the deck is shared, also update the public copy
      if (currentDeck.isShared && currentDeck.creatorId === auth.currentUser.uid) {
        const publicDeckRef = ref(db, `decks/${deckId}`);
        await update(publicDeckRef, updates);
      }

      console.log(`Deck ${deckId} updated successfully`);
      return true;
    } catch (error) {
      console.error('Error updating deck:', error);
      throw error;
    }
  };

  const addCardToDeck = async (deckId, card) => {
    if (!auth.currentUser) {
      console.error("Cannot add card: No authenticated user");
      throw new Error('You must be logged in to add a card');
    }

    try {
      // First, check if the deck exists in the user's collection
      const userDeckRef = ref(db, `users/${auth.currentUser.uid}/decks/${deckId}`);
      const snapshot = await get(userDeckRef);

      if (!snapshot.exists()) {
        throw new Error('Deck not found in your collection');
      }

      const deckData = snapshot.val();
      const cards = deckData.cards || [];

      // Generate a unique ID for the card
      const cardId = Date.now().toString();
      const newCard = {
        id: cardId,
        ...card,
        createdAt: new Date().toISOString()
      };

      // Add the card to the deck
      cards.push(newCard);

      // Update the deck with the new cards array
      await update(userDeckRef, { cards });

      // If the deck is shared, also update the public copy
      if (deckData.isShared && deckData.creatorId === auth.currentUser.uid) {
        const publicDeckRef = ref(db, `decks/${deckId}`);
        await update(publicDeckRef, { cards });
      }

      console.log(`Card added to deck ${deckId} successfully`);
      return {
        deckId,
        card: newCard
      };
    } catch (error) {
      console.error('Error adding card to deck:', error);
      throw error;
    }
  };

  const updateCardInDeck = async (deckId, cardId, updates) => {
    if (!auth.currentUser) {
      console.error("Cannot update card: No authenticated user");
      throw new Error('You must be logged in to update a card');
    }

    try {
      // First, check if the deck exists in the user's collection
      const userDeckRef = ref(db, `users/${auth.currentUser.uid}/decks/${deckId}`);
      const snapshot = await get(userDeckRef);

      if (!snapshot.exists()) {
        throw new Error('Deck not found in your collection');
      }

      const deckData = snapshot.val();
      const cards = deckData.cards || [];

      // Find the card to update
      const cardIndex = cards.findIndex(card => card.id === cardId);
      if (cardIndex === -1) {
        throw new Error('Card not found in deck');
      }

      // Update the card
      cards[cardIndex] = {
        ...cards[cardIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Update the deck with the modified cards array
      await update(userDeckRef, { cards });

      // If the deck is shared, also update the public copy
      if (deckData.isShared && deckData.creatorId === auth.currentUser.uid) {
        const publicDeckRef = ref(db, `decks/${deckId}`);
        await update(publicDeckRef, { cards });
      }

      console.log(`Card ${cardId} in deck ${deckId} updated successfully`);
      return {
        deckId,
        card: cards[cardIndex]
      };
    } catch (error) {
      console.error('Error updating card in deck:', error);
      throw error;
    }
  };

  const deleteCardFromDeck = async (deckId, cardId) => {
    if (!auth.currentUser) {
      console.error("Cannot delete card: No authenticated user");
      throw new Error('You must be logged in to delete a card');
    }

    try {
      // First, check if the deck exists in the user's collection
      const userDeckRef = ref(db, `users/${auth.currentUser.uid}/decks/${deckId}`);
      const snapshot = await get(userDeckRef);

      if (!snapshot.exists()) {
        throw new Error('Deck not found in your collection');
      }

      const deckData = snapshot.val();
      const cards = deckData.cards || [];

      // Filter out the card to delete
      const updatedCards = cards.filter(card => card.id !== cardId);

      // If no cards were removed, the card wasn't found
      if (updatedCards.length === cards.length) {
        throw new Error('Card not found in deck');
      }

      // Update the deck with the filtered cards array
      await update(userDeckRef, { cards: updatedCards });

      // If the deck is shared, also update the public copy
      if (deckData.isShared && deckData.creatorId === auth.currentUser.uid) {
        const publicDeckRef = ref(db, `decks/${deckId}`);
        await update(publicDeckRef, { cards: updatedCards });
      }

      console.log(`Card ${cardId} deleted from deck ${deckId} successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting card from deck:', error);
      throw error;
    }
  };

  return {
    decks,
    loading,
    error,
    refreshDecks,
    createDeck,
    deleteDeck,
    shareDeck,
    forkDeck,
    updateDeck,
    addCardToDeck,
    updateCardInDeck,
    deleteCardFromDeck
  };
}