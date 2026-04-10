import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { CaptureScreen } from '../screens/CaptureScreen'
import { EditorScreen } from '../screens/EditorScreen'
import { ResultScreen } from '../screens/ResultScreen'
import type { RootStackParamList } from '../types'

const Stack = createNativeStackNavigator<RootStackParamList>()

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#0F172A' },
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: '800' as const, color: '#F1F5F9', fontSize: 18 },
  headerTintColor: '#c4b5fd',
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{ title: 'Home Visualizer' }}
      />
      <Stack.Screen
        name="Editor"
        component={EditorScreen}
        options={{ title: 'Select & Describe', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: 'Before & After', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  )
}
