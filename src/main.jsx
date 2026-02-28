import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a1e',
            color: '#f0f0f4',
            border: '1px solid #2a2a32',
            fontFamily: 'DM Mono, monospace',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0a0a0b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0b' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
