import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from '@firebase/auth';
import { getFirestore, doc, setDoc } from '@firebase/firestore';
import LottieView from 'lottie-react-native';
import Material from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/FontAwesome'

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmpassword, setConfirmpassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true); // Track password match status

  const auth = getAuth();
  const db = getFirestore();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Icon name='user-plus' size={30} color={'#ffff'}/>
      ),
      headerStyle: { backgroundColor: '#ff8b42' },
      headerLeft: () => (
        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Material name='groups' size={30} color={'#ffff'} />
          <Text style={{ fontSize: 13, marginTop: -5, fontWeight: 'bold', color: '#ffff' }}>About Us</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity style={{ alignItems: 'center' }}>
         <Material name='share' size={30} color={'#ffff'}/>
         <Text style={{fontSize:13,fontWeight:'bold',color:'#ffff',marginBottom:5}}>Invite friends</Text>
        </TouchableOpacity>
      ),
    });
  });

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Input Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmpassword) {
      Alert.alert("Password Error", "Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        uid: user.uid,
      });

      Alert.alert("Account Created", "Your account has been created.");
      navigation.replace('Signin');
    } catch (error) {
      Alert.alert("Signup Error", error.message);
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmpassword(text);
    setPasswordsMatch(text === password); // Check if passwords match
  };

  return (
    <ScrollView contentContainerStyle={styles.Container}>
      <StatusBar backgroundColor={'#ff8b42'} barStyle={'light-content'}/>
      <LottieView
        source={require('./Imageassets/signup_animation.json')}
        autoPlay
        loop
        style={{ width: 200, height: 250, alignSelf: 'center' }}
      />
      <View style={styles.Container2}>
        <Text style={styles.Title}>Sign Up</Text>
        <TextInput onChangeText={setName} value={name} placeholder='Enter Name' style={styles.Input} />
        <TextInput onChangeText={setEmail} value={email} placeholder='Enter Email' style={styles.Input} keyboardType='email-address' />
        <TextInput onChangeText={setPassword} value={password} placeholder='Enter Password' style={styles.Input} secureTextEntry />
        <TextInput
          onChangeText={handleConfirmPasswordChange} // Use new function for handling confirmation password
          value={confirmpassword}
          placeholder='Confirm Password'
          style={styles.Input}
          secureTextEntry
        />
        {!passwordsMatch && (
          <Text style={styles.WarningText}>Passwords do not match.</Text> // Display warning message
        )}
        <TouchableOpacity onPress={() => navigation.replace('Signin')} style={styles.LinkContainer}>
          <Text style={styles.Link}>Already Have an Account?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.Button} onPress={handleSignup}>
          <Text style={styles.Btntext}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  Container: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 30,
    flexGrow:1
  },
  Input: {
    borderWidth: 1,
    width: '100%',
    borderRadius: 15,
    margin: 10,
    padding: 10,
  },
  Button: {
    backgroundColor: '#ff8b42',
    borderColor: '#fff',
    alignItems: 'center',
    borderRadius: 50,
    width: '35%',
    padding: 10,
    marginBottom: 10,
    elevation: 3,
    marginLeft:'70%',
    marginTop:-5
  },
  Btntext: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#fff',
  },
  Container2: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 15,
    elevation: 4,
  },
  Title: {
    fontWeight: 'bold',
    fontSize: 30,
    color: '#000',
    marginBottom: 20,
  },
  Link: {
    fontWeight: 'bold',
    fontSize: 13,
    color: 'orange',
    alignSelf: 'flex-start',
  },
  LinkContainer: {
    width: '100%', // Ensure the link container takes the full width
    left: 10,
    marginVertical: 5, // Adds spacing between the input and the link
  },
  WarningText: {
    color: 'red',
    marginBottom: 10,
    alignSelf: 'flex-start',
    fontWeight: 'bold',
  },
});
