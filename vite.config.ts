// vite.config.ts

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 🟢 URL DA EVOLUTION API PARA O PROXY
const EVOLUTION_TARGET = 'https://cantinhodabere-evolution-api.3xdxtv.easypanel.host'; 

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
            // 🟢 CONFIGURAÇÃO DE PROXY PARA EVITAR CORS
            proxy: {
                '/evolution-api': {
                    target: EVOLUTION_TARGET,
                    changeOrigin: true, 
                    secure: false, 
                    rewrite: (path) => path.replace(/^\/evolution-api/, ''), 
                },
            },
        },
        plugins: [react()],
        define: {
            // Variáveis de ambiente explicitamente expostas para o frontend (import.meta.env)
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            // 🟢 ADICIONADO: Expondo a URL Base do n8n
            'process.env.NEXT_PUBLIC_N8N_BASE_URL': JSON.stringify(env.NEXT_PUBLIC_N8N_BASE_URL) 
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});