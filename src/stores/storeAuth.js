import { defineStore } from 'pinia'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/data/firebase'
import { useRouter } from 'vue-router'
// import { useStoreNotes } from '@/stores/storeNotes'

export const useStoreAuth = defineStore('storeAuth', {
  state: () => ({
    user: {},
    router: null,
    isInitialized: false,
  }),
  actions: {
    init() {
      this.router = useRouter()
      // const storeNotes = useStoreNotes()

      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            this.user.id = user.uid
            this.user.email = user.email
            if (!this.isInitialized) {
              this.router.push('/itinerary')
            }
          } else {
            this.user = {}
            if (!this.isInitialized) {
              this.router.replace('/auth')
            }
          }
          this.isInitialized = true
          resolve(user)
        })
      })
    },
    registerUser(credentials) {
      return createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )
        .then(userCredential => {
          const user = userCredential.user
          this.user.id = user.uid
          this.user.email = user.email
          this.router.push('/itinerary')
          return { success: true }
        })
        .catch(error => {
          console.error('Registration error:', error.message)
          return { 
            success: false, 
            error: error.message 
          }
        })
    },
    loginUser(credentials) {
      return signInWithEmailAndPassword(auth, credentials.email, credentials.password)
        .then(userCredential => {
          const user = userCredential.user
          this.user.id = user.uid
          this.user.email = user.email
          this.router.push('/')
          return { success: true }
        })
        .catch(error => {
          console.error('Login error:', error.message)
          return {
            success: false,
            error: error.message
          }
        })
    },
    logoutUser() {
      signOut(auth)
        .then(() => {
          this.user = {}
          this.router.replace('/auth')
        })
        .catch(error => {
          console.error('Logout error:', error.message)
        })
    },
  },
})
