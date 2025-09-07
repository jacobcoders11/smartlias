'use client'

import { cloneElement } from 'react'

export default function PublicLayout({ 
  children,
  variant = 'login', // 'login', 'change-pin', 'announcement'
  showCard = true,
  showLogo = true,
  title = 'Barangay LIAS',
  subtitle = 'Access your account to our Barangay SMART LIAS Portal.',
  mobileImageHeight = 30, // percentage for mobile image section
  hideBackgroundImage = false // Hide background image when keypad is active
}) {
  // Configure layout based on variant
  const getLayoutConfig = () => {
    switch (variant) {
      case 'announcement':
        return {
          desktopCols: 'lg:grid-cols-[60%_40%]',
          showDesktopCard: false,
          mobileImageHeight: mobileImageHeight
        }
      case 'change-pin':
      case 'login':
      default:
        return {
          desktopCols: 'lg:grid-cols-[70%_30%]',
          showDesktopCard: showCard,
          mobileImageHeight: mobileImageHeight
        }
    }
  }

  const config = getLayoutConfig()

  return (
    <div className="bg-gray-100 text-gray-800 overflow-hidden" style={{ height: '100dvh', position: 'fixed', width: '100%', top: 0, left: 0 }}>
      <main className="h-full relative" style={{ height: '100dvh' }}>
        {/* Large screens: Dynamic column layout */}
        <div className={`hidden lg:grid ${config.desktopCols} h-full relative`}>
          {/* LEFT: Hero section with background image */}
          <section className="relative z-0">
            <img 
              src="/images/bg.jpg" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="Background"
            />
            <div className="absolute inset-0 bg-green-900/40"></div>

            <div className="relative h-full flex flex-col justify-end p-10 text-white">
              {showLogo && (
                <img 
                  src="/images/barangay_logo.jpg" 
                  alt="Barangay Logo" 
                  className="w-20 h-20 rounded-full mb-4"
                />
              )}
              <h1 className="text-4xl font-extrabold">{title}</h1>
              <p className="mt-6 max-w-xl text-white/90">
                {subtitle}
              </p>
              <p className="mt-10 text-sm text-white/70">
                &copy; {new Date().getFullYear()} Smart LIAS
              </p>
            </div>
          </section>

          {/* RIGHT: Content section (card or content) */}
          {config.showDesktopCard ? (
            <section className="flex items-center justify-center p-6 lg:p-12 relative overflow-visible">
              {/* Overlapping card - pull left on large screens */}
              <div className="lg:-ml-120">
                {/* Clone children with showLogo=false for desktop */}
                {cloneElement(children, { showLogo: false })}
              </div>
            </section>
          ) : (
            <section className="flex items-center justify-center p-6 lg:p-12 relative">
              {/* Content without card styling for announcements */}
              <div className="w-full h-full flex items-center justify-center">
                {children}
              </div>
            </section>
          )}
        </div>

        {/* Small screens: Dynamic layout based on keypad state */}
        <div className="lg:hidden overflow-hidden relative" style={{ height: '100dvh', position: 'fixed', width: '100%', top: 0, left: 0 }}>
          {/* Background image - always visible */}
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-left-top bg-no-repeat"
              style={{ 
                backgroundImage: 'url(/images/bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'left top'
              }}
            ></div>
            <div className="absolute inset-0 bg-green-900/40"></div>
          </div>

          {/* Layout container with transition */}
          <div className="relative z-10 flex flex-col transition-all duration-500 ease-out" style={{ height: '100dvh' }}>
            {/* Top image area - animates out when keypad is active */}
            <div className={`flex-shrink-0 transition-all duration-500 ease-out ${
              hideBackgroundImage 
                ? 'h-0 opacity-0' 
                : 'opacity-100'
            }`} style={{ 
              height: hideBackgroundImage ? '0dvh' : '20dvh'
            }}></div>
            
            {/* White card area - expands to full height and removes styling when keypad active */}
            <div className={`flex-1 bg-white relative transition-all duration-500 ease-out ${
              hideBackgroundImage 
                ? 'rounded-none shadow-none' 
                : 'rounded-t-2xl sm:rounded-t-3xl shadow-2xl'
            }`} style={{ 
              height: hideBackgroundImage ? '100dvh' : '80dvh',
              boxShadow: hideBackgroundImage 
                ? 'none' 
                : '0 -20px 40px rgba(0, 0, 0, 0.3), 0 -10px 20px rgba(0, 0, 0, 0.2), 0 -5px 10px rgba(0, 0, 0, 0.15)'
            }}>
              {/* Additional inner shadow for depth - only when not in keypad mode */}
              {!hideBackgroundImage && (
                <div className="absolute inset-0 rounded-t-2xl sm:rounded-t-3xl" style={{ boxShadow: 'inset 0 10px 20px rgba(0, 0, 0, 0.05)' }}></div>
              )}
              
              {/* Content container with mobile-optimized padding */}
              <div className="h-full flex flex-col p-4 sm:p-4 lg:p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                {/* Main content area - centered */}
                <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
                  <div className="w-full max-w-md sm:max-w-sm lg:max-w-sm">
                    {showCard ? (
                      /* Clone children with proper spacing props */
                      cloneElement(children, { 
                        showLogo: true, 
                        className: "m-0 w-full bg-transparent shadow-none border-0"
                      })
                    ) : (
                      /* Direct content without card wrapper */
                      <div className="w-full">
                        {children}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Comprehensive fixed footer - forgot credentials, access message and copyright */}
                <div className="flex-shrink-0 text-center pt-4 pb-2 space-y-3 transition-all duration-500 ease-out" style={{ minHeight: '120px' }}>
                  {/* Forgot credentials message */}
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg shadow-sm">
                      <i className="bi bi-question-circle text-gray-500 text-sm"></i>
                      <p className="text-xs text-gray-600 font-medium">
                        Forgot username or mpin? Please contact Barangay LIAS
                      </p>
                    </div>
                  </div>
                  
                  {/* Access message */}
                  <p className="text-sm sm:text-xs lg:text-xs text-gray-600">
                    Access for registered residents and administrators.
                  </p>
                  
                  {/* Copyright */}
                  <p className="text-xs sm:text-xs lg:text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Smart LIAS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
