'use client'

import Spinner from './Spinner'

export default function LoadingSpinner({ 
  message = '', 
  size = 'md', 
  color = 'blue',
  fullScreen = true 
}) {
  const spinnerContent = (
    <div className="text-center">
      <Spinner size={size} color={color} className="mx-auto" />
      {message && (
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      )}
    </div>
  )

  // Full screen loading
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        {spinnerContent}
      </div>
    )
  }

  // Inline loading
  return (
    <div className="flex items-center justify-center py-8">
      {spinnerContent}
    </div>
  )
}
