 'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ApiClient from '../../lib/apiClient'
import Modal from '../common/Modal'

export default function Header({ 
  title, 
  role = 'user', 
  userName = 'Juan Dela Cruz', 
  mobileMenuOpen, 
  setMobileMenuOpen,
  showLogoutModal,
  setShowLogoutModal,
  onLogout
}) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const computedTitle = title ?? (role === 'admin' || role === 'staff' ? 'Admin Dashboard' : 'Resident Dashboard')

  // Role-based header styling
  const getHeaderClasses = () => {
    if (role === 'resident') {
      return "border-b relative z-30 h-12"
    }
    // Default admin/staff styling
    return "bg-green-800 border-b border-green-700 relative z-30 h-12"
  }

  const getHamburgerClasses = () => {
    if (role === 'resident') {
      return "lg:hidden p-1 rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
    }
    return "lg:hidden p-1 rounded-md text-green-200 hover:text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
  }

  const getUserMenuButtonClasses = () => {
    if (role === 'resident') {
      return "flex items-center space-x-2 px-2 py-2 rounded hover:bg-slate-800 hover:text-slate-100 cursor-pointer transition-colors duration-150"
    }
    return "flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700 cursor-pointer transition-colors duration-150"
  }

  const getUserNameClasses = () => {
    if (role === 'resident') {
      return "text-sm text-gray-200 hidden sm:block"
    }
    return "text-sm text-green-100 hidden sm:block"
  }

  const getChevronClasses = () => {
    if (role === 'resident') {
      return "bi bi-chevron-down text-xs text-slate-300"
    }
    return "bi bi-chevron-down text-xs text-green-200"
  }

  const getAvatarClasses = () => {
    if (role === 'resident') {
      return "w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-900 text-xs font-medium"
    }
    return "w-6 h-6 bg-white rounded-full flex items-center justify-center text-green-800 text-xs font-medium"
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

    const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    } else {
      try {
        await ApiClient.logout()
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
  }

  return (
    <>
      <header 
        className={getHeaderClasses()}
        style={role === 'resident' ? { backgroundColor: '#333843', borderColor: '#2a2e37' } : {}}
      >
        <div className="flex items-center justify-between px-6 py-2 h-full">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen && setMobileMenuOpen(!mobileMenuOpen)}
              className={getHamburgerClasses()}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-medium text-white">{computedTitle}</h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* User Menu */}
            <div className="relative user-menu-container">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={getUserMenuButtonClasses()}
              >
                <div className={getAvatarClasses()}>
                  {userName?.[0] ?? 'U'}
                </div>
                <span className={getUserNameClasses()}>{userName}</span>
                <i className={getChevronClasses()}></i>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded shadow-lg z-50 py-1">
                  <button 
                    onClick={() => { setShowLogoutModal(true); setShowUserMenu(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <i className="bi bi-power text-sm mr-2"></i>Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
