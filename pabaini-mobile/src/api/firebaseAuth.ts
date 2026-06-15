import {
  getAuth,
  signInWithPhoneNumber,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  getIdToken,
  GoogleAuthProvider,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configure Google Sign-in
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '891324199067-s19vc3ne9op8kjn4o370sb2u3gn9t7p2.apps.googleusercontent.com', // From Firebase Console
  offlineAccess: true, // Required for Firebase auth
  forceCodeForRefreshToken: true, // Required for token refresh
});

export class FirebaseAuthService {
  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +923001234567)
   * @returns Confirmation object with confirm() method
   */
  async sendOtp(phoneNumber: string): Promise<FirebaseAuthTypes.ConfirmationResult> {
    try {
      const authInstance = getAuth();
      const confirmation = await signInWithPhoneNumber(authInstance, phoneNumber);
      return confirmation;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Confirm OTP code
   * @param confirmation - Confirmation object from sendOtp
   * @param code - 6-digit OTP code
   * @returns Firebase user credential
   */
  async confirmOtp(confirmation: FirebaseAuthTypes.ConfirmationResult, code: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const userCredential = await confirmation.confirm(code);
      if (!userCredential) {
        throw new Error('Failed to confirm OTP');
      }
      return userCredential;
    } catch (error) {
      console.error('Error confirming OTP:', error);
      throw error;
    }
  }

  /**
   * Get current user's ID token
   * @param forceRefresh - Force token refresh
   * @returns ID token string
   */
  async getIdToken(forceRefresh = false): Promise<string> {
    try {
      const authInstance = getAuth();
      const user = authInstance.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      // Add timeout to prevent hanging
      const idToken = await Promise.race([
        getIdToken(user, forceRefresh),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token fetch timeout')), 10000)
        )
      ]) as string;
      return idToken;
    } catch (error) {
      console.error('Error getting ID token:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   * @returns Firebase user credential
   */
  async signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Get ID token from the response (v13+ nests it inside data, fallback to top-level for older versions)
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;
      if (!idToken) {
        throw new Error('No ID token from Google Sign-In');
      }

      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with timeout
      const authInstance = getAuth();
      const userCredential = await Promise.race([
        signInWithCredential(authInstance, googleCredential),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase sign-in timeout')), 15000)
        )
      ]) as FirebaseAuthTypes.UserCredential;

      return userCredential;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.error('Google Sign-In cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.error('Google Sign-In already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('Google Play Services not available');
      } else {
        console.error('Error signing in with Google:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const authInstance = getAuth();
      await signOut(authInstance);
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get current user
   * @returns Current Firebase user or null
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    const authInstance = getAuth();
    return authInstance.currentUser;
  }

  /**
   * Listen to auth state changes
   * @param callback - Callback function with user parameter
   * @returns Unsubscribe function
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void): () => void {
    const authInstance = getAuth();
    return onAuthStateChanged(authInstance, callback);
  }
}

export const firebaseAuthService = new FirebaseAuthService();
