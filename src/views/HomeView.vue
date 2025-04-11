<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-8">
          Welcome to TripBuilder
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          Plan your perfect trip with our easy-to-use itinerary builder
        </p>
        <router-link
          to="/itinerary"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Start Planning
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component is fully template-based, no additional script logic needed
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
  background-color: #f3f4f6;
}

.sidebar {
  width: 300px;
  padding: 20px;
  background-color: white;
  border-right: 1px solid #e5e7eb;
}

.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
</style>
