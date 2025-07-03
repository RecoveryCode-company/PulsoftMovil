import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './screens/WelcomeScreen.js';
import LoginScreen from './screens/LoginScreen.js';
import RegisterScreen from './screens/RegisterScreen.js';
import Notes from './screens/Notes.js';
import Analytic from './screens/analytic.js';
import Dashboards from './screens/dashboards.js';
import PatientTokenScreen from './screens/PatientTokenScreen.js';
import CaregiverLink from './screens/CaregiverLinkScreen.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WelcomeScreen">
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="Notes" component={Notes} />
        <Stack.Screen name="Analytic" component={Analytic} />
        <Stack.Screen name="Dashboards" component={Dashboards} />
        <Stack.Screen name="PatientToken" component={PatientTokenScreen} />
        <Stack.Screen name="CaregiverLink" component={CaregiverLink} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}