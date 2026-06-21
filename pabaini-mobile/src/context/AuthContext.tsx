import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { User } from '../types';
import { login as loginApi } from '../api/auth';
import { getMe, updateMe as updateMeApi, uploadAvatar as uploadAvatarApi, registerDeviceToken as registerDeviceTokenApi, removeDeviceToken as removeDeviceTokenApi } from '../api/users';
import { firebaseAuthService } from '../api/firebaseAuth';
import { useSportsStore } from '../store/sports/sportsStore';
import { useTeamsStore } from '../store/sports/teamsStore';
import { useCricketOnboardingStore } from '../store/sports/cricketOnboardingStore';
import { useNotificationsStore } from '../store/notificationsStore';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  login: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  setGuest: () => void;
  updateProfile: (
    name: string,
    isDiaspora: boolean,
    village: string,
    avatarUri?: string | null,
    phone?: string,
    email?: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    loadAuthState();
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseAuthService.getIdToken();
          const response = await loginApi(idToken);
          const user = { ...response.data.user, role: response.data.user.role as any };
          setUser(user);
          await SecureStore.setItemAsync('firebase_id_token', idToken);
          await SecureStore.setItemAsync('is_guest', 'false');
          setIsGuest(false);
        } catch (error) {
          console.error('Error syncing Firebase auth:', error);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeTokenRefresh: (() => void) | undefined;

    async function initNotifications() {
      if (!user) return;
      try {
        const messagingInstance = getMessaging();
        const authStatus = await requestPermission(messagingInstance);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await getToken(messagingInstance);
          if (token) {
            await registerDeviceTokenApi(token);
          }

          unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async (newToken) => {
            try {
              await registerDeviceTokenApi(newToken);
            } catch (err) {
              console.error('Failed to register refreshed token:', err);
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    }

    initNotifications();

    return () => {
      if (unsubscribeTokenRefresh) {
        unsubscribeTokenRefresh();
      }
    };
  }, [user?.id]);

  async function loadAuthState() {
    try {
      const guestFlag = await SecureStore.getItemAsync('is_guest');

      if (guestFlag === 'true') {
        setIsGuest(true);
        setIsLoading(false);
        return;
      }

      // Firebase auth state listener will handle the rest
    } catch (error) {
      console.error('Error loading auth state:', error);
      setIsLoading(false);
    }
  }

  async function login(idToken: string): Promise<User> {
    try {
      const response = await loginApi(idToken);
      const user = { ...response.data.user, role: response.data.user.role as any };
      setUser(user);
      await SecureStore.setItemAsync('firebase_id_token', idToken);
      await SecureStore.setItemAsync('is_guest', 'false');
      setIsGuest(false);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  const clearSessionData = () => {
    try {
      // 1. Reset Zustand Stores
      useSportsStore.getState().reset();
      useTeamsStore.getState().clearMyTeams();
      useCricketOnboardingStore.getState().reset();
      useNotificationsStore.getState().clearUnreadCount();
      
      // 2. Clear QueryClient Cache
      queryClient.clear();
    } catch (err) {
      console.error('Error clearing session data:', err);
    }
  };

  async function logout() {
    try {
      try {
        const messagingInstance = getMessaging();
        const token = await getToken(messagingInstance);
        if (token) {
          await removeDeviceTokenApi(token);
        }
      } catch (err) {
        console.error('Failed to remove device token on logout:', err);
      }
      await firebaseAuthService.signOut();
      await SecureStore.deleteItemAsync('firebase_id_token');
      await SecureStore.deleteItemAsync('is_guest');
      clearSessionData();
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function setGuest() {
    try {
      try {
        await firebaseAuthService.signOut();
      } catch (err) {
        console.error('Firebase signout error on setGuest:', err);
      }
      await SecureStore.deleteItemAsync('firebase_id_token');
      await SecureStore.setItemAsync('is_guest', 'true');
      clearSessionData();
      setIsGuest(true);
      setUser(null);
    } catch (error) {
      console.error('Set guest error:', error);
      throw error;
    }
  }

  async function updateProfile(
    name: string,
    isDiaspora: boolean,
    village: string,
    avatarUri?: string | null,
    phone?: string,
    email?: string
  ) {
    try {
      let updatedUser = user;
      
      // 1. Upload avatar if uri is provided and is a local file (e.g. starts with 'file://' or 'content://')
      if (avatarUri && (avatarUri.startsWith('file://') || avatarUri.startsWith('content://') || avatarUri.startsWith('ph://'))) {
        const response = await uploadAvatarApi(avatarUri);
        updatedUser = response;
      }
      
      // 2. Update name, is_diaspora, village, phone, email
      const response = await updateMeApi({ 
        name, 
        is_diaspora: isDiaspora, 
        village,
        phone: phone || undefined,
        email: email || undefined
      });
      updatedUser = response;
      
      setUser(updatedUser);
      
      // Invalidate announcements queries to force refetch feed with updated user profile
      await queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    } catch (error) {
      console.error('updateProfile error:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isGuest, login, logout, setGuest, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
