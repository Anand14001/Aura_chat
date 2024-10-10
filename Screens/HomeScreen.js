import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import LottieView from 'lottie-react-native'

const HomeScreen = ({navigation}) => {
  useEffect(()=> {
    navigation.setOptions({ headerShown: false })}
  )
  return (
    <View style={styles.Container}>
      <StatusBar backgroundColor={'#fff'} barStyle={'dark-content'}/>
      <LottieView source={require('./Imageassets/welcome_animaion.json')}  
        autoPlay 
        loop 
        style={{ width: 250, height: 250, alignSelf:'center' }} />

      <Text style={styles.hello}>Hello</Text>
      <View style={{ alignItems:'center', width:'80%',marginBottom:30}}>
      <Text style={{textAlign:'center'}}>Welcome to <Text style={{ fontWeight: 'bold', color: '#ff8b42', }}>Aura Chat</Text>, where meaningful connections are just a message away! </Text>
      </View>

      <TouchableOpacity style={styles.login} onPress={() => navigation.replace('Signin')}>
        <Text style={{fontWeight:'bold', fontSize:20, color:'#ffff'}}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signup} onPress={() => navigation.replace('Signup')}>
        <Text style={{color:'#ff8b42', fontWeight:'bold', fontSize:20}}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  Container:{
    flex:1,
    backgroundColor:'#ffff',
    alignItems:'center',
    justifyContent:'center'
  },
  hello:{
    fontWeight:'bold',
    fontSize:30,
    color:'#000',
    textAlign:'center'
  },
  login:{
    backgroundColor:'#ff8b42',
    padding:10,
    borderRadius:20, 
    margin:10,
    width:'60%',
    alignItems:'center'
  },
  signup:{
    width:'60%',
    alignItems:'center',
    borderWidth:2,
    borderColor:'#ff8b42',
    padding:10,
    borderRadius:20,
    margin:10,
  }
})