'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ToastNotification from '../../components/common/ToastNotification'
import PublicLayout from '../../components/public/PublicLayout'
import LoginCard from '../../components/public/LoginCard'
import { auth } from '../../lib/auth'

export default function LoginPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const router = useRouter()
  const toastRef = useRef()
  
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [mpin, setMpin] = useState('')
  const [errors, setErrors] = useState({})
  const [showKeypad, setShowKeypad] = useState(false)

  // ============================================
  // DEMO CREDENTIALS
  // ============================================
  const demoCredentials = [
    { username: 'juan.delacruz', mpin: '031590', role: 'User' },
    { username: 'maria.santos', mpin: '120885', role: 'User' },
    { username: 'admin.staff', mpin: '010180', role: 'Admin' }
  ]

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const handleAlert = (message, type = 'info') => {
    toastRef.current?.show(message, type)
  }

  const sanitizeInput = (input) => {
    if (!input) return ''
    
    return input
      .trim()
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .slice(0, 100) // Limit length
  }

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================
  const validateUsername = (usernameToValidate) => {
    const sanitizedUsername = sanitizeInput(usernameToValidate)
    const newErrors = {}
    
    // Demo: Simplified validation for testing frontend design/UX
    const EASY_TESTING = true; // Set to false for real validation
    
    if (EASY_TESTING) {
      // Demo: Allow any non-empty username for testing
      if (!sanitizedUsername) {
        newErrors.username = 'Username is required'
      }
      return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
    }

    // Production validation rules
    if (!sanitizedUsername) {
      newErrors.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedUsername)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores'
    } else if (sanitizedUsername.length > 64) {
      newErrors.username = 'Username is maximum of 64 characters only'
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  const validateMpin = (mpinToValidate) => {
    const newErrors = {}
    
    // Demo: Simplified validation for testing frontend design/UX
    const EASY_TESTING = true; // Set to false for real validation
    
    if (EASY_TESTING) {
      // Demo: Allow any 6-digit MPIN for testing
      if (!mpinToValidate) {
        newErrors.mpin = 'MPIN is required'
      } else if (mpinToValidate.length !== 6) {
        newErrors.mpin = 'MPIN must be 6 digits'
      } else if (!/^\d{6}$/.test(mpinToValidate)) {
        newErrors.mpin = 'MPIN must contain only numbers'
      }
      return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
    }

    // Production validation rules
    if (!mpinToValidate) {
      newErrors.mpin = 'MPIN is required'
    } else if (mpinToValidate.length !== 6) {
      newErrors.mpin = 'MPIN must be 6 digits'
    } else if (!/^\d{6}$/.test(mpinToValidate)) {
      newErrors.mpin = 'MPIN must contain only numbers'
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  // ============================================
  // AUTHENTICATION HANDLERS
  // ============================================
  const handleUsernameSubmit = (submittedUsername) => {
    // Update username state with submitted value
    setUsername(submittedUsername)
    
    // Validate the submitted username
    const validation = validateUsername(submittedUsername)
    
    if (!validation.isValid) {
      // Set validation errors and show alert
      setErrors(validation.errors)
      handleAlert(validation.errors.username, 'error')
      return
    }

    // Clear validation errors and show keypad
    setErrors({})
    setShowKeypad(true)
  }

  const handleLogin = async ({ username, mpin }) => {
    // Validate MPIN before proceeding
    const mpinValidation = validateMpin(mpin)
    
    if (!mpinValidation.isValid) {
      setErrors(mpinValidation.errors)
      handleAlert(mpinValidation.errors.mpin, 'error')
      return
    }

    setIsLoading(true)
    
    const sanitizedData = {
      username: sanitizeInput(username),
      password: mpin // Use MPIN as password for backend compatibility
    }

    try {
      // Use frontend-only authentication
      const result = await auth.login(sanitizedData.username, sanitizedData.password)

      if (!result.success) {
        handleAlert(result.error, 'error')
        setIsLoading(false)
        return
      }

      // Handle successful login
      if (!result.user.passwordChanged) {
        handleAlert('Password change required. Redirecting…', 'info')
      } else {
        handleAlert(`Welcome ${result.user.firstName}! Redirecting…`, 'success')
      }

      setTimeout(() => {
        router.push(result.redirectTo)
      }, 10)

    } catch (error) {
      handleAlert('Login failed. Please try again.', 'error')
      setIsLoading(false)
    }
  }

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const handleKeypadClose = () => {
    setShowKeypad(false)
    setMpin('')
    setErrors(prev => ({ ...prev, mpin: '' }))
  }

  // ============================================
  // MPIN KEYPAD HANDLERS
  // ============================================
  const handleKeypadNumber = (number) => {
    if (mpin.length < 6) {
      setMpin(prev => prev + number)
      if (errors.mpin) setErrors(prev => ({ ...prev, mpin: '' }))
    }
  }

  const handleKeypadBackspace = () => {
    setMpin(prev => prev.slice(0, -1))
    if (errors.mpin) setErrors(prev => ({ ...prev, mpin: '' }))
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <ToastNotification ref={toastRef} />
      <PublicLayout hideBackgroundImage={showKeypad}>
        <LoginCard
          // Input values
          username={username}
          mpin={mpin}
          
          // Input handlers
          onUsernameChange={setUsername}
          onUsernameSubmit={handleUsernameSubmit}
          
          // Keypad handlers
          onKeypadNumber={handleKeypadNumber}
          onKeypadBackspace={handleKeypadBackspace}
          onKeypadClose={handleKeypadClose}
          
          // Login handler
          onLogin={handleLogin}
          
          // UI state
          showKeypad={showKeypad}
          isLoading={isLoading}
          errors={errors}
          
          // Demo data
          demoCredentials={demoCredentials}
        />
      </PublicLayout>
    </>
  )
}
