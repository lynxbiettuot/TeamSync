// Cấu hình Vite Dev Server với Vite Proxy chuyển tiếp /api và /ws về Spring Boot Backend (hỗ trợ LAN/Mobile)
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    host: true, // Lắng nghe trên 0.0.0.0 để điện thoại cùng Wi-Fi truy cập được
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Giả lập Origin hợp lệ để Spring Boot Security CORS không từ chối 403 khi vào bằng IP LAN
            proxyReq.setHeader('origin', 'http://localhost:5173');
          });
        },
      },
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://localhost:5173');
          });
        },
      },
    },
  },
})
