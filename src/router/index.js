import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ItineraryView from '../views/itineraryView/ItineraryView.vue'
import AuthView from '../views/auth/AuthView.vue'
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
  ],
})

// navigation guards
router.beforeEach(async (to, from) => {
  const storeAuth = useStoreAuth()
  if (!storeAuth.user.id && to.name !== 'auth') {
    return { name: 'auth' }
  }
  if (storeAuth.user.id && to.name === 'auth') {
    return false
  }
})

export default router
