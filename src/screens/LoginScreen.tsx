// src/screens/LoginScreen.tsx (фрагмент — обнови handleLogin, строки ~25–40)
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { login } from '../services/authService';  // Твой API
import { AuthContext } from '../context/AuthContext';  // Добавь импорт

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuthenticated } = useContext(AuthContext)!;  // Добавь это

  const handleLogin = async () => {
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password: string) => password.length >= 6;
    if (!validateEmail(email)) {
      Alert.alert('Ошибка', 'Неверный формат email');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert('Ошибка', 'Пароль должен быть минимум 6 символов');
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });  // Твой API (сохраняет токен)
      setAuthenticated(true);  // Добавь это — переход на Home без replace!
      // Убери navigation.replace('Home'); — warning исчезнет
    } catch (error: any) {
      console.log('API Error:', error.message, error.response?.status);
      Alert.alert('Ошибка', error.message || 'Сетевая ошибка. Проверьте подключение.');
    } finally {
      setLoading(false);
    }
  };

  // Остальной JSX без изменений (LinearGradient, inputs, button)
  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={theme.gradient}>
      <View style={theme.container}>
        <View style={theme.card}>
          <Text style={theme.title}>Вход</Text>
          <Text style={theme.subtitle}>Добро пожаловать обратно!</Text>
          <TextInput
            style={theme.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={theme.input}
            placeholder="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={[theme.button, theme.buttonGradient]}>
              <Text style={theme.buttonText}>
                {loading ? <ActivityIndicator color="white" size="small" /> : 'Войти'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={theme.link}>Нет аккаунта? Зарегистрироваться</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}