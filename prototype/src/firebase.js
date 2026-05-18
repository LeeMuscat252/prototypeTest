import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBquzu3d3gO1H295wgyYjtd55Vmg6MhgV8",
  authDomain: "prototype-5e11d.firebaseapp.com",
  projectId: "prototype-5e11d",
  storageBucket: "prototype-5e11d.firebasestorage.app",
  messagingSenderId: "188741320189",
  appId: "1:188741320189:web:ecccfc3326ce41cbf32d94",
  measurementId: "G-0HQLDG60B0"
};

const hasFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(Boolean)

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null

export const firestore = app ? getFirestore(app) : null
export const analytics = app && firebaseConfig.measurementId ? getAnalytics(app) : null

export const firebaseReady = firestore
