import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Comprehensive environment variable logging for debugging
console.log('=== FIREBASE CONFIG DEBUG ===');
console.log('Environment:', import.meta.env.MODE);
console.log('All env vars:', Object.keys(import.meta.env));
console.log('VITE_FIREBASE_API_KEY:', {
    exists: !!import.meta.env.VITE_FIREBASE_API_KEY,
    length: import.meta.env.VITE_FIREBASE_API_KEY?.length,
    firstChars: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10),
});
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('==============================');

// Validate required environment variables
const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingVars);
    console.error('Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
    throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('✅ Firebase config validated');

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
