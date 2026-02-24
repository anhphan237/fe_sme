import { create } from 'zustand'

interface ToastItem {
  id: string
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (message: string) => void
  removeToast: (id: string) => void
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message) =>
    set((state) => {
      const id = crypto.randomUUID()
      return { toasts: [...state.toasts, { id, message }] }
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}))

export function useToast() {
  return useToastStore((state) => state.addToast)
}

export function ToastViewport() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-2xl border border-stroke bg-white px-4 py-3 text-sm shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <span>{toast.message}</span>
            <button
              className="text-xs font-semibold text-muted"
              onClick={() => removeToast(toast.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

