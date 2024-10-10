import { StyleSheet, Text, TextInput, View, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'

const SearchScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          const user = auth.currentUser;
          if (user) {
            setCurrentUser(user);
            await AsyncStorage.setItem('user', JSON.stringify(user));
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    const fetchRecentSearches = async () => {
      try {
        const storedSearches = await AsyncStorage.getItem('recentSearches');
        if (storedSearches) {
          const searches = JSON.parse(storedSearches);
          // Limit to last 2-3 searches
          setRecentSearches(searches.slice(-3));
        }
      } catch (error) {
        console.error('Error fetching recent searches:', error);
      }
    };

    fetchCurrentUser();
    fetchRecentSearches();
  }, []);

  const searchUser = async () => {
    if (!searchTerm) {
      Alert.alert('Please enter an email or username.');
      return;
    }

    setLoading(true);
    setUserResults([]);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchTerm.trim()));

      const querySnapshotByEmail = await getDocs(q);

      let results = querySnapshotByEmail.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (results.length === 0) {
        // If no result by email, search by username
        const qByUsername = query(usersRef, where('username', '==', searchTerm.trim()));
        const querySnapshotByUsername = await getDocs(qByUsername);

        results = querySnapshotByUsername.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      if (results.length === 0) {
        Alert.alert('No user found.');
      } else {
        setUserResults(results);
        // Save the search term to recent searches
        await saveRecentSearch(searchTerm);
      }
    } catch (err) {
      console.error('Error searching user:', err);
      Alert.alert('Error searching user.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = async (user) => {
    try {
      // Check if the user is already in the recent searches and avoid duplicates
      const updatedSearches = [user, ...recentSearches.filter(s => s !== user)].slice(-5); // Limit to 5 recent searches
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleRecentSearchPress = async (username) => {
    // Set the search term to the username clicked
    setSearchTerm(username);
    
    // Call searchUser but ensure it finds the user by both email and username
    setLoading(true);
    
    try {
      const usersRef = collection(db, 'users');
      
      // First, try to search by username
      let results;
      const qByUsername = query(usersRef, where('username', '==', username.trim()));
      const querySnapshotByUsername = await getDocs(qByUsername);
      
      results = querySnapshotByUsername.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // If not found by username, search by email as fallback
      if (results.length === 0) {
        const qByEmail = query(usersRef, where('email', '==', username.trim()));
        const querySnapshotByEmail = await getDocs(qByEmail);
        
        results = querySnapshotByEmail.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
  
      // Handle results found
      if (results.length > 0) {
        const item = results[0]; // Assume the first result is the correct user
        navigation.replace('Message', {
          RecieveruserName: item.userName || item.name,
          Recieveremail: item.email,
          Recieveruid: item.uid,
          Recieverprofilephoto: item.profilePhoto,
          Senderusername: currentUser?.displayName,
          Senderemail: currentUser?.email,
          Senderuid: currentUser?.uid,
        });
      } else {
        Alert.alert('User not found.');
      }
    } catch (err) {
      console.error('Error retrieving recent search:', err);
      Alert.alert('Error retrieving user information.');
    } finally {
      setLoading(false);
    }
  };

  const clearRecentSearches = async () => {
    try {
      // Clear recent searches from state and AsyncStorage
      setRecentSearches([]);
      await AsyncStorage.removeItem('recentSearches');
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };
  
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter email or username"
        value={searchTerm}
        onChangeText={setSearchTerm}
        onEndEditing={searchUser}
      />
      {loading && <ActivityIndicator size="large" color="gray" />}

      {userResults.length > 0 && (
      <View>
        {userResults.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.userContainer}
            onPress={() =>
              navigation.replace('Message', {
                RecieveruserName: item.userName || item.name,
                Recieveremail: item.email,
                Recieveruid: item.uid,
                Recieverprofilephoto: item.profilePhoto,
                Senderusername: currentUser?.displayName,
                Senderemail: currentUser?.email,
                Senderuid: currentUser?.uid,
              })
            }
          >
            <Image
              source={{ uri: item.profilePhoto }} // Make sure this field exists
              style={styles.profilePhoto}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userText}>Name: {item.userName || item.name}</Text>
              <Text style={styles.userText}>Email: {item.email}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )}

      <View>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
        {recentSearches.length > 0 && (
    <TouchableOpacity style={styles.clearButton} onPress={clearRecentSearches}>
        <Icon name='close-circle-outline' size={30}/>
    </TouchableOpacity>
  )}
  </View>
        <FlatList
          data={recentSearches}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recentSearchItem}
              onPress={() => handleRecentSearchPress(item)} // Pass the username here
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  input: {
    borderColor: 'gray',
    marginBottom: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 30,
    padding: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
    padding: 10,
    
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    elevation: 3,
  },
  userText: {
    fontSize: 16,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentSearchItem: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    marginTop: 10,
    borderRadius: 10,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    elevation: 3,
  },
  profilePhoto: {
    width: 50, // Adjust as needed
    height: 50, // Adjust as needed
    borderRadius: 25, // Makes the image circular
    marginRight: 10, // Space between the photo and text
  },
  userInfo: {
    flex: 1, // Allows the text to take the remaining space
  },
});
