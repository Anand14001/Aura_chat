import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getFirestore, collection, addDoc, onSnapshot, query, where, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import ImageView from 'react-native-image-viewing'; // Import ImageView for image viewing
import Material from 'react-native-vector-icons/MaterialIcons';

const Imgicon = require('./Imageassets/img.png');

const MessageScreen = ({ route, navigation }) => {
    const { RecieveruserName, Recieveruid, Recieverprofilephoto, Senderid } = route.params;
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [visibleImage, setVisibleImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const db = getFirestore();
    const auth = getAuth();

    const openImageViewer = (uri) => {
        setSelectedImage([{ uri }]);
        setVisibleImage(true);
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <TouchableOpacity style={{flexDirection:'row',alignItems:'center'}}>
                    <Text style={{ fontSize: 20, fontWeight: '500',color:'#fff', textAlign:'center',alignSelf:'center',left:10 }}>{RecieveruserName}</Text>
                  
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={handleMoreOptions}>
                    <Material name='more-vert' size={25} color={'#fff'} />
                </TouchableOpacity>
            ),

            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Recprof',{Recieveruid: Recieveruid, Senderid:Senderid})}>
                <Image source={{ uri: Recieverprofilephoto }} style={{width:50,height:50, borderRadius:100}} />
                </TouchableOpacity>
            )
        });
    }, [navigation, RecieveruserName]);

    const handleMoreOptions = () => {
        Alert.alert(
            "Chat Options",
            "Choose an option",
            [
                {
                    text: "Clear Chat",
                    onPress: handleClearChat,
                },
                {
                    text: "Export Chat",
                    onPress: handleExportChat,
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleClearChat = async () => {
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('receiverId', 'in', [auth.currentUser.uid, Recieveruid]),
            where('senderId', 'in', [auth.currentUser.uid, Recieveruid])
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });

        setMessages([]);
        navigation.replace('Chat');
    };

    const handleExportChat = () => {
        const exportedChat = JSON.stringify(messages);
        console.log('Exported Chat:', exportedChat);
        Alert.alert('Chat exported! Check the console for the output.');
    };

    const handleSend = async () => {
        if (message.trim()) {
            const newMessage = {
                senderId: auth.currentUser.uid,
                receiverId: Recieveruid,
                type: 'text',
                content: message,
                timestamp: serverTimestamp(),
            };

            setMessages(prevMessages => [...prevMessages, { id: Date.now().toString(), ...newMessage }]);

            try {
                await addDoc(collection(db, 'messages'), newMessage);
                setMessage('');
                setIsTyping(false);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleTextChange = (text) => {
        setMessage(text);
        setIsTyping(text.length > 0); // Update typing state based on input
    };

    const handleSendMedia = async () => {
        Alert.alert(
            "Select Media Type",
            "Choose an option to send",
            [
                {
                    text: "Photo",
                    onPress: () => {
                        let options = {
                            mediaType: 'photo',
                            includeBase64: false,
                            quality: 1,
                        };
    
                        launchImageLibrary(options, async (response) => {
                            if (response.didCancel) {
                                console.log('User cancelled picker');
                                return;
                            }
                            if (response.error) {
                                console.error('Picker Error: ', response.error);
                                return;
                            }
                            if (response.assets && response.assets.length > 0) {
                                const uri = response.assets[0].uri;
                                const newMessage = {
                                    senderId: auth.currentUser.uid,
                                    receiverId: Recieveruid,
                                    type: 'image',
                                    content: { uri },
                                    timestamp: serverTimestamp(),
                                };
                                await addDoc(collection(db, 'messages'), newMessage);
                            }
                        });
                    }
                },
                {
                    text: "Video",
                    onPress: () => {
                        let options = {
                            mediaType: 'video',
                            includeBase64: false,
                            quality: 1,
                        };
    
                        launchImageLibrary(options, async (response) => {
                            if (response.didCancel) {
                                console.log('User cancelled picker');
                                return;
                            }
                            if (response.error) {
                                console.error('Picker Error: ', response.error);
                                return;
                            }
                            if (response.assets && response.assets.length > 0) {
                                const uri = response.assets[0].uri;
                                const newMessage = {
                                    senderId: auth.currentUser.uid,
                                    receiverId: Recieveruid,
                                    type: 'video',
                                    content: { uri },
                                    timestamp: serverTimestamp(),
                                };
                                await addDoc(collection(db, 'messages'), newMessage);
                            }
                        });
                    }
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    useEffect(() => {
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('receiverId', 'in', [auth.currentUser.uid, Recieveruid]),
            where('senderId', 'in', [auth.currentUser.uid, Recieveruid])
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const newMessages = [];
            querySnapshot.forEach((doc) => {
                newMessages.push({ id: doc.id, ...doc.data() });
            });
            newMessages.sort((a, b) => {
                const aTime = a.timestamp ? (a.timestamp.seconds || 0) : 0;
                const bTime = b.timestamp ? (b.timestamp.seconds || 0) : 0;
                return aTime - bTime;
            });
            setMessages(newMessages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigation, RecieveruserName, auth.currentUser.uid, Recieveruid]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown time';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString();
    };

    const renderMessage = ({ item }) => {
        const isSent = item.senderId === auth.currentUser.uid;

        return (
            <View style={[styles.messageContainer, isSent ? styles.sentMessage : styles.receivedMessage]}>
                <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
                {item.type === 'text' && (
                    <Text style={styles.textMessage}>{item.content}</Text>
                )}
                {item.type === 'image' && (
                    <TouchableOpacity onPress={() => openImageViewer(item.content.uri)}>
                        <Image source={{ uri: item.content.uri }} style={styles.imageMessage} />
                    </TouchableOpacity>
                )}
                {item.type === 'video' && (
                    <Text style={styles.textMessage}>Video: {item.content.uri}</Text>
                    
                )}
                {/* Add more types if needed */}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={'#ff8b42'} barStyle={'light-content'}/>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
    
                {loading ? (
                    <ActivityIndicator size='large' color='gray' style={{ alignSelf: 'center', width: '100%' }} />
                ) : (
                    <FlatList
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        style={styles.messageList}
                    />
                )}
            </ScrollView>

            <View style={styles.messageBox}>
            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={handleSendMedia} style={styles.iconButton}>
                    <Image source={Imgicon} style={styles.footerIcon} />
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={handleTextChange} // Update to use the new handler
                    placeholder='Type a message...'
                    onSubmitEditing={handleSend}
                />

                <TouchableOpacity onPress={isTyping ? handleSend : null} style={styles.sendButton}>
                    {isTyping ? (
                        <Material name='send' color={'#fff'} size={30} /> // Send icon
                    ) : (
                        <Material name='mic' color={'#fff'} size={30} /> // Mic icon
                    )}
                </TouchableOpacity>
            </View>
        </View>

            {/* Image Viewer */}
            <ImageView
                images={selectedImage}
                imageIndex={0}
                visible={visibleImage}
                onRequestClose={() => setVisibleImage(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        paddingBottom: 10,
    },
    messageContainer: {
        marginVertical: 5,
        padding: 10,
        borderRadius: 10,
    },
    sentMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#d1e7dd',
    },
    receivedMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
    },
    textMessage: {
        fontSize: 16,
        color: '#000',
    },
    timestamp: {
        fontSize: 10,
        color: '#888',
        marginBottom: 5,
    },
    imageMessage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginTop: 5,
    },
    messageBox: {
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 40, // Space for icon
        marginHorizontal: 10,
        paddingVertical: 10,
    },
    iconButton: {
        position: 'absolute',
        left: 10,
        zIndex: 1,
    },
    footerIcon: {
        width: 30,
        height: 30,
    },
    sendButton: {
        backgroundColor: '#388E3C',
        borderRadius: 50,
        padding: 10,
        elevation:2,
        alignItems:'center'
    },
    profileContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f7f7f7',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom:30
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginRight: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color:'gray'
    },
    Footericon: {
        width: 30,
        height: 30,
    },
});

export default MessageScreen;