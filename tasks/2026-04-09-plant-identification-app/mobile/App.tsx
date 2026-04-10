import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'

import { AppNavigator } from './src/navigation/AppNavigator'

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F0F8F2',
    card: '#FFFFFF',
    border: '#D0E8D8',
    primary: '#2d6a4f',
    text: '#111827',
    notification: '#52b788',
  },
}

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="dark" />
      <AppNavigator />
    </NavigationContainer>
  )
}
