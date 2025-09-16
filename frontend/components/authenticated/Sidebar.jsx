 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Sidebar({ role = 'user', collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }) {
  const pathname = usePathname() || ''
  const [localCollapsed, setLocalCollapsed] = useState(false)
  const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed

  // Load collapsed state from localStorage
  useEffect(() => {
    if (collapsed === undefined) {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        setLocalCollapsed(JSON.parse(savedState))
      }
    }
  }, [collapsed])

  // Save to localStorage when state changes
  const handleToggle = () => {
    const newState = !isCollapsed
    if (setCollapsed) {
      setCollapsed(newState)
    } else {
      setLocalCollapsed(newState)
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
    }
  }

  const menus = {
    user: [
      { name: 'Dashboard', href: '/resident', icon: 'bi-speedometer2' },
      { name: 'My Documents', href: '/resident/documents', icon: 'bi-file-earmark-text' },
      { name: 'Request History', href: '/resident/requests', icon: 'bi-clock-history' },
      { name: 'Announcements', href: '/resident/announcements', icon: 'bi-megaphone' },
      { name: 'Profile', href: '/resident/profile', icon: 'bi-person' },
    ],
    resident: [
      { name: 'Dashboard', href: '/resident', icon: 'bi-speedometer2' },
      { name: 'My Documents', href: '/resident/documents', icon: 'bi-file-earmark-text' },
      { name: 'Request History', href: '/resident/requests', icon: 'bi-clock-history' },
      { name: 'Announcements', href: '/resident/announcements', icon: 'bi-megaphone' },
      { name: 'Profile', href: '/resident/profile', icon: 'bi-person' },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin', icon: 'bi-speedometer2' },
      { name: 'Residents', href: '/admin/residents', icon: 'bi-people' },
      { name: 'Documents', href: '/admin/documents', icon: 'bi-file-earmark-text' },
      { name: 'Reports', href: '/admin/reports', icon: 'bi-graph-up' },
      { name: 'Settings', href: '/admin/settings', icon: 'bi-gear' },
    ],
  }

  const items = menus[role] || menus.user

  return (
    <div 
      className={`fixed inset-y-0 left-0 bg-green-900 text-white transition-all duration-200 ease-in-out border-r border-green-700 z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Mobile Close Button */}
      <div className="lg:hidden absolute top-3 right-3 z-10">
        <button
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
          className="p-1 rounded-md text-green-300 hover:text-white focus:outline-none bg-green-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Header */}
      <div className={`px-4 py-3 border-b border-green-700 bg-green-800 ${isCollapsed ? 'px-2' : 'px-2'}`}>
        <div className="flex items-center">
          <div className={`flex items-center justify-center bg-green-700 rounded-md ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
            <img src="/images/barangay_logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h2 className="text-sm font-semibold text-white">SMARTLIAS</h2>
              <p className="text-xs text-green-300">{role === 'admin' ? 'Admin' : 'User'}</p>
            </div>
          )}
        </div>
        
        {/* Toggle Button - Desktop Only */}
        <button 
          onClick={handleToggle}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-green-700 border border-green-600 rounded-full items-center justify-center text-green-300 hover:text-white transition-colors"
        >
          <i className={`bi bi-chevron-left text-xs ${isCollapsed ? 'rotate-180' : ''}`}></i>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/resident' && item.href !== '/admin')
          return (
            <div key={item.href} className="relative group">
              <Link 
                href={item.href} 
                className={`flex items-center text-green-100 hover:text-white hover:bg-green-700 transition-all duration-150 rounded-md px-3 py-2 text-sm ${
                  active ? 'bg-green-700 text-white font-medium' : ''
                }`}
                onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
              >
                <i className={`bi ${item.icon} flex-shrink-0 text-base ${isCollapsed ? 'mr-0' : 'mr-3'}`}></i>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
              {isCollapsed && (
                <div className="hidden lg:block absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-green-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.name}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-green-700"></div>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
