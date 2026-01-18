"use client"

import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, action, variant }) {
        return (
          <div
            key={id}
            className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border bg-white dark:bg-gray-900 p-6 pr-8 shadow-lg transition-all ${
              variant === "destructive" ? "border-red-500" : ""
            }`}
          >
            <div className="grid gap-1">
              {title && (
                <div className={`text-sm font-semibold ${
                  variant === "destructive" ? "text-red-600 dark:text-red-400" : ""
                }`}>{title}</div>
              )}
              {description && (
                <div className={`text-sm opacity-90 ${
                  variant === "destructive" ? "text-red-600 dark:text-red-400" : ""
                }`}>{description}</div>
              )}
            </div>
            {action}
            <button
              className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const currentToast = toasts.find(t => t.id === id)
                if (currentToast?.onOpenChange) {
                  currentToast.onOpenChange(false)
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
