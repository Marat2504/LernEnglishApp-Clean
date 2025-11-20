// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://unsuperseded-nonverbalized-deja.ngrok-free.dev/api'; // Замените на ваш backend URL

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Для веб-версии: если CORS блокируется, добавьте на бэкенд заголовок 'Access-Control-Allow-Origin': '*'
  // Или настройте ngrok с --host-header=rewrite
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  console.log('API Request Token:', token ? 'present' : 'missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;