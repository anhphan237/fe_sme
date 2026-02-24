import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ToastViewport } from './components/ui/Toast'
import { AuthRehydrate } from './components/auth/AuthRehydrate'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRehydrate>
        <RouterProvider router={router} />
      </AuthRehydrate>
      <ToastViewport />
    </QueryClientProvider>
  )
}

export default App

