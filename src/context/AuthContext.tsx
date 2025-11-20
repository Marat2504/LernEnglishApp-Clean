import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../services/authService';  // Импорт твоего API-logout
import api from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  setAuthenticated: (value: boolean) => void;
  user: any | null;
  logout: () => Promise<void>;  // Добавь это — функция для выхода
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser  ] = useState<any | null>(null);  // Для хранения user из API

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          // Проверить валидность токена путем тестового запроса к защищенному эндпоинту
          await api.get('/tags'); // Легкий запрос для проверки токена
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Token invalid or auth check error:', error);
        // Если токен невалиден, удалить его и сбросить аутентификацию
        await AsyncStorage.removeItem('accessToken');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();  // Вызов твоего API (удаляет токен из AsyncStorage)
      setIsAuthenticated(false);  // Обновляем состояние — App.tsx переключит на Login
      console.log('Logout успешен: переход на LoginScreen');
    } catch (error) {
      console.error('Ошибка logout:', error);
      // Принудительно сбрасываем, даже если API не сработал
      await AsyncStorage.removeItem('accessToken');
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      loading, 
      setAuthenticated: setIsAuthenticated, 
      user,
      logout: handleLogout  // Добавь это — теперь доступно в экранах
    }}>
      {children}
    </AuthContext.Provider>
  );
};