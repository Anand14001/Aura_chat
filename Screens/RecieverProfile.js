import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Switch, TouchableOpacity } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import {getMessaging, onMessage,} from 'firebase/messaging'
import Material  from 'react-native-vector-icons/Ionicons';
import Icon  from 'react-native-vector-icons/MaterialIcons';



const Recprof = ({ route, navigation }) => {
    const { Recieveruid, Senderid } = route.params;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);

    const handleBlockUnblock = async () => {
        try {
            const db = getFirestore();
            const blockListRef = doc(db, 'blockList', Senderid); // Ensure this is correct

            const blockListDoc = await getDoc(blockListRef);
            let blockedUsers = [];

            if (blockListDoc.exists()) {
                blockedUsers = blockListDoc.data().blockedUsers || [];
            } else {
                // If no document exists, create one
                await setDoc(blockListRef, { blockedUsers: [] });
            }

            const newBlockStatus = !isBlocked;

            if (newBlockStatus) {
                // Block the user
                blockedUsers.push({
                    uid: Recieveruid,
                    name: profile.name,
                    email: profile.email,
                    profilePhoto: profile.profilePhoto,
                    username: profile.username,
                });
            } else {
                // Unblock the user
                blockedUsers = blockedUsers.filter(user => user.uid !== Recieveruid);
            }

            // Update the block list document
            await setDoc(blockListRef, { blockedUsers }, { merge: true });
            setIsBlocked(newBlockStatus);
        } catch (error) {
            console.error('Error updating block status: ', error);
        }
    };


    useEffect(() => {
        const checkBlockStatus = async () => {
            try {
                const db = getFirestore();
                const blockListRef = doc(db, 'blockList', Senderid);
                const blockListDoc = await getDoc(blockListRef);

                if (blockListDoc.exists()) {
                    const blockedUsers = blockListDoc.data().blockedUsers || [];
                    const isUserBlocked = blockedUsers.some(user => user.uid === Recieveruid);
                    setIsBlocked(isUserBlocked);
                } else {
                    await setDoc(blockListRef, { blockedUsers: [] });
                    setIsBlocked(false);
                    console.log("Created block list document for user:", Senderid);
                }
            } catch (error) {
                console.error('Error checking block status: ', error);
            }
        };

        checkBlockStatus();
    }, [Senderid, Recieveruid]);

    

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTintColor:'#ffff', headerTitle:'Info', headerRight:() =>(<TouchableOpacity onPress={handleMoreOptions}><Icon name='more-vert' size={30} color={'#ffff'}/></TouchableOpacity>)
        })
    });

    const handleMoreOptions = () => {
        setOptions(prevOptions => !prevOptions);
    }

    useEffect(() => {
        const fetchProfile = async () => {
            const db = getFirestore();
            const docRef = doc(db, 'users', Recieveruid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setProfile(docSnap.data());
            } else {
                console.log('No such document!');
            }
            setLoading(false);
        };

        fetchProfile();
    }, [Recieveruid]);

   

    if (loading) {
        return <ActivityIndicator size='large' color='#000' style={{ flex: 1, justifyContent: 'center' }} />;
    }

    return (
        <View style={styles.container}>
            {profile ? (
                <>
                    <Image source={{ uri: profile.coverPhoto }} style={styles.coverPhoto} />
                    <View style={styles.profilePictureContainer}>
                    <Image source={{ uri: profile.profilePhoto }} style={styles.profileImage} />
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileEmail}>@{profile.username}</Text>
                    </View>
                    

                    <Text style={styles.profileEmail}>{profile.bio}</Text>

                    <View style={{width:'100%', borderWidth:0.5,padding:10}}>
                        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center', marginBottom:20}}>
                            <Material name='notifications-outline' size={30} color={'#000'}/>
                            <Text style={{fontWeight:'bold',fontSize:20, color:'#000'}}>Notifications</Text>
                            <Switch/>
                        </View>

                        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                            <Material name='trash-outline' size={30} color={'#000'}/>
                            <Text style={{fontWeight:'bold',fontSize:20,color:'#000',left:-120}}>Delete Chat</Text>
                        </View>
                    </View>
                </>
            ) : (
                <Text>No Profile Found</Text>
            )}
            {options&& (
            <View style={styles.OptionContainer}>
                 <TouchableOpacity style={styles.Optiontextcontainer} onPress={handleBlockUnblock}>
                        <Text style={styles.optionText}>
                            <Icon name='block' size={20} color={'red'} /> {isBlocked ? 'Unblock' : 'Block'} {profile.name}
                        </Text>
                    </TouchableOpacity>
                <TouchableOpacity style={styles.Optiontextcontainer}>
                <Icon name='thumb-down' size={20} color={'red'}/> 
                <Text style={styles.optionText}> Report {profile.name}</Text>
                </TouchableOpacity>
            </View>
            )}
        </View>
    );
};

export default Recprof;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        marginBottom:20

    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileEmail: {
        fontSize: 16,
        color: 'gray',
    },
    Coverphotocontainer: {
        backgroundColor: '#ccc',
        width: '100%',
        borderRadius: 10,
        borderWidth: 0.5,
    },
    coverPhoto: {
        backgroundColor: '#ccc',
        width: '100%',
        height: 200,
    },
    profilePictureContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        bottom:100,
        alignItems:'center'
        
    },
    OptionContainer:{
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 3,
    
        position: 'absolute',
        right: 0, // Align to the right
        zIndex: 999,
        borderTopRightRadius:0
        
    },
    optionText:{
        fontWeight:'bold',
        fontSize:20,
        color:'red',
    },
    line:{
        borderWidth:0.4,
        borderColor:'#000'
    },
    Optiontextcontainer:{
        padding:20,
        borderBottomWidth:0.5,
        borderColor:'#ccc',
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center' 
    }
});
