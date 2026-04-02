import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'pages/login.html'),
        adminDashboard: resolve(__dirname, 'pages/admin-dashboard.html'),
        map: resolve(__dirname, 'pages/map.html'),
        ownerDashboard: resolve(__dirname, 'pages/owner-dashboard.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        restaurant: resolve(__dirname, 'pages/restaurant.html')
      }
    }
  }
})