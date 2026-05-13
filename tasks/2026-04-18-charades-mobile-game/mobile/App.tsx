import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './src/types';

import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import CategorySelectScreen from './src/screens/CategorySelectScreen';
import ReadyScreen from './src/screens/ReadyScreen';
import GameScreen from './src/screens/GameScreen';
import TurnResultScreen from './src/screens/TurnResultScreen';
import FinalScoreScreen from './src/screens/FinalScoreScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="CategorySelect" component={CategorySelectScreen} />
        <Stack.Screen name="Ready" component={ReadyScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="TurnResult" component={TurnResultScreen} />
        <Stack.Screen name="FinalScore" component={FinalScoreScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
