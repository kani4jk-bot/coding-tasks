import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { AppNavigator } from './src/navigation/AppNavigator'

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F4F7F1',
    card: '#FFFFFF',
    border: '#DCE6D8',
    primary: '#255F38',
    text: '#102016',
    notification: '#C06B2D',
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
