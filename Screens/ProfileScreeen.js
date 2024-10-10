import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, Modal, Alert, ActivityIndicator,ToastAndroid } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, query, where, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import LottieView from 'lottie-react-native';

const Logo = require('./Imageassets/Aura_txt.png')



const defaultProfilePictureUrl = require('./Imageassets/profile.png'); // Ensure this path is correct
const defaultCoverPictureUrl = require('./Imageassets/cover.jpg');

const db = getFirestore();
const auth = getAuth();

const ProfileScreen = ({ navigation, route }) => {
    const { Profilename, Profileemail, Profileuid } = route.params;
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [ProfilePhoto, setProfilePhoto] = useState(null);
    const [bio, setBio] = useState('');
    const [bioSet, setBioSet] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [usernameModalVisible, setUsernameModalVisible] = useState(false);
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const viewShotRef = useRef();
    const [loading, setLoading] = useState(false)

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            setTimeout(async() => {
                                
                             const user = auth.currentUser;
                            if (user) {
                                // Delete user data from Firestore
                                await updateDoc(doc(db, 'users', user.uid), { deleted: true }); // Optional flag for soft delete
                                await deleteDoc(doc(db, 'users', user.uid)); // Delete document
    
                                // Delete Firebase Authentication user account
                                await user.delete();
    
                                ToastAndroid.show("Account deleted successfully.", ToastAndroid.SHORT);
                                
                                // Log out user and navigate to Signin screen
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Signin' }],
                                });
                            }
                            setLoading(false);
                        }, 1000);
                        }  catch (error) {
                            if (error.code === 'auth/requires-recent-login') {
                                Alert.alert("Re-authentication Required", "Please log in again to delete your account.");
                            } else {
                                Alert.alert("Error", error.message);
                            }
                        }
                    },
                }
            ]
        );
    };
    

    const handleLogout = async () => {
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
        }
    };

    React.useLayoutEffect(() => {
        if (loading) {
            navigation.setOptions({ headerShown: false });
        }else{
        navigation.setOptions({
            headerTitle:'Profile', headerRight:(() => (<TouchableOpacity onPress={handleShare}><Icon name='share-social' color={'#ffff'} size={20}/></TouchableOpacity>))
        })}
    });

    const handleShare = async () => {
        if (!username) {
            Alert.alert('Username Missing', 'Please set your username before sharing.');
            return;
        }

        // Capture the ViewShot
        viewShotRef.current.capture().then(uri => {
            const shareOptions = {
                title: 'Share Profile',
                message: `Hey! I'm on Aura - my username is "${username}".`,
                url: uri,
            };
            Share.open(shareOptions).catch(err => console.log('Error sharing:', err));
        });
    };


    useEffect(() => {
        const fetchUser = async () => {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
                setUser(userDoc.data());
                setBio(userDoc.data().bio || '');
                setBioSet(!!userDoc.data().bio);
                setCoverPhoto(userDoc.data().coverPhoto || null);
                setProfilePhoto(userDoc.data().profilePhoto || null);
                setUsername(userDoc.data().username || '');

                if (!userDoc.data().username) {
                    setUsernameModalVisible(true); // Trigger popup if username is not set
                }
            }
        };

        fetchUser();
    }, []);

    const checkUsernameAvailability = async (enteredUsername) => {
        const q = query(collection(db, 'users'), where('username', '==', enteredUsername));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty; // Returns true if no user has this username
    };

    const saveUsername = async (enteredUsername) => {
        const isAvailable = await checkUsernameAvailability(enteredUsername);
        if (isAvailable) {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { username: enteredUsername });
            setUsername(enteredUsername);
            setUsernameModalVisible(false);
        } else {
            Alert.alert('Username Taken', 'This username is already taken. Please choose another one.');
        }
    };

    const handleUsernameSubmit = async () => {
        if (!username) {
            Alert.alert('Invalid Input', 'Please enter a valid username.');
            return;
        }
        saveUsername(username);
    };

    const handleCancelUsername = () => {
        setUsernameModalVisible(false);
        navigation.goBack(); // Close profile screen if user cancels
    };

    const handleBioChange = (newBio) => {
        setBio(newBio);
    };

    const saveBio = async () => {
        if (bio !== user.bio) {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { bio });
            setBioSet(true);
        }
        setModalVisible(false); // Close the modal after saving
    };

    const selectCoverPhoto = () => {
        launchImageLibrary({ mediaType: 'photo' }, async (response) => {
            if (response.didCancel || response.error) {
                console.log('User cancelled image picker or an error occurred');
            } else {
                const uri = response.assets[0].uri;
                setCoverPhoto(uri);
                try {
                    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                        coverPhoto: uri,
                    });
                    await AsyncStorage.setItem('coverPhoto', uri);
                    ToastAndroid.show('Cover photo updated successfully',ToastAndroid.SHORT);
                } catch (error) {
                    console.log('Error updating cover photo:', error.message);
                }
            }
        });
    };

    const selectProfilePhoto = () => {
        launchImageLibrary({ mediaType: 'photo' }, async (response) => {
            if (response.didCancel || response.error) {
                console.log('User cancelled image picker or an error occurred');
            } else {
                const uri = response.assets[0].uri;
                setProfilePhoto(uri);

                try {
                    await updateDoc(doc(db, 'users', auth.currentUser.uid), { profilePhoto: uri });
                    ToastAndroid.show('Profile photo updated successfully',ToastAndroid.SHORT);
                    console.log('Profile photo updated successfully');
                } catch (error) {
                    console.log('Error updating profile photo:', error.message);
                }
            }
        });
    };

    console.log('Profile UID:', Profileuid)
    if (!user) return <ActivityIndicator size={'large'} color={'#ff8b42'} style={{backgroundColor:'#ffff', flex:1,alignItems:'center',justifyContent:'center'}}/>;

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
            <LottieView source={require('./Imageassets/delete_account.json')} autoPlay loop style={{width:200,height:200}} /></View>}
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9, }} style={styles.hiddenViewShot} >
                <View style={styles.shareableContent}>
                    <View style={{alignItems:'center'}}>
                        <Image source={ProfilePhoto ? { uri: ProfilePhoto } : defaultProfilePictureUrl} style={styles.profilePicture} />
                    </View>
                    <Text style={{fontWeight:'bold',textAlign:'center',marginBottom:10,top:10,color:'#000'}}>Add me on Aura Chat!</Text>
                    <Text style={{textAlign:'center',fontWeight:'bold'}}>@{username}</Text>
            
                </View>
            </ViewShot>


            <TouchableOpacity onPress={selectCoverPhoto} style={styles.Coverphotocontainer}>
                <Image source={coverPhoto ? { uri: coverPhoto } : defaultCoverPictureUrl} style={styles.coverPhoto} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profilePictureContainer} onPress={selectProfilePhoto}>
                <Image source={ProfilePhoto ? { uri: ProfilePhoto } : defaultProfilePictureUrl} style={styles.profilePicture} />
            </TouchableOpacity>
           
            <Text style={styles.name}>{Profilename || 'No Name'}</Text>
            {username ? (
                <View style={{flexDirection:'row',alignItems:'center'}}>
                <Text style={styles.username}>@{username}</Text>
                </View>
            ) : (<Text>Username haven't set yet</Text>)}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',marginBottom:20 }}>
                {bioSet ? (
                    <Text style={{ fontWeight: 'bold', fontStyle: 'italic' }}>{bio}</Text>
                ) : (
                    <Text style={{ fontWeight: 'bold', fontStyle: 'italic', color: 'gray' }}>'Describe yourself'</Text>
                )}
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Icon name='create-outline' size={20} color={'#ff8b42'} style={{ left: 10 }} />
                </TouchableOpacity>
            </View>
            
            <View style={{borderWidth:0.4,width:'100%',borderColor:'#ccc'}}/>

            {/* Modal for Editing Bio */}
            <Modal animationType='fade' transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Bio</Text>
                        <TextInput style={styles.bioInput} value={bio} onChangeText={handleBioChange} placeholder="Add a bio..." multiline />
                        <Button title="Save" onPress={saveBio} />
                    </View>
                </View>
            </Modal>

            {/* Modal for Setting Username */}
            <Modal animationType='fade' transparent={true} visible={usernameModalVisible} onRequestClose={handleCancelUsername}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Set Username</Text>
                        <TextInput
                            style={styles.bioInput}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter your username"
                            autoCapitalize="none"
                        />
                        <Button title="Submit" onPress={handleUsernameSubmit} />
                    </View>
                </View>
            </Modal>

            {/* QR Code Modal */}
            <Modal
                animationType='fade'
                transparent={true}
                visible={qrModalVisible}
                onRequestClose={() => setQrModalVisible(false)} // Close modal on request
            >
                <View style={styles.QrmodalContainer}>
                    <View style={styles.QrmodalContent}>
                        <Text style={styles.QRmodalTitle}>Your Aura QR Code</Text>
                        <View style={{backgroundColor:'#ffff',borderRadius:10,padding:10,elevation:2,alignItems:'flex-end'}}>
                        <Text style={{fontWeight:'bold',marginBottom:10}}>{Profileuid}</Text>
                        <TouchableOpacity onPress={() => {
                    Clipboard.setString(Profileuid); // Copy Aura code to clipboard
                    ToastAndroid.show('Aura code has been copied to clipboard.', ToastAndroid.SHORT);
                }}>
                        <Icon name='copy-outline' size={15} color={'#ff8b42'}/>
                        </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                            <Text style={styles.QrcloseButton}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.optionsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Account')} style={styles.optionRow}>
                    <Icon name='person-outline' size={20} style={styles.optionIcon}/>
                    <Text style={styles.optionText}>Your Account</Text>
                </TouchableOpacity>

                <TouchableOpacity  style={styles.optionRow} onPress={() => setQrModalVisible(true)} >
                    <Icon name='qr-code-outline' size={20} style={styles.optionIcon}/>
                    <Text style={styles.optionText}>Your Aura Code</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Privacy',{userId:Profileuid})}>
                    <Icon name='lock-closed-outline' size={20} style={styles.optionIcon}/>
                    <Text style={styles.optionText}>Privacy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow}>
                    <Icon name='people-outline' size={20} style={styles.optionIcon}/>
                    <Text style={styles.optionText}>Invite a Friend</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={handleDeleteAccount}>
                    <Icon name='trash-outline' size={20} style={styles.optionIcon}/>
                    <Text style={styles.optionText}>Delete Account</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    coverPhoto: {
        backgroundColor: '#ccc',
        width: '100%',
        height: 200,
    },
    Coverphotocontainer: {
        backgroundColor: '#ccc',
        width: '100%',
        borderRadius: 10,

    },
    profilePictureContainer: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 150,
        borderWidth: 1,
        marginTop:-50
        
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 150,
        borderWidth: 1,
    },
    name: {
        fontSize: 24,
        fontWeight:'bold'
    },
    username: {
        fontSize: 15,
        color: 'gray',
        fontWeight:'600',
        marginBottom:20
    },
    bioInput: {
        borderColor: 'gray',
        borderWidth: 1,
        width: '100%',
        height: 60,
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
    },
    optionsContainer: {
        marginTop: 20,
        width: '100%',
        padding:10,
        alignItems:'center'
    },
    optionText: {
        fontSize: 18,
        marginVertical: 5,
        textAlign:'center',
        fontWeight:'bold'
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 10,
    },
    optionsContainer: {
        marginTop: 20,
        width: '100%',
        paddingHorizontal: 20,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderColor: '#ccc',
        
    },
    optionIcon: {
        marginRight: 15,
    },
    optionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    QrmodalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    QrmodalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    QRmodalTitle: {
        fontSize: 20,
        marginBottom: 20,
        fontWeight:'bold',
        color:'#000'
    },
    QrcloseButton: {
        marginTop: 20,
        fontSize: 16,
        color: '#ff8b42',
        fontWeight: 'bold',
        
    },
    hiddenViewShot: {
        position:'absolute',
        top:9999,     // This will hide it off-screen
        width: 300,  // Adjust the width and height as per your requirement
        height: 300,
        backgroundColor:'#ffff',
        alignItems:'center',
        justifyContent:'center'
    },
});

export default ProfileScreen;
