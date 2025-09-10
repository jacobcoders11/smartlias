'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ToastNotification from '../../components/ToastNotification'
import PublicLayout from '../../components/PublicLayout'
import ChangeMPINCard from '../../components/ChangeMPINCard'
import PageLoading from '../../components/PageLoading'

export default function ChangeMPINPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isValidToken, setIsValidToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('new-pin') // 'new-pin' or 'confirm-pin'
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errors, setErrors] = useState({})
  const [showKeypad, setShowKeypad] = useState(false) // Track keypad state for PublicLayout
  const toastRef = useRef()

  // ALL HOOKS MUST BE AT THE TOP - NO CONDITIONAL LOGIC BEFORE HOOKS

  // Token validation - only allow 'qwe123'
  useEffect(() => {
    try {
      const token = searchParams.get('token')
      console.log('Token from URL:', token)
      console.log('Token type:', typeof token)
      console.log('Token comparison:', token === 'qwe123')
      
      if (token !== 'qwe123') {
        console.log('Token validation failed, redirecting to 404')
        // Redirect to 404 if token is invalid or missing
        router.push('/not-found')
        return
      }
      
      console.log('Token validation successful')
      // Add delay to show PageLoading component
      setTimeout(() => {
        setIsValidToken(true)
      }, 500) // 2 second delay to show loading
    } catch (error) {
      console.error('Token validation error:', error)
      // Fallback to 404 on any error
      router.push('/not-found')
    }
  }, [searchParams, router])

  // Handle Escape key press
  useEffect(() => {
    if (!isValidToken) return // Don't set up event listeners until token is valid
    
    const handleKeyPress = (event) => {
      // Handle Escape key
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (showKeypad) {
          setShowKeypad(false)
        }
        return
      }
      
      // Handle Enter key for auto-submit
      if (event.key === 'Enter') {
        if (showKeypad && getCurrentPin().length === 6) {
          event.preventDefault()
          if (currentStep === 'new-pin') {
            handleNewPinSubmit()
          } else {
            handleConfirmPinSubmit()
          }
        }
      }
    }

    // Use capture phase to handle events before other components
    document.addEventListener('keydown', handleKeyPress, true)
    return () => document.removeEventListener('keydown', handleKeyPress, true)
  }, [isValidToken, showKeypad, currentStep, newPin, confirmPin])

  // Handle focus behavior when keypad toggles
  useEffect(() => {
    if (!isValidToken) return // Don't run until token is valid
    
    if (!showKeypad) {
      // When keypad is closed, blur any active input and focus on body for mobile
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        // Blur any focused input
        document.activeElement?.blur()
        // Focus on body to prevent input field focus
        document.body.focus()
      }
    }
  }, [isValidToken, showKeypad])

  // HELPER FUNCTIONS

  const handleAlert = (message, type = 'info') => {
    toastRef.current?.show(message, type)
  }

  const getCurrentPin = () => {
    return currentStep === 'new-pin' ? newPin : confirmPin
  }

  const getPinValidation = () => {
    return validateMPIN(newPin)
  }

  // Demo: MPIN validation function for frontend - simplified to only check 6 digits
  const validateMPIN = (mpin) => {
    return {
      length: mpin?.length === 6,
      numeric: /^\d+$/.test(mpin)
    }
  }

  // Demo: Handle new PIN step - simplified validation
  const handleNewPinSubmit = () => {
    const validation = validateMPIN(newPin)
    
    if (!validation.length) {
      handleAlert('PIN must be exactly 6 digits', 'error')
      return
    } else if (!validation.numeric) {
      handleAlert('PIN must contain only numbers', 'error')
      return
    }

    setCurrentStep('confirm-pin')
    setErrors({})
  }

  // Demo: Handle confirm PIN step
  const handleConfirmPinSubmit = async () => {
    if (newPin !== confirmPin) {
      handleAlert('PINs do not match', 'error')
      return
    }

    setIsLoading(true)

    try {
      // Demo: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      handleAlert('PIN changed successfully! Redirecting to login...', 'success')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      handleAlert('Failed to change PIN. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToNewPin = () => {
    setCurrentStep('new-pin')
    setNewPin('') // Reset the new PIN
    setConfirmPin('') // Reset the confirm PIN
    setErrors({})
  }

  // Demo: MPIN keypad number handler
  const handleKeypadNumber = (number) => {
    if (currentStep === 'new-pin') {
      if (newPin.length < 6) {
        const newValue = newPin + number
        setNewPin(newValue)
        
        // Auto-advance when new PIN is complete (6 digits)
        if (newValue.length === 6) {
          const validation = validateMPIN(newValue)
          if (validation.length && validation.numeric) {
            // PIN has 6 digits and is numeric, auto-advance to confirm step
            setTimeout(() => {
              setCurrentStep('confirm-pin')
              setErrors({})
            }, 300)
          } else {
            // PIN is invalid, show error
            setTimeout(() => {
              if (!validation.length) {
                handleAlert('PIN must be exactly 6 digits', 'error')
              } else if (!validation.numeric) {
                handleAlert('PIN must contain only numbers', 'error')
              }
            }, 100)
          }
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newValue = confirmPin + number
        setConfirmPin(newValue)
        
        // Auto-submit when confirm PIN is complete
        if (newValue.length === 6) {
          setTimeout(() => {
            handleConfirmPinSubmit()
          }, 100)
        }
      }
    }
  }

  // Demo: MPIN backspace handler
  const handleKeypadBackspace = () => {
    if (currentStep === 'new-pin') {
      setNewPin(prev => prev.slice(0, -1))
    } else {
      setConfirmPin(prev => prev.slice(0, -1))
    }
  }

  // CONDITIONAL RETURN AFTER ALL HOOKS
  if (!isValidToken) {
    return <PageLoading />
  }

  return (
    <>
      <ToastNotification ref={toastRef} />
      <PublicLayout 
        variant="change-pin" 
        hideBackgroundImage={showKeypad}
      >
        <ChangeMPINCard
          currentStep={currentStep}z
          newPin={newPin}
          confirmPin={confirmPin}
          getCurrentPin={getCurrentPin}
          getPinValidation={getPinValidation}
          errors={errors}
          setErrors={setErrors}
          isLoading={isLoading}
          onKeypadNumber={handleKeypadNumber}
          onKeypadBackspace={handleKeypadBackspace}
          onBackToNewPin={handleBackToNewPin}
          showKeypad={showKeypad}
          setShowKeypad={setShowKeypad}
        />
      </PublicLayout>
    </>
  )
}
