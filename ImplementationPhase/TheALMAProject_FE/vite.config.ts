import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Đảm bảo chỉ có một instance React duy nhất trong app
    // Tránh lỗi "Invalid hook call" do react-hot-toast bị resolve từ node_modules cha
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
})
