import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Carga de fuentes
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';

import WelcomeScreen from './screens/WelcomeScreen.js';
import LoginScreen from './screens/LoginScreen.js';
import RegisterScreen from './screens/regisyteristerScreen.js';
import Notes from './screens/Notes.js';
import Analytic from './screens/analytic.js';
import Dashboards from './screens/dashboards.js';
import PatientTokenScreen from './screens/PatientTokenScreen.js';
import CaregiverLink from './screens/CaregiverLinkScreen.js';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const loadFonts = () => {
    return Font.loadAsync({
      'Lufga-Regular': require('./assets/fonts/Lufga-Regular.ttf'),
      'Lufga-Bold': require('./assets/fonts/Lufga-Bold.ttf'),
      'Lufga-Medium': require('./assets/fonts/Lufga-Medium.ttf'),
      'Lufga-Light': require('./assets/fonts/Lufga-Light.ttf'),
      // Agrega aquí más variantes si las tienes
    });
  };

  if (!fontsLoaded) {
    return (
      <AppLoading
        startAsync={loadFonts}
        onFinish={() => setFontsLoaded(true)}
        onError={console.warn}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Notes" component={Notes} />
        <Stack.Screen name="Analytic" component={Analytic} />
        <Stack.Screen name="Dashboards" component={Dashboards} />
        <Stack.Screen name="PatientToken" component={PatientTokenScreen} />
        <Stack.Screen name="CaregiverLink" component={CaregiverLink} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}