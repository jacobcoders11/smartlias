"use client"

import { forwardRef, useImperativeHandle, useState } from 'react'

const ToastNotification = forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([])

useImperativeHandle(ref, () => ({
  show: (message, type = 'success') => {
    const newToast = {
      id: Date.now() + Math.random(),
      message,
      type,
      show: true
    }
    setToasts(prev => {
      const updatedToasts = [...prev, newToast]
      // Limit to maximum of 5 toasts - remove oldest if exceeding limit
      return updatedToasts.length > 5 ? updatedToasts.slice(-5) : updatedToasts
    })
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== newToast.id))
    }, 5000)
  }
}))

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  if (toasts.length === 0) return null

  const getIconClass = (type) => {
    switch (type) {
      case 'error':
        return 'bi-x-circle-fill text-red-600'
      case 'warning':
        return 'bi-exclamation-triangle-fill text-yellow-600'
      case 'info':
        return 'bi-info-circle-fill text-blue-600'
      default:
        return 'bi-check-circle-fill text-green-600'
    }
  }

  const getBorderClass = (type) => {
    // Gray-200 border with glass effect
    return 'border border-gray-200 shadow-lg shadow-stone-800/20'
  }

  const getBackgroundClass = (type) => {
    // Pure white background
    return 'bg-white'
  }

  const getTextClass = (type) => {
    // Normal weight black text
    return 'text-black font-normal'
  }

  const getShadowClass = (type) => {
    // Enhanced shadow for glass effect depth
    return 'shadow-2xl'
  }

  return (
    <div className="fixed top-6 left-3 right-3 lg:left-auto lg:right-6 lg:w-auto z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id}
          className={`flex items-center w-full lg:w-80 p-3 rounded-xl ${getBackgroundClass(toast.type)} ${getBorderClass(toast.type)} ${getShadowClass(toast.type)} transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-2 fade-in relative overflow-hidden`} 
          role="alert"
          style={{ 
            animationDelay: `${index * 100}ms`,
            background: 'rgba(255, 249, 249, 0.78)',
            backdropFilter: 'blur(8px) saturate(150%)',
            WebkitBackdropFilter: 'blur(8px) saturate(150%)',
            border: '0.5px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10">
            <i className={`bi ${getIconClass(toast.type)} transition-all duration-300 ease-in-out text-xl`}></i>
          </div>
          <div className={`ml-1 text-sm font-medium ${getTextClass(toast.type)} flex-1`}>
            {toast.message}
          </div>
          <button 
            type="button" 
            className="ml-auto -mx-1.5 -my-1.5 text-gray-500 hover:text-gray-700 rounded-lg focus:ring-2 focus:ring-gray-300/50 p-1.5 inline-flex items-center justify-center h-8 w-8 flex-shrink-0 transition-colors duration-200 ease-in-out cursor-pointer"
            onClick={() => removeToast(toast.id)}
          >
            <i className="bi bi-x text-md"></i>
          </button>
        </div>
      ))}
    </div>
  )
})

ToastNotification.displayName = 'ToastNotification'

export default ToastNotification
