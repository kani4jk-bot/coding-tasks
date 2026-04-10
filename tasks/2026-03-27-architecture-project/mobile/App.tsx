import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'

import { AppNavigator } from './src/navigation/AppNavigator'

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0F172A',
    card: '#0F172A',
    border: 'rgba(255,255,255,0.08)',
    primary: '#8b5cf6',
    text: '#F1F5F9',
    notification: '#ec4899',
  },
}

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  )
}
