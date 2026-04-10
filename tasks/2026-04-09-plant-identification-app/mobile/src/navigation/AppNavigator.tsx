import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { CaptureScreen } from '../screens/CaptureScreen'
import { ResultScreen } from '../screens/ResultScreen'
import type { RootStackParamList } from '../types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          title: 'Plant ID',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '800', color: '#111827', fontSize: 18 },
          headerTintColor: '#2d6a4f',
        }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          title: 'Identification',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
          headerTintColor: '#2d6a4f',
        }}
      />
    </Stack.Navigator>
  )
}
