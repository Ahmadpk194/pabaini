import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { firebaseAuthService } from './firebaseAuth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.8:3000/api/v1';
console.log(process.env.EXPO_PUBLIC_API_URL)
const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to attach Firebase ID token
client.interceptors.request.use(async (config) => {
  try {
    let token: string | null = null;
    try {
      token = await firebaseAuthService.getIdToken();
    } catch {
      // Fallback if Firebase isn't initialized or no user logged in
      token = await SecureStore.getItemAsync('firebase_id_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type for FormData to let the browser/native client set it with correct boundary
    if (config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    // Removed request log
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return config;
});

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    console.error('API Error Config:', error.config);
    console.error('API Error Response:', error.response?.data);
    console.error('API Error Status:', error.response?.status);

    if (error.code === 'ECONNABORTED') {
      console.error('API Error: Request timeout');
    } else if (!error.response) {
      console.error('API Error: Network error - server may be down or unreachable');
      console.error('API Error: BASE_URL:', BASE_URL);
    }

    return Promise.reject(error);
  }
);

export default client;
