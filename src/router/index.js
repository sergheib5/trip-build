import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ItineraryView from '../views/itineraryView/ItineraryView.vue'
import AuthView from '../views/auth/AuthView.vue'
import ProfileView from '../views/ProfileView.vue'
import { useStoreAuth } from '../stores/storeAuth.js'
import SimpleLayout from '../layout/simpleLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/itinerary',
      component: SimpleLayout,
      children: [{ path: '', name: 'itinerary', component: ItineraryView }],
    },
    {
      path: '/auth',
      component: SimpleLayout,
      children: [{ path: '', name: 'auth', component: AuthView }],
    },
    {
      path: '/profile',
      component: SimpleLayout,
      children: [{ path: '', name: 'profile', component: ProfileView }],
    },
  ],
})

// Enhanced navigation guards
router.beforeEach(async to => {
  const storeAuth = useStoreAuth()

  // Wait for auth initialization if not already done
  if (!storeAuth.isInitialized) {
    await storeAuth.init()
  }

  if (!storeAuth.user.id && to.name !== 'auth') {
    return { name: 'auth' }
  }
  if (storeAuth.user.id && to.name === 'auth') {
    return false
  }
})

export default router
