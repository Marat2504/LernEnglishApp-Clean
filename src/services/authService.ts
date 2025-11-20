import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// NGROK URL (замени на свой: unsuperseded-nonverbalized-deja.ngrok-free.dev)
let API_BASE: string = 'https://unsuperseded-nonverbalized-deja.ngrok-free.dev/api';

console.log('Platform.OS:', Platform.OS);
console.log('API_BASE set to:', API_BASE);  // Лог: https://...ngrok-free.dev/api

const api = axios.create({ 
  baseURL: API_BASE, 
  timeout: 30000  // 30 сек для ngrok
});

// Interceptor: Логи запросов
api.interceptors.request.use(async (config) => {
  const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
  console.log('🚀 API Request:', {
    method: config.method,
    url: fullUrl,  // Теперь https://...ngrok-free.dev/api/auth/login
    data: config.data,
    headers: config.headers
  });
  
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Обработка ответов/ошибок
api.interceptors.response.use(
  (response) => {
    const fullUrl = `${response.config?.baseURL || ''}${response.config?.url || ''}`;
    console.log('✅ API Response:', response.status, fullUrl, response.data);
    return response;
  },
  async (error) => {
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    console.error('❌ API Error Details:', {
      message: error.message,
      code: error.code,
      url: fullUrl,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      Alert.alert('Сетевая ошибка', `Проблема с ngrok: ${fullUrl}\nПроверьте VPN и туннель.`);
    } else if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      Alert.alert('Сессия истекла', 'Перелогиньтесь');
    } else if (error.response?.status >= 400) {
      Alert.alert('Ошибка', error.response.data?.message || 'Неверные данные');
    }
    
    return Promise.reject(error);
  }
);

// Функции (без изменений)
export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; username: string };
}

export const register = async (data: { email: string; password: string; username?: string }): Promise<AuthResponse> => {
  console.log('🔄 Starting register with data:', data);
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.accessToken) {
      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      console.log('✅ Register success, token saved');
    }
    return response.data;
  } catch (error) {
    console.error('💥 Register failed:', error);
    throw error;
  }
};

export const login = async (data: { email: string; password: string }): Promise<AuthResponse> => {
  console.log('🔄 Starting login with data:', data);
  try {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.accessToken) {
      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      console.log('✅ Login success, token saved');
    }
    return response.data;
  } catch (error) {
    console.error('💥 Login failed:', error);
    throw error;
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem('accessToken');
  console.log('🔓 Logged out');
};