import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { HistoryScreen } from '../screens/HistoryScreen'
import { ListenScreen } from '../screens/ListenScreen'
import { ResultScreen } from '../screens/ResultScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import type { MainTabParamList, RootStackParamList } from '../types'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tabs = createBottomTabNavigator<MainTabParamList>()

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#255F38',
        tabBarStyle: { height: 68, paddingBottom: 10, paddingTop: 8 },
      }}
    >
      <Tabs.Screen name="Listen" component={ListenScreen} options={{ tabBarIcon: () => <Text>🎙️</Text> }} />
      <Tabs.Screen name="History" component={HistoryScreen} options={{ tabBarIcon: () => <Text>🪶</Text> }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: () => <Text>⚙️</Text> }} />
    </Tabs.Navigator>
  )
}

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ title: 'Birdsong ID', headerShown: false }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Identification result' }} />
    </Stack.Navigator>
  )
}
