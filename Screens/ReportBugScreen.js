import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import Material from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getFirestore, collection, addDoc, doc, getDoc } from '@firebase/firestore';
import { getAuth, onAuthStateChanged } from '@firebase/auth';

const ReportBugScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [report, setReport] = useState('');
  const [image, setImage] = useState(null);
  const {Useremail, UserName} = route.params

  const auth = getAuth();
  const db = getFirestore();



  // Function to select an image from the device
  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const selectedImage = response.assets[0];
        setImage(selectedImage.uri);
      }
    });
  };

 

  // Function to handle bug report submission
  const handleSendReport = async () => {
    if (report) {
      const user = auth.currentUser;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      if (!user) {
        Alert.alert('Not Authenticated', 'Please sign in to send a bug report.');
        return;
      }

      try {
        await addDoc(collection(db, 'reports'), {
          email: Useremail,
          report: report,
          uid: user.uid,
          name: user.displayName || userData.name, // Use display name if available
          username: userData.username || 'No Username',
          timestamp: new Date(),
          screenshot: image || 'No Media Submitted',
        });

    
        Alert.alert('Report Sent', 'Your bug report has been sent, Action will be taken soon!');
        navigation.goBack(); // Navigate back after sending the report
      } catch (error) {
        Alert.alert('Error', 'Failed to send report: ' + error.message);
        console.log('Error', 'Failed to send report: ' + error.message)
      }
    } else {
      Alert.alert('Missing Info', 'Please fill in all fields.');
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',headerTintColor:'#ffff',
      headerTitle: () => <Text style={styles.headerTitle}>Report Bug</Text>,
      headerRight: () => (
        <TouchableOpacity onPress={handleSendReport}>
          <Material name="send" size={30} color={'#ffff'} />
        </TouchableOpacity>
      )
    });
  }, [navigation, email, report]);

  return (
    <View style={styles.container}>
      <View style={styles.input}>
      <Text style={{textAlign:'center',fontWeight:'bold'}}>{Useremail}</Text>
      </View>
      <TextInput
        onChangeText={setReport}
        value={report}
        placeholder="Describe the issue"
        multiline
        numberOfLines={4}
        style={styles.reportInput}
      />
      <Text style={styles.screenshotText}>Please provide your screenshot</Text>
      <TouchableOpacity style={styles.selectButton} onPress={pickImage}>
        <Text style={styles.selectButtonText}>Select File from Device</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );
};

export default ReportBugScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#ffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    backgroundColor:'#ddd'
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    width: '100%',
    height: 100,
    textAlignVertical: 'top',
  },
  screenshotText: {
    fontSize: 16,
    marginBottom: 10,
  },
  selectButton: {
    backgroundColor: '#ff8b42',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
});
