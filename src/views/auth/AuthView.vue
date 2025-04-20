<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <!-- Show login/register when not authenticated -->
      <template v-if="!storeAuth.user.id">
        <div class="flex justify-center">
          <div class="flex space-x-4">
            <button
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium',
                !register
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
              @click="register = false"
            >
              Login
            </button>
            <button
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium',
                register
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
              @click="register = true"
            >
              Register
            </button>
          </div>
        </div>

        <div class="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h2 class="text-center text-3xl font-extrabold text-gray-900 mb-8">
            {{ formTitle }}
          </h2>

          <form class="space-y-6" @submit.prevent="onSubmit">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700"
                >Email</label
              >
              <div class="mt-1">
                <input
                  id="email"
                  v-model="credentials.email"
                  type="email"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. alexsmith@gmail.com"
                />
                <p v-if="errors.email" class="mt-1 text-sm text-red-600">
                  {{ errors.email }}
                </p>
              </div>
            </div>

            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700"
                >Password</label
              >
              <div class="mt-1">
                <input
                  id="password"
                  v-model="credentials.password"
                  type="password"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a password"
                />
                <p v-if="errors.password" class="mt-1 text-sm text-red-600">
                  {{ errors.password }}
                </p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {{ formTitle }}
              </button>
            </div>
          </form>
        </div>
      </template>

      <!-- Show logout when authenticated -->
      <template v-else>
        <div class="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h2 class="text-center text-3xl font-extrabold text-gray-900 mb-8">
            Welcome, {{ storeAuth.user.email }}
          </h2>
          <button
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            @click="storeAuth.logoutUser"
          >
            Logout
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
/*
  imports
*/
import { ref, computed, reactive } from 'vue'
import { useStoreAuth } from '@/stores/storeAuth'

/*
  store
*/
const storeAuth = useStoreAuth()

/*
  register / login
*/
const register = ref(false)

/*
  form title
*/
const formTitle = computed(() => {
  return register.value ? 'Register' : 'Login'
})

/*
  credentials
*/
const credentials = reactive({
  email: '',
  password: '',
})

/*
  validation rules
*/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const errors = reactive({
  email: '',
  password: '',
})

const validateEmail = email => {
  if (!email) {
    errors.email = 'Email is required'
    return false
  }
  if (!emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address'
    return false
  }
  errors.email = ''
  return true
}

const validatePassword = password => {
  if (!password) {
    errors.password = 'Password is required'
    return false
  }
  if (!passwordRegex.test(password)) {
    errors.password =
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character'
    return false
  }
  errors.password = ''
  return true
}

/*
  submit
*/
const onSubmit = async () => {
  const isEmailValid = validateEmail(credentials.email)
  const isPasswordValid = register.value
    ? validatePassword(credentials.password)
    : true

  if (!isEmailValid || !isPasswordValid) {
    return
  }

  if (register.value) {
    const result = await storeAuth.registerUser(credentials)
    if (!result.success) {
      errors.email = result.error
    }
  } else {
    const result = await storeAuth.loginUser(credentials)
    if (!result.success) {
      errors.email = result.error
    }
  }
}
</script>

<style>
.auth-form {
  max-width: 400px;
  margin: 0 auto;
}
</style>
