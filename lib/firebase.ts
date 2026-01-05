import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';

// Firebase configuration - these are public keys (safe for client-side)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;
let firebaseInitialized = false;

export const initializeFirebase = async () => {
  if (typeof window === 'undefined') return null;
  
  // Skip if Firebase is not configured
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured - push notifications disabled');
    return null;
  }
  
  try {
    // Check if Firebase Messaging is supported
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging is not supported in this browser');
      return null;
    }
    
    // Initialize app if not already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    messaging = getMessaging(app);
    firebaseInitialized = true;
    return messaging;
  } catch (error) {
    console.log('Firebase initialization skipped:', (error as Error).message);
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  // Skip if Firebase is not configured
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured - cannot request permission');
    return null;
  }
  
  try {
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }
    
    // Initialize Firebase if not already done
    if (!messaging) {
      await initializeFirebase();
    }
    
    if (!messaging) {
      console.log('Firebase Messaging not available');
      return null;
    }
    
    // Get the FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });
    
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging || !firebaseInitialized) {
    // Silent fail - Firebase not configured
    return () => {};
  }
  
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Check if notifications are supported
export const isNotificationSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // If Firebase is not configured, notifications are not supported
  if (!isFirebaseConfigured()) return false;
  
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    return await isSupported();
  } catch {
    return false;
  }
};

// Get current notification permission status
export const getNotificationPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};
