import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAKRNuO-mpLBw4s9ZD66_4V1oXuaLWYqMA',
  authDomain: 'trip-build.firebaseapp.com',
  projectId: 'trip-build',
  storageBucket: 'trip-build.firebasestorage.app',
  messagingSenderId: '433858902496',
  appId: '1:433858902496:web:9ee72b1edea3a359cc5385',
  measurementId: 'G-K9RXF5Y240',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Add persistence configuration
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Auth persistence error:', error)
  })

export { db, auth }
