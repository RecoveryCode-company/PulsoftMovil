import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen.js';
import RegisterScreen from './screens/RegisterScreen.js';
import Notes from './screens/Notes.js';
import Analytic from './screens/analytic.js';
import Dashboards from './screens/dashboards.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Notes" component={Notes} />
        <Stack.Screen name="Analytic" component={Analytic} />
        <Stack.Screen name="Dashboards" component={Dashboards} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}