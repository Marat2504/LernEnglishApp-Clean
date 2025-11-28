// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddCardScreen from './src/screens/AddCardScreen';
import EditCardScreen from './src/screens/EditCardScreen';
import CardsListScreen from './src/screens/CardsListScreen';
import SpeedModeScreen from './src/screens/SpeedModeScreen';
import QuizModeScreen from './src/screens/QuizModeScreen';
import MatchingModeScreen from './src/screens/MatchingModeScreen';
import ListeningModeScreen from './src/screens/ListeningModeScreen';
import LightningModeScreen from './src/screens/LightningModeScreen';
import ChatBotScreen from './src/screens/ChatBotScreen';
import DialogsListScreen from './src/screens/DialogsListScreen';

import { AuthProvider, AuthContext } from './src/context/AuthContext';

// Импорт React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Создаём QueryClient
const queryClient = new QueryClient();

// Навигаторы
const AuthStack = createStackNavigator();
const RootStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth навигатор (Login/Register)
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Вкладки главного приложения (Home, Profile)
const MainTabs = () => (
  <Tab.Navigator
    initialRouteName="Home"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        paddingBottom: 10,
        backgroundColor: '#f8f9fa',
      },
      tabBarActiveTintColor: '#667eea',
      tabBarInactiveTintColor: '#666',
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = '';
        if (route.name === 'Home') iconName = '🏠';
        else if (route.name === 'Profile') iconName = '👤';
        else if (route.name === 'AddCard') iconName = '➕';
        else iconName = '❓';

        return (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: focused ? size + 2 : size,
                color,
                marginBottom: focused ? 4 : 0,
              }}
            >
              {iconName}
            </Text>
            {focused && (
              <View
                style={{
                  backgroundColor: color,
                  height: 3,
                  width: 20,
                  borderRadius: 2,
                }}
              />
            )}
          </View>
        );
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="AddCard" component={AddCardScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// RootStack — главный стек приложения, включает вкладки и экраны режимов изучения
const AppStack = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="AddCard" component={AddCardScreen} />
    <RootStack.Screen name="EditCard" component={EditCardScreen} />
    <RootStack.Screen name="CardsList" component={CardsListScreen} />
    <RootStack.Screen name="SpeedMode" component={SpeedModeScreen} />
    <RootStack.Screen name="QuizMode" component={QuizModeScreen} />
    <RootStack.Screen name="MatchingMode" component={MatchingModeScreen} />
    <RootStack.Screen name="ListeningMode" component={ListeningModeScreen} />
    <RootStack.Screen name="LightningMode" component={LightningModeScreen} />
    <RootStack.Screen name="ChatBot" component={ChatBotScreen} />
    <RootStack.Screen name="DialogsList" component={DialogsListScreen} />
  </RootStack.Navigator>
);

// Главный компонент App с QueryClientProvider
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <AuthContext.Consumer>
        {(authContext) => {
          if (!authContext) {
            return null;
          }
          const { isAuthenticated, loading } = authContext;
          if (loading) {
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
              </View>
            );
          }

          return (
            <NavigationContainer>
              {isAuthenticated ? <AppStack /> : <AuthNavigator />}
            </NavigationContainer>
          );
        }}
      </AuthContext.Consumer>
      </AuthProvider>
    </QueryClientProvider>
  );
}