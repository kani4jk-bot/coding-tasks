import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { AppNavigator } from './src/navigation/AppNavigator'

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F0F2F8',
    card: '#FFFFFF',
    border: '#D8E0F0',
    primary: '#1A3C6B',
    text: '#0D1B2A',
    notification: '#C89820',
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
