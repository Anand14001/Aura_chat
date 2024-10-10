import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getFirestore, collection, onSnapshot } from '@firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const UserListScreen = () => {
  const [users, setUsers] = useState([]);
  const db = getFirestore();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      console.log("Users: ", usersList); // Debugging log
      setUsers(usersList);
    });
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('Chat', { userId: item.uid, userName: item.name })}
    >
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text> {/* Displaying email */}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  userItem: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderRadius: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
  },
});

export default UserListScreen;
