// src/screens/RegisterScreen.tsx (полный файл — замени свой)
import React, { useState, useContext } from 'react';  // Добавлен useContext и useState
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { register } from '../services/authService';  // Твой API
import { AuthContext } from '../context/AuthContext';  // Импорт Context

export default function RegisterScreen({ navigation }: any) {
  // Полные состояния (states) — добавь их, если их не было
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');  // Опционально
  const [loading, setLoading] = useState(false);  // Для спиннера и disabled

  // Получаем setAuthenticated из Context
  const { setAuthenticated } = useContext(AuthContext)!;

  // Функция регистрации с валидацией
  const handleRegister = async () => {
    // Валидация (добавь свою, если есть)
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password: string) => password.length >= 6;

    if (!email || !password) {
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Ошибка', 'Неверный формат email');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert('Ошибка', 'Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);  // Включаем спиннер
    try {
      // Вызов API (твой register сохраняет токен в AsyncStorage)
      await register({ email, password, username: username || undefined });
      
      // Обновляем состояние — автоматический переход на HomeScreen (MainNavigator)
      setAuthenticated(true);
      
      Alert.alert('Успех', 'Регистрация завершена! Добро пожаловать.');
      // Нет navigation.replace — Context сделает переход без warning'ов
    } catch (error: any) {
      console.log('API Error:', error.message, error.response?.status);
      Alert.alert(
        'Ошибка регистрации', 
        error.message || 'Сетевая ошибка. Проверьте подключение и попробуйте снова.'
      );
    } finally {
      setLoading(false);  // Выключаем спиннер
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={theme.gradient}>
      <View style={theme.container}>
        <View style={theme.card}>
          <Text style={theme.title}>Регистрация</Text>
          <Text style={theme.subtitle}>Создайте аккаунт для начала обучения</Text>
          
          {/* Поле Email */}
          <TextInput
            style={theme.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          {/* Поле Username (опционально) */}
          <TextInput
            style={theme.input}
            placeholder="Имя пользователя"
            value={username}
            onChangeText={setUsername}
          />
          
          {/* Поле Password */}
          <TextInput
            style={theme.input}
            placeholder="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {/* Кнопка регистрации */}
          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <LinearGradient 
              colors={['#667eea', '#764ba2']} 
              style={[theme.button, theme.buttonGradient, loading && { opacity: 0.7 }]}
            >
              <Text style={theme.buttonText}>
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  'Зарегистрироваться'  // Исправил с "Войти"
                )}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Ссылка на Login */}
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={theme.link}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}