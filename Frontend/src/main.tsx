import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css";
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from './lib/QueryClient.ts';
import AuthSessionProvider from "./components/auth/AuthSessionProvider.tsx";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthSessionProvider>
        <App />
      </AuthSessionProvider>
    </BrowserRouter>
</QueryClientProvider>
  </StrictMode>,
)
