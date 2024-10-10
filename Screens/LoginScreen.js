import { Alert, StatusBar, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import Material from 'react-native-vector-icons/MaterialIcons'
import Icon from 'react-native-vector-icons/Ionicons'

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null); // Store user object

  const auth = getAuth();

  React.useLayoutEffect(() => {
    navigation.setOptions({headerTitleAlign: 'center', headerTitle : () =>( 
      <Icon name='person-circle' size={40} color={'#ffff'}/>
      ), 
      headerStyle:{backgroundColor:'#ff8b42'}, 
      headerLeft: ()=> (
      <TouchableOpacity style={{alignItems:'center'}}>
      <Material name='groups' size={30} color={'#ffff'}/>
      <Text style={{fontSize:13,marginTop:-5, fontWeight:'bold',color:'#ffff'}}>About Us</Text>
      </TouchableOpacity>),

       headerRight: () => (
       <TouchableOpacity style={{alignItems:'center'}} >
       <Material name='share' size={30} color={'#ffff'}/>
       <Text style={{fontSize:13,fontWeight:'bold',color:'#ffff',marginBottom:5}}>Invite friends</Text>
       </TouchableOpacity>)})
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await AsyncStorage.setItem('userToken', user.uid); // Store user token or ID
        navigation.replace('Chat'); // Navigate to Chat screen
      } else {
        setUser(null);
        await AsyncStorage.removeItem('userToken'); // Clear storage
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const HandleSignin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDetails = {
        email: user.email,
        displayName: user.displayName,
        uid: user.uid
      };

      // Save user data to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userDetails));
      ToastAndroid.show("You have been logged in.",ToastAndroid.SHORT);
      navigation.replace('Chat');
    } catch (error) {
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <View style={styles.Container}>
      
      <LottieView 
  source={require('./Imageassets/login_animation.json')} 
  autoPlay 
  loop 
  style={{ width: 250, height: 250, alignSelf:'center' }} 
/>
      <View style={styles.Container2}>
        <Text style={styles.Title}>Sign In</Text>
        <TextInput 
          onChangeText={setEmail} 
          placeholder='Enter Email' 
          style={styles.Input} 
        />
        <TextInput 
          onChangeText={setPassword} 
          placeholder='Enter Password' 
          style={styles.Input} 
          secureTextEntry 
        />
        <View style={styles.LinkContainer}>
        <TouchableOpacity>
          <Text style={styles.Link}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
        <View style={styles.LinkContainer}>
        <TouchableOpacity onPress={() => navigation.replace('Signup')}>
          <Text style={styles.Link}>Don't Have an Account?</Text>
        </TouchableOpacity>
      </View>
      <View style={{alignItems:'flex-end'}}>
        <TouchableOpacity style={styles.Button} onPress={HandleSignin}>
          <Text style={styles.Btntext}>Sign in</Text>
        </TouchableOpacity>
        </View>
        <StatusBar backgroundColor={'#ff8b42'} barStyle={'light-content'}/>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 30
  },
  Input: {
    borderWidth: 1,
    width: '100%',
    borderRadius: 15,
    margin: 10,
  },
  Button: {
    backgroundColor: '#ff8b42',
    borderColor: '#fff',
    alignItems: 'center',
    borderRadius: 50,
    width: '30%',
    padding: 10,
    marginBottom: 10,
    elevation: 3,
    marginLeft:'70%',
    marginTop:-10
   
  },
  Btntext: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#fff'
  },
  Container2: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 15,
    elevation: 4
  },
  Title: {
    fontWeight: 'bold',
    fontSize: 30,
    color: '#000',
    marginBottom: 20
  },
  LinkContainer: {
    width: '100%', // Ensure the link container takes the full width
    left:10,
    marginVertical: 5, // Adds spacing between the input and the link
  },
  Link: {
    fontWeight: '600',
    fontSize: 13,
    color: 'orange',
    alignSelf:'flex-start'
  }
});