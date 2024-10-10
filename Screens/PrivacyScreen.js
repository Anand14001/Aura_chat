import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Icon  from 'react-native-vector-icons/Ionicons';

const PrivacyScreen = ({ route }) => {
  const { userId } = route.params; // Assuming userId is passed as a prop
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const db = getFirestore();
        const blockListRef = doc(db, 'blockList', userId);
        const blockListDoc = await getDoc(blockListRef);

        if (blockListDoc.exists()) {
          const { blockedUsers } = blockListDoc.data();
          setBlockedUsers(blockedUsers || []);
        } else {
          console.log('No block list found for this user');
        }
      } catch (error) {
        console.error('Error fetching blocked users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, [userId]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="gray"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffff' }}
      />
    );
  }

  const renderBlockedUser = ({ item }) => (
    <View style={{alignItems:'center', flexDirection:'row',justifyContent:'space-between'}} >
      <Image source={{ uri: item.profilePhoto }} style={styles.profileImage} />
      <View style={{alignItems:'center', }}>
      <Text style={styles.blockedUserName}>{item.name}</Text>
      <Text style={styles.blockedUserUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity>
      <Icon name='lock-open-outline' size={30}/>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontWeight: 'bold', color: '#000', fontSize: 15 }}>Blocked Users</Text>
      </View>
      
      {blockedUsers.length > 0 ? (
        <View style={styles.Container2}>
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.uid}
          renderItem={renderBlockedUser}
          
        />
        </View>
      ) : (
        <Text style={styles.noBlockedUsers}>No blocked users</Text>
      )}
    </View>
  );
};

export default PrivacyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    borderWidth: 0.4,
    borderColor: '#ccc',
    marginBottom: 20,
  },

  Container2: {
    width: '80%',
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    elevation: 3,
    borderWidth: 0.4,
    borderColor: '#ccc',
    marginBottom: 20,
    flexDirection:'row'
  },
  
  blockedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'flex-start',
    backgroundColor:'#fff',
    elevation:3,
    padding:10,
    borderRadius:10
 
    
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  blockedUserName: {
    fontSize: 20,
    color: '#000',
    fontWeight:'bold'
  },
  blockedUserUsername: {
    fontSize: 14,
    color: 'gray',
  },
  noBlockedUsers: {
    color: 'gray',
    fontSize: 14,
    marginTop: 20,
  },
});
