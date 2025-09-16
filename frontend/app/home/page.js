'use client'

import Link from 'next/link'
import PublicLayout from '../../components/public/PublicLayout'

// Document request cards data
const DOCUMENT_CARDS = [
  {
    id: 'barangay-clearance',
    title: 'Barangay Clearance',
    description: 'Certificate of residency and good moral character',
    icon: '📄',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800'
  },
  {
    id: 'business-permit',
    title: 'Business Permit',
    description: 'Permit for business operations within the barangay',
    icon: '🏪',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800'
  },
  {
    id: 'indigency-certificate',
    title: 'Certificate of Indigency',
    description: 'Certification for financial assistance programs',
    icon: '🆔',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800'
  },
  {
    id: 'residency-certificate',
    title: 'Certificate of Residency',
    description: 'Proof of residence within the barangay',
    icon: '🏠',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800'
  },
  {
    id: 'building-permit',
    title: 'Building Permit',
    description: 'Permit for construction and renovation projects',
    icon: '🏗️',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800'
  },
  {
    id: 'complaint-report',
    title: 'Complaint Report',
    description: 'File complaints and incident reports',
    icon: '📝',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800'
  }
]

// Navigation Header Component
function NavigationHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 p-4 lg:p-6">
      <nav className="flex justify-end items-center">
        <Link 
          href="/login"
          className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md border border-white/30 lg:border-gray-300 text-white/90 lg:text-gray-700 hover:text-white lg:hover:text-gray-900 hover:bg-white/10 lg:hover:bg-gray-100 hover:border-white/50 lg:hover:border-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-gray-400 focus:outline-none transition-all duration-200"
        >
          Login
        </Link>
      </nav>
    </header>
  )
}

// Document Request Card Component
function DocumentCard({ card }) {
  return (
    <button
      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${card.bgColor} ${card.borderColor}`}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="text-2xl mb-1">{card.icon}</div>
        <h3 className={`font-semibold text-sm ${card.textColor}`}>
          {card.title}
        </h3>
        <p className="text-xs text-gray-600 leading-tight">
          {card.description}
        </p>
      </div>
    </button>
  )
}

// Homepage Content Component
function HomepageContent() {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Section */}
      <div className="text-center mb-6 pt-8 lg:pt-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Barangay LIAS Services
        </h1>
        <p className="text-sm lg:text-base text-gray-600 max-w-md mx-auto">
          Request barangay documents and services online. Choose a service below to get started.
        </p>
      </div>

      {/* Document Cards Grid */}
      <div className="flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {DOCUMENT_CARDS.map((card) => (
              <DocumentCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <PublicLayout
        variant="homepage"
        showCard={true}
        title="Barangay LIAS"
        mobileImageHeight={25}
      >
        <HomepageContent />
      </PublicLayout>
      
      {/* Navigation overlay */}
      <NavigationHeader />
    </>
  )
}
