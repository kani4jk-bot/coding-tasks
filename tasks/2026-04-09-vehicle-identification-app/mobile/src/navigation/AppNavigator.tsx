import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { CaptureScreen } from '../screens/CaptureScreen'
import { HistoryScreen } from '../screens/HistoryScreen'
import { ResultScreen } from '../screens/ResultScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import type { MainTabParamList, RootStackParamList } from '../types'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tabs = createBottomTabNavigator<MainTabParamList>()

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1A3C6B',
        tabBarInactiveTintColor: '#9AAABF',
        tabBarStyle: {
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E4EAF5',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', color: '#0D1B2A', fontSize: 18 },
        headerTintColor: '#1A3C6B',
      }}
    >
      <Tabs.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          title: 'Vehicle ID',
          tabBarLabel: 'Capture',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📷</Text>,
        }}
      />
      <Tabs.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🚗</Text>,
        }}
      />
      <Tabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚙️</Text>,
        }}
      />
    </Tabs.Navigator>
  )
}

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          title: 'Identification',
          headerBackTitle: 'Back',
          headerTintColor: '#1A3C6B',
          headerTitleStyle: { fontWeight: '700', color: '#0D1B2A' },
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}
