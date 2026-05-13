import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MainScreen } from './src/screens/MainScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { theme } from './src/theme';

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.gold,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings', headerBackTitle: 'Calculator' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
