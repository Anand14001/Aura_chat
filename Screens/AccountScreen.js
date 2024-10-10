import { StyleSheet, Text, TouchableOpacity, View, Alert, Modal, TextInput, Button, ToastAndroid } from 'react-native';
import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import LottieView from 'lottie-react-native';

const firebaseConfig = {
    apiKey: "AIzaSyCT0RUrUJ5sb9E4biIHTDrE0U_jA6XwwU0",
    authDomain: "social-980f0.firebaseapp.com",
    projectId: "social-980f0",
    storageBucket: "social-980f0.appspot.com",
    messagingSenderId: "822049190420",
    appId: "1:822049190420:web:636c3222b609f19da4ad01",
    measurementId: "G-ZY6Q8GT9Q9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

const AccountScreen = ({ navigation }) => {
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedField, setSelectedField] = useState(''); // To track which field is being edited (name or username)
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailModalVisible, setEmailModalVisible] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state


    useEffect(() => {
        if (loading) {
            navigation.setOptions({ headerShown: false });
        } else {
            navigation.setOptions({ headerShown: true });
        }
    }, [loading, navigation]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserName(userData.username);
                    setEmail(userData.email);
                    setName(userData.name);
                } else {
                    console.log('No such document!');
                }
            }
        });
        return () => unsubscribe();
    }, [auth, db]);

    const handleLogout = async () => {
        setLoading(true); // Show loader
        // Wait for 3 seconds before logging out
        setTimeout(async () => {
            try {
                await signOut(auth);
                await AsyncStorage.removeItem('user');
                ToastAndroid.show("You have been logged out.", ToastAndroid.SHORT);
                // Reset the navigation stack to prevent going back to the previous screen
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Signin' }],
                });
            } catch (error) {
                Alert.alert("Logout Error", error.message);
            } finally {
                setLoading(true); // Hide loader
            }
        }, 3000);
    };

    const handleFieldPress = (field) => {
        setSelectedField(field); // 'name' or 'username'
        setNewName(field === 'name' ? name : userName);
        setModalVisible(true);
    };

    const handleUpdate = async () => {
        const fieldToUpdate = selectedField === 'name' ? { name: newName } : { username: newName };

        try {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, fieldToUpdate);

            if (selectedField === 'name') {
                setName(newName);
            } else {
                setUserName(newName);
            }

            setModalVisible(false);
            Alert.alert("Success", `${selectedField === 'name' ? 'Name' : 'Username'} updated successfully!`);
        } catch (error) {
            console.log("Error updating document: ", error);
            Alert.alert("Error", "Failed to update the information.");
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setEmail(user.email);
                setEmailVerified(user.emailVerified); // Check if the email is verified
                // You can also fetch the user's document as before
            }
        });
        return () => unsubscribe();
    }, []);

    const handleVerifyEmail = async () => {
        navigation.navigate('Verify');
        setEmailModalVisible(false);
    };

    return (
        <View style={styles.container}>
            {loading && <View style={{position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffff', // optional: add some transparency
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,}}>
            <LottieView source={require('./Imageassets/loader.json')} autoPlay loop style={{width:200,height:200}} /></View>}
            <View style={styles.container2}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title1}>Your Aura Username</Text>
                    <TouchableOpacity onPress={() => handleFieldPress('username')}>
                        <Text style={styles.title2}>@{userName}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title1}>Email</Text>
                    <TouchableOpacity onPress={() => setEmailModalVisible(true)}>
                        <Text style={styles.title2}>{email}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title1}>Name</Text>
                    <TouchableOpacity onPress={() => handleFieldPress('name')}>
                        <Text style={styles.title2}>{name}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title1}></Text>
                    
                </View>

                <View style={styles.titleContainer}>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal for editing name or username */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update {selectedField === 'name' ? 'Name' : 'Username'}</Text>
                        <TextInput
                            style={styles.input}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder={`Enter new ${selectedField}`}
                        />
                        <Button title="Update" onPress={handleUpdate} color={'#ff8b42'} />
                    </View>
                </View>
            </Modal>

            {/* Email modal */}
            <Modal visible={emailModalVisible} transparent={true} onRequestClose={() => setEmailModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalContent1}>
                            <Text style={styles.modalTitle}>Email</Text>
                        </View>

                        <Text style={{ fontWeight: 'bold', fontSize: 15, padding: 10 }}>{email}</Text>

                        <Text style={[styles.modalText, { color: emailVerified ? 'green' : 'red' }]}>
                            <Icon name={emailVerified ? 'check' : 'warning'} color={emailVerified ? 'green' : 'orange'} size={13} />  {emailVerified ? "Email Verified" : "Email Not Verified"}
                        </Text>

                        {!emailVerified && (
                            <Button title="Verify Email" onPress={handleVerifyEmail} color={'#ff8b42'} />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Loader Animation */}
        </View>
    );
};

export default AccountScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    container2: {
        backgroundColor: '#fff',
        width: '100%',
        elevation: 3,
    },
    titleContainer: {
        padding: 20,
        borderBottomWidth: 0.5,
        borderColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title1: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    title2: {
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#ff8b42',
    },
    logoutText: {
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'red',
        fontSize: 15,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalContent1: {
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderColor: '#ccc',
        marginBottom: 10,
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 10,
    },
    modalText: {
        marginVertical: 5,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        width: '100%',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
});
