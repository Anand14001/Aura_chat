import { StatusBar, StyleSheet, View, ActivityIndicator, Image, Text, BackHandler, ToastAndroid } from 'react-native';
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './Screens/HomeScreen';
import LoginScreen from './Screens/LoginScreen';
import SignupScreen from './Screens/SignupScreen';
import { initializeApp } from '@firebase/app';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from '@firebase/auth';
import ChatScreen from './Screens/ChatScreen';
import UserListScreen from './Screens/UserListScreen';
import VerifyEmailPage from './Screens/VerifyEmailPage';
import MessageScreen from './Screens/MessageScreen';
import ProfileScreen from './Screens/ProfileScreeen';
import SearchScreen from './Screens/SeaechScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './Screens/SplashScreen';
import Material from 'react-native-vector-icons/MaterialIcons'
import ReportBugScreen from './Screens/ReportBugScreen';
import RecieverProfile from './Screens/RecieverProfile';
import AccountScreen from './Screens/AccountScreen';
import PrivacyScreen from './Screens/PrivacyScreen';
const Aura_logo = require('./imgfiles/Aura.png')

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
const Stack = createNativeStackNavigator();

export default function App() {
  const auth = getAuth(app); 
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [backPressedOnce, setBackPressedOnce] = useState(false);
  const [backPressCount, setBackPressCount] = useState(0);

  useEffect(() => {
    const backAction = () => {
      if (backPressCount < 1) {
        ToastAndroid.show('Press again to exit AllBills', ToastAndroid.SHORT);
        setBackPressCount(backPressCount + 1);
        return true; // Prevent default back action
      } else {
        BackHandler.exitApp(); // Exit the app on double back press
        return false;
      }
    };
  
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
  
    return () => backHandler.remove();
  }, [backPressCount]);

  useEffect(() => {
    const checkUserAuth = async () => {
      setLoading(true); // Start loading while checking user
      try {
        // Check AsyncStorage for saved user data
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser)); // Set the user from AsyncStorage if available
        }
      } catch (e) {
        console.error('Failed to load user from storage', e);
      }

      setLoading(false); // Done checking user in AsyncStorage
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // Start loading when auth state changes
      if (currentUser) {
        const userDetails = {
          email: currentUser.email,
          displayName: currentUser.displayName,
          uid: currentUser.uid
        };
        await AsyncStorage.setItem('user', JSON.stringify(userDetails)); // Save user data to AsyncStorage
        setUser(userDetails); // Set the user in state
      } else {
        await AsyncStorage.removeItem('user'); // Clear AsyncStorage if not authenticated
        setUser(null); // No user is logged in
      }
      setLoading(false); // Done processing auth state change
    });

    // Check AsyncStorage for user details on app startup
    checkUserAuth();

    // Cleanup the onAuthStateChanged listener on unmount
    return () => unsubscribe();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen initially
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Show a loading spinner while checking authentication state
  return loading ? (
    <View style={styles.Container}>
      <ActivityIndicator size="large" color="#ff8b42" />
    </View>
  ) : (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? 'Chat' : 'Home'}>
        <Stack.Screen name='Home' component={HomeScreen} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text style={{fontWeight:'bold',fontSize:30,color:'#ffff'}}>Welcome!</Text>), headerStyle:{backgroundColor:'#ff8b42'} }}  />
        <Stack.Screen name='Signin' component={LoginScreen} options={{ headerTitleAlign: 'center', }} />
        <Stack.Screen name='Signup' component={SignupScreen} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text style={{fontWeight:'bold',fontSize:20,color:'#ffff'}}> </Text>) }}  />
        <Stack.Screen name='Chat' component={ChatScreen} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text style={{fontWeight:'bold',fontSize:20,color:'#ffff'}}>Aura Chat</Text>),headerStyle:{backgroundColor:'#ff8b42'} }} />
        <Stack.Screen name='Verify' component={VerifyEmailPage} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text></Text>), headerStyle:{backgroundColor:'#ff8b42'},headerTintColor:'#ffff' }}  />
        <Stack.Screen name='Message' component={MessageScreen} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text></Text>), headerStyle:{backgroundColor:'#ff8b42'},headerTintColor:'#ffff' }}  />
        <Stack.Screen name='Profile' component={ProfileScreen} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text></Text>), headerStyle:{backgroundColor:'#ff8b42'}, headerTintColor:'#ffff' }}  />
        <Stack.Screen name='Search' component={SearchScreen} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text></Text>), headerStyle:{backgroundColor:'#ff8b42'}, headerTintColor:'#ffff' }}  />
        <Stack.Screen name='Report' component={ReportBugScreen} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text></Text>), headerStyle:{backgroundColor:'#ff8b42'} }}/>
        <Stack.Screen name='Recprof' component={RecieverProfile} options={{ headerTitleAlign: 'center', headerTitle : () =>(<Text></Text>), headerStyle:{backgroundColor:'#ff8b42'} }}/>
        <Stack.Screen name='Account' component={AccountScreen} options={{ headerTitleAlign: 'center', headerTitle : 'Your Account', headerStyle:{backgroundColor:'#ff8b42'}, headerTintColor:'#ffff' }} />
        <Stack.Screen name='Privacy' component={PrivacyScreen} options={{ headerTitleAlign: 'center', headerTitle : 'Privacy', headerStyle:{backgroundColor:'#ff8b42'}, headerTintColor:'#ffff' }}/>
      </Stack.Navigator>
  
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  }
});