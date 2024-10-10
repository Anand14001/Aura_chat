import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, FlatList, ActivityIndicator, Image, StatusBar, ToastAndroid } from 'react-native';
import { getAuth, signOut, onAuthStateChanged, updateProfile, setPersistence, browserLocalPersistence,} from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { initializeApp,  } from "firebase/app";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Material  from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
const Profileicon = require('./Imageassets/profile.png');


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCT0RUrUJ5sb9E4biIHTDrE0U_jA6XwwU0",
    authDomain: "social-980f0.firebaseapp.com",
    projectId: "social-980f0",
    storageBucket: "social-980f0.appspot.com",
    messagingSenderId: "822049190420",
    appId: "1:822049190420:web:636c3222b609f19da4ad01",
    measurementId: "G-ZY6Q8GT9Q9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const user = auth.currentUser;




const ChatPage = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [userResults, setUserResults] = useState([]);
    const [lastChattedUsers, setLastChattedUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFindPeopleVisible, setIsFindPeopleVisible] = useState(false);
    const [isWarningVisible, setIsWarningVisible] = useState(true);
    const [userName, setUserName] = useState('');
    const [optionSelected, setOptionSelected] = useState(false);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
    const [user, setUser] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    // Fetch current user and last chatted users again when page comes back into focus
                    await fetchCurrentUser();
                    await fetchLastChattedUsers();
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [])
    );


    

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, fetch user data from Firestore
                const userDocRef = doc(db, 'users', user.uid); 
                const userDoc = await getDoc(userDocRef);
    
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserName(userData.name);
                    setProfilePhotoUrl(userData.profilePhoto || user.photoURL);
                    setCurrentUser(user); // Set currentUser properly
                    
                } else {
                    console.log('No such document!');
                }
            } else {
                // User is signed out
                setUserName('');
                setProfilePhotoUrl('');
                setCurrentUser(null);
            }
        });
    
        return () => unsubscribe();
    }, [auth, db]);
    
       
    console.log('user det:',currentUser)

    const CloseWarning = () => {
        setIsWarningVisible(false)
    }

    const toggleFindPeople = () => {
        setIsFindPeopleVisible(prev => !prev);
        setOptionSelected(false);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            await AsyncStorage.removeItem('user');
            ToastAndroid.show( "You have been logged out.",ToastAndroid.SHORT);
            navigation.replace('Signin');
        } catch (error) {
            Alert.alert("Logout Error", error.message);
        }
    };

    

    React.useLayoutEffect(() => {
        if (currentUser) {
            navigation.setOptions({
                title: `Welcome, ${userName|| currentUser.displayName}`,
                headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Profile', { Profilename: userName || currentUser.displayName, Profilemail: currentUser.email, Profileuid: currentUser.uid, Logout: handleLogout })} style={styles.ProfileButton}>
                 {profilePhotoUrl ? (
                        <Image source={{ uri: profilePhotoUrl }} style={styles.profileImage} />
                    ) : (
                        <Image source={Profileicon} style={{ width: 20, height: 20, alignSelf: 'center' }} />
                    )}
            </TouchableOpacity>),
                headerRight: () => (
                    <TouchableOpacity onPress={()=> navigation.navigate('Search')}>
                    <Material name='search-outline' size={30} color={'#ffff'}/>
                </TouchableOpacity>
                ),
                
            });
        }
    }, [navigation, currentUser, userName]);

   
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
    

    const fetchLastChattedUsers = async () => {
        if (!currentUser) return;

        try {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('senderId', '==', currentUser.uid),
                orderBy('timestamp', 'desc'),
                limit(5)
            );

            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs.map(doc => doc.data().receiverId);
            const messagesData = await fetchLastMessages(users); // Fetch last messages for each user
            setLastChattedUsers(messagesData);
        } catch (error) {
            console.error("Error fetching last chatted users:", error);
        }
    };

    useEffect(() => {
        fetchLastChattedUsers();
    }, [currentUser]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                AsyncStorage.setItem('user', JSON.stringify(user));
                setIsVerified(user.emailVerified);
                fetchLastChattedUsers();
            } else {
                setCurrentUser(null);
                AsyncStorage.removeItem('user');
            }
        });

        return () => unsubscribe();
    }, []);

    const searchUser = async () => {
        if (!email) {
            Alert.alert("Please enter an email.");
            return;
        }

        setLoading(true);
        setUserResults([]);

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert('Failure', "User not found.");
                setLoading(false);
                return;
            }

            const results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserResults(results);
        } catch (err) {
            console.error("Error searching user:", err);
            Alert.alert("Error searching user.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLastMessages = async (userIds) => {
        const messages = [];
        const seenUserIds = new Set(); // To track unique user IDs
    
        for (const userId of userIds) {
            if (seenUserIds.has(userId)) {
                continue; // Skip if user ID is already processed
            }
            seenUserIds.add(userId); // Mark user ID as processed
    
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(1) // Get the last message
            );
    
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const lastMessageData = querySnapshot.docs[0].data();
                const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId))); // Fetch user details
                const userData = userDoc.docs[0]?.data(); // Get user data
                
    
                messages.push({
                    userId,
                    lastMessage: lastMessageData.message,
                    timestamp: lastMessageData.timestamp.toDate().toLocaleString(), // Convert to local string
                    userName: userData?.name || 'Unknown', // Include user's name
                    profilePhotoUrl: userData?.profilePhoto || Profileicon 
                });
            } else {
                messages.push({ userId, lastMessage: 'No messages', timestamp: '', userName: 'Unknown', profilePhotoUrl: Profileicon });
            }
        }
        return messages;
    };

    if (!currentUser) {
        return (
            <View style={styles.container1}>
                <Text style={styles.notAuthenticatedText}>User is not authenticated!</Text>
            </View>
        );
    }

    
    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={'#ff8b42'} barStyle={'light-content'}/>
            {loading && <ActivityIndicator size="large" color="#ff8b42" style={{backgroundColor:'#ffff', flex:1, alignItems:'center',justifyContent:'center'}}/>}
            {isWarningVisible && !isVerified &&  (
    <View style={styles.verificationContainer}>
        <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text> 
            <Text style={styles.warningText}>Your email is not verified yet.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Verify')}>
            <Text style={styles.verifyButton}>Verify Email </Text>
        </TouchableOpacity>
    </View>
)}      
            <FlatList
                data={lastChattedUsers}
                keyExtractor={item => item.userId}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.userItem1} onPress={() => navigation.navigate('Message', { Recieveruid: item.userId, RecieveruserName: item.userName, Recieveremail:item.email, Recieverprofilephoto: item.profilePhotoUrl, Senderid:currentUser.uid })}>
                        <View style={{flexDirection:'row', justifyContent:'space-between',alignItems:'center'}}>
                        {item.profilePhotoUrl ? (
                        <Image source={{uri: item.profilePhotoUrl}} style={styles.profileImage} />
                    ) : (
                        <Image source={Profileicon} style={{ width: 20, height: 20, alignSelf: 'center' }} />
                    )}
                        <View>
                            <Text style={styles.userName}>{item.userName} </Text>
                        <Text style={styles.userText}>Time: {item.timestamp}</Text>
                        </View>
                        <View>
                            <Text></Text>
                        </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={()=>(
                    <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                        <Text style={{fontWeight:'bold',fontSize:25}}>No conversation yet. </Text>
                    </View>
                )}
                style={styles.userList}
            />
            {isFindPeopleVisible && (
                <View>
                <View style={{flexDirection:'row', width:'80%',  marginLeft:150}}>
                <TouchableOpacity style={styles.findPeopleContainer} onPress={() => navigation.navigate('Search',setOptionSelected(false), setIsFindPeopleVisible(false))}>
                    <Text style={styles.findPeopleText}>Find People</Text>
                    {/* Add any additional options for "Find People" here */}
                </TouchableOpacity>
                <View style={{backgroundColor:'#ff8b42',elevation:5, width:40,height:40,borderRadius:100,padding:10, alignItems:'center',justifyContent:'center'}}>
                <Material name='person-add' style={{alignSelf:'center'}} size={20} color={'#ffff'}/>
                </View>
                </View>
                 
                 <View style={{flexDirection:'row', width:'80%',  marginLeft:150}}>
                 <TouchableOpacity 
                    style={styles.findPeopleContainer} 
                    onPress={() => navigation.navigate('Profile', { 
                        Profilename: userName || "No Name", 
                        Profilemail: currentUser.email, 
                        Profileuid: currentUser.uid 
                    })}
                    >
                    <Text style={styles.findPeopleText}>View Profile</Text>
                    </TouchableOpacity>
                    <View style={{backgroundColor:'#ff8b42', elevation:5, width:40, height:40, borderRadius:100, padding:10, alignItems:'center', justifyContent:'center'}}>
                    <Material name='person-outline' style={{alignSelf:'center'}} size={20} color={'#ffff'}/>
                    </View>
                </View>

                <View style={{flexDirection:'row', width:'80%',  marginLeft:150}}>
                <TouchableOpacity style={styles.findPeopleContainer} onPress={() => navigation.navigate('Report',{Useremail:currentUser.email, userName:userName}, setOptionSelected(false), setIsFindPeopleVisible(false))}>
                    <Text style={styles.findPeopleText}>Report Bug</Text>
                    {/* Add any additional options for "Find People" here */}
                </TouchableOpacity>
                <View style={{backgroundColor:'#ff8b42',elevation:5, width:40,height:40,borderRadius:100,padding:10, alignItems:'center',justifyContent:'center'}}>
                <Material name='bug' style={{alignSelf:'center'}} size={20} color={"#ffff"}/>
                </View>
                </View>
                </View>

                
            )}
             <TouchableOpacity 
                style={[styles.toggleButton, { backgroundColor: isFindPeopleVisible ? 'gray' : '#ff8b42' }]} 
                onPress={toggleFindPeople}>
                     <Material name={isFindPeopleVisible || optionSelected ? 'close' : 'add'} size={30} color="white" />
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
       
    },
    container1: {
        flex: 1,
        justifyContent: 'center',
       
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    userInfoContainer: {
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 10,
    },
    userInfoText: {
        fontSize: 16,
        marginVertical: 2,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    warning: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
    verificationContainer: {
        padding: 10,
        backgroundColor: '#fff3cd',
        borderRadius: 5,
        borderColor: '#ffeeba',
        borderWidth: 1,
        marginBottom: 0,
        alignItems:'center'
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    warningIcon: {
        fontSize: 20,
        color: '#856404',
        marginRight: 8,
    },
    warningText: {
        fontSize: 16,
        color: '#856404',
    },
    closeButton: {
        fontWeight:'bold'
    },
    Closecontainer: {
        padding: 0,
        borderRadius: 100,
        color: '#333',
        textAlign: 'center',
        alignSelf: 'flex-end',  // Align the close button to the right
        marginTop: 0,
        fontWeight: 'bold',
        borderWidth:2,
        alignItems:'center',
        width:30
    },
    verifyButton: {
        fontSize: 16,
        color: '#007bff',
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    userList: {
        marginTop: 0,
    },
    lastChattedTitle: {
        fontSize: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    userItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor:'#ccc',
        margin:10,
        borderRadius:10
    },
    userItem1: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        margin:10,
        borderRadius:10,
        justifyContent:'flex-start',
    },
    userText: {
        fontSize: 16,
    },
    userName:{
        fontWeight:'bold',
        fontSize:20
    },
    toggleButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end', // Aligns items to the right
        marginBottom: 16,
        
    },
    toggleButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: 50,
        marginVertical: 16,
        alignSelf: 'flex-end',
        right:20
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: 30,
        fontWeight:'bold'
    },
    findPeopleContainer: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 25,
        marginBottom: 16,
        width: '50%',
        alignItems: 'center',
        elevation: 5,
        alignSelf: 'flex-end', // Aligns to the right side
        right:20,
        
        
    },
    findPeopleText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    findPeopleText1: {
        fontSize: 16,
        fontWeight: 'bold',
        color:'#fff'
    },
    ProfileButton:{
        borderWidth:0.5,
        alignItems:'center',
        borderRadius:50,
        alignSelf:'center'
    },
    notAuthenticatedText:{
        fontWeight:'bold',
        textAlign:'center',
        fontSize:20,
        justifyContent:'center'
    },
    profileImage:{
        height:50,
        width:50,
        borderRadius:50
    }
});

export default ChatPage;
