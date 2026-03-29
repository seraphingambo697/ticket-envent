import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    // Pas de proxy nécessaire : api.js pointe directement sur http://localhost (gateway)
})
