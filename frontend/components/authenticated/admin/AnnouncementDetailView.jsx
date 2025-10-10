import React from 'react'
import Modal from '../../common/Modal'
import { ANNOUNCEMENT_TYPE_NAMES } from '../../../lib/constants'
import ApiClient from '../../../lib/apiClient'
import SMSTargetSection from './SMSTargetSection'

export default function AnnouncementDetailView({ open, onClose, announcement, onUpdate, onUpdateKeepOpen, onToast }) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState({})
  const [originalData, setOriginalData] = React.useState({}) // Track original data for change detection
  const [errors, setErrors] = React.useState({})
  const [isSaving, setIsSaving] = React.useState(false)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [showPublishModal, setShowPublishModal] = React.useState(false)
  const [smsStatus, setSmsStatus] = React.useState(null) // { total: 0, sent: 0, failed: 0 }

  // Load announcement data when panel opens
  React.useEffect(() => {
    if (open && announcement) {
      // Determine status based on published_at field
      const status = announcement.published_at ? 'published' : 'draft'
      
      // Use SMS target groups directly from API response (backend already converts target_type/target_value)
      const smsTargetGroups = announcement.sms_target_groups || []
      const isSmsEnabled = smsTargetGroups.length > 0 // SMS enabled if there are target groups
      
      // Debug logging
      console.log('Loading announcement for edit:', {
        announcement,
        target_type: announcement.target_type,
        target_value: announcement.target_value,
        sms_target_groups: announcement.sms_target_groups,
        isSmsEnabled,
        smsTargetGroups
      })
      
      const initialData = {
        title: announcement.title || '',
        content: announcement.content || '',
        type: announcement.type || 1,
        is_urgent: announcement.is_urgent || false,
        target_groups: announcement.target_groups || ['all'],
        sms_target_groups: smsTargetGroups,
        send_sms: isSmsEnabled,
        status: status
      }
      
      setFormData(initialData)
      setOriginalData(initialData) // Store original data for comparison
      setIsEditing(false)
      setErrors({})
      setSmsStatus(null) // Reset SMS status when loading new announcement
    }
  }, [open, announcement])

  // Fetch SMS status for published announcements with SMS enabled
  React.useEffect(() => {
    const fetchSmsStatus = async () => {
      if (open && announcement && announcement.published_at) {
        // Check if SMS was enabled (has SMS target groups)
        const hasSmsTargetGroups = announcement.sms_target_groups && 
                                   announcement.sms_target_groups.length > 0
        
        if (hasSmsTargetGroups) {
          try {
            const smsResponse = await ApiClient.request(`/announcements/${announcement.id}/sms-status`)
            if (smsResponse.success && smsResponse.data) {
              setSmsStatus({
                total: smsResponse.data.total_recipients || 0,
                sent: smsResponse.data.successful_sends || 0,
                failed: smsResponse.data.failed_sends || 0
              })
            }
          } catch (smsError) {
            console.error('Error fetching SMS status on load:', smsError)
          }
        }
      }
    }
    
    fetchSmsStatus()
  }, [open, announcement])

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    }
    
    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required'
    } else if (formData.content.trim().length < 30) {
      newErrors.content = 'Content must be at least 30 characters'
    } else if (formData.content.length > 1000) {
      newErrors.content = 'Content must be 1000 characters or less'
    } else if (formData.content.toLowerCase().includes('test')) {
      newErrors.content = 'Content cannot contain the word "TEST" as it may be blocked by SMS providers'
    }

    if (!formData.type) {
      newErrors.type = 'Type is required'
    }

    // SMS Target Group Validation - Only if SMS is enabled
    if (formData.send_sms && (!formData.sms_target_groups || formData.sms_target_groups.length === 0)) {
      newErrors.smsTargets = 'Please select at least one target group for SMS notifications'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if form data has actually changed from original
  const hasChanges = () => {
    if (!originalData || Object.keys(originalData).length === 0) return true
    
    // Compare key fields that matter for updates
    const fieldsToCompare = ['title', 'content', 'type', 'send_sms', 'sms_target_groups']
    
    for (const field of fieldsToCompare) {
      if (field === 'sms_target_groups') {
        // Special handling for arrays - compare as JSON strings
        const originalSmsGroups = JSON.stringify(originalData[field] || [])
        const currentSmsGroups = JSON.stringify(formData[field] || [])
        if (originalSmsGroups !== currentSmsGroups) {
          return true
        }
      } else {
        // Regular field comparison
        if (originalData[field] !== formData[field]) {
          return true
        }
      }
    }
    
    return false
  }

  const handleSave = async () => {
    if (!validateForm() || !announcement?.id) {
      return // Just return without toast - validation errors are shown inline
    }

    // Check if there are actual changes
    if (!hasChanges()) {
      onToast?.('No changes to save', 'info')
      setIsEditing(false) // Exit edit mode since no changes were made
      return
    }

    setIsSaving(true)
    try {
      // Ensure target_groups is always set to 'all'
      const updateData = {
        title: formData.title,
        content: formData.content,
        type: parseInt(formData.type) || 1,
        target_groups: ['all'],
        sms_target_groups: formData.send_sms ? (formData.sms_target_groups || []) : [],
        send_sms: formData.send_sms || false,
        status: 'draft' // Use 'draft' instead of 'unpublished'
      }

      console.log('Sending update data:', updateData)
      console.log('Form data before update:', formData)

      const response = await ApiClient.request(`/announcements/${announcement.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      if (response.success) {
        onToast?.('Announcement updated successfully', 'success')
        
        // Update original data to current form data for future change detection
        setOriginalData({ ...formData })
        
        setIsEditing(false)
        onUpdate()
      } else {
        console.error('Update failed:', response)
        onToast?.(response.error || 'Failed to update announcement', 'error')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      onToast?.('Failed to update announcement', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!announcement?.id) {
      onToast?.('No announcement selected', 'error')
      return
    }
    
    setIsPublishing(true)
    setSmsStatus(null) // Reset SMS status
    
    try {
      // Ensure target_groups is always set to 'all'
      const publishData = {
        title: formData.title,
        content: formData.content,
        target_groups: ['all'],
        sms_target_groups: formData.sms_target_groups || [],
        send_sms: formData.send_sms || false, // Include send_sms flag
        status: 'published'
      }

      const response = await ApiClient.request(`/announcements/${announcement.id}`, {
        method: 'PUT',
        body: JSON.stringify(publishData)
      })

      if (response.success) {
        // If SMS is enabled, fetch SMS status
        if (formData.sms_target_groups && formData.sms_target_groups.length > 0) {
          try {
            const smsResponse = await ApiClient.request(`/announcements/${announcement.id}/sms-status`)
            if (smsResponse.success && smsResponse.data) {
              setSmsStatus({
                total: smsResponse.data.total_recipients || 0,
                sent: smsResponse.data.successful_sends || 0,
                failed: smsResponse.data.failed_sends || 0
              })
            }
          } catch (smsError) {
            console.error('Error fetching SMS status:', smsError)
          }
          onToast?.('Announcement published and SMS notifications sent!', 'success')
        } else {
          onToast?.('Announcement published successfully', 'success')
        }
        
        setShowPublishModal(false)
        
        // Refresh the current announcement data instead of closing the panel
        // This allows user to see updated SMS delivery status immediately
        try {
          const refreshResponse = await ApiClient.request(`/announcements/${announcement.id}`)
          if (refreshResponse.success && refreshResponse.data) {
            // Update local announcement data to reflect published status
            const refreshedAnnouncement = refreshResponse.data
            
            // Update form data with refreshed announcement
            const status = refreshedAnnouncement.published_at ? 'published' : 'draft'
            const smsTargetGroups = refreshedAnnouncement.sms_target_groups || []
            const isSmsEnabled = smsTargetGroups.length > 0
            
            const updatedFormData = {
              title: refreshedAnnouncement.title || '',
              content: refreshedAnnouncement.content || '',
              type: refreshedAnnouncement.type || 1,
              is_urgent: refreshedAnnouncement.is_urgent || false,
              target_groups: refreshedAnnouncement.target_groups || ['all'],
              sms_target_groups: smsTargetGroups,
              send_sms: isSmsEnabled,
              status: status
            }
            
            setFormData(updatedFormData)
            setOriginalData(updatedFormData)
          }
        } catch (refreshError) {
          console.error('Error refreshing announcement data:', refreshError)
        }
        
        onUpdate() // Close panel after successful publish
      } else {
        console.error('Publish failed:', response)
        onToast?.(response.error || 'Failed to publish announcement', 'error')
      }
    } catch (error) {
      console.error('Error publishing announcement:', error)
      onToast?.('Failed to publish announcement', 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!announcement?.id) return

    try {
      const response = await ApiClient.request(`/announcements/${announcement.id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        onToast?.('Announcement deleted successfully', 'success')
        setShowDeleteModal(false)
        onClose()
        onUpdate()
      } else {
        onToast?.(response.error || 'Failed to delete announcement', 'error')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      onToast?.('Failed to delete announcement', 'error')
    }
  }

  const handleTargetGroupChange = (e) => {
    const { value, checked } = e.target
    
    if (value === 'all') {
      setFormData(prev => ({
        ...prev,
        target_groups: checked ? ['all'] : []
      }))
    } else {
      setFormData(prev => {
        let newGroups = [...prev.target_groups.filter(g => g !== 'all')]
        
        if (checked) {
          newGroups.push(value)
        } else {
          newGroups = newGroups.filter(g => g !== value)
        }
        
        return { ...prev, target_groups: newGroups.length === 0 ? ['all'] : newGroups }
      })
    }
  }

  const handleSMSTargetChange = (newTargetGroups) => {
    setFormData(prev => ({ ...prev, sms_target_groups: newTargetGroups }))
  }

  const handleSendSMSChange = (sendSMS) => {
    setFormData(prev => ({ 
      ...prev, 
      send_sms: sendSMS,
      sms_target_groups: sendSMS ? (prev.sms_target_groups || []) : []
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Default values for when announcement is null
  const announcementData = announcement || {
    title: '',
    content: '',
    status: 'unpublished',
    is_urgent: false,
    type: 1,
    target_groups: ['all'],
    sms_target_groups: [],
    created_at: null,
    created_by: null,
    published_at: null,
    published_by: null
  }
  
  const isPublished = announcementData.status === 'published'

  // Get announcement type name
  const getTypeName = (typeId) => {
    return ANNOUNCEMENT_TYPE_NAMES[typeId] || 'General'
  }

  // Get type badge color
  const getTypeBadgeColor = (typeId) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800 border-blue-200',      // General
      2: 'bg-green-100 text-green-800 border-green-200',   // Health
      3: 'bg-purple-100 text-purple-800 border-purple-200', // Activities
      4: 'bg-orange-100 text-orange-800 border-orange-200', // Assistance
      5: 'bg-yellow-100 text-yellow-800 border-yellow-200'  // Advisory
    }
    return colors[typeId] || colors[1]
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'}`}
      aria-modal={open ? "true" : "false"}
      aria-hidden={!open}
      role="dialog"
    >
      {/* Overlay - Click to close */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={open ? onClose : undefined}
      >
        {/* Floating Close Button next to Panel */}
        <button
          className={`absolute top-2 right-[520px] sm:right-[520px] lg:right-[650px] xl:right-[750px] w-9 h-9 bg-white/30 hover:bg-white/45 text-white hover:text-gray-100 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md transform -translate-x-4 cursor-pointer shadow-md hover:shadow-lg ${
            open ? 'opacity-100 scale-100' : 'opacity-10 scale-90'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close"
        >
          <i className="bi bi-x text-3xl text-white/90" />
        </button>
      </div>
      
      {/* Slide Panel from Right */}
      <div
        className={`relative ml-auto h-full w-full sm:w-[520px] lg:w-[650px] xl:w-[750px] bg-gray-50 shadow-2xl transition-transform duration-300 ease-out transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } overflow-hidden flex flex-col`}
      >
        {/* Panel Header */}
        <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="text-md font-medium tracking-normal antialiased text-gray-900">
              {isEditing ? 'Edit Announcement' : 'Announcement Details'}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <button 
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              onClick={onClose}
            >
              <i className="bi bi-x text-xl" />
            </button>
          </div>
        </div>

        {/* Panel Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {!isEditing ? (
              // View Mode - Blog Article Style
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Article Header */}
                <div className="px-6 py-5 border-b border-gray-200">
                  {/* Title and Status */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight flex-1">
                      {announcementData.title}
                    </h1>
                    {!isPublished && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative group">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white text-gray-600 border border-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 focus:ring-2 focus:ring-orange-500 transition-colors cursor-pointer"
                          >
                            <i className="bi bi-pencil text-base" />
                          </button>
                          {/* Custom Tailwind Tooltip - Edit */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                            Edit
                            {/* Tooltip Arrow */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white text-gray-600 border border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 focus:ring-2 focus:ring-red-500 transition-colors cursor-pointer"
                          >
                            <i className="bi bi-trash text-base" />
                          </button>
                          {/* Custom Tailwind Tooltip - Delete */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                            Delete
                            {/* Tooltip Arrow */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    {isPublished ? (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-gray-500 text-white">
                        <i className="bi bi-check-circle-fill mr-1.5" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-yellow-500 text-white">
                        <i className="bi bi-pencil-fill mr-1.5" />
                        Unpublished
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-3">
                    {/* First Row - Created and Published */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <i className="bi bi-calendar3 text-gray-400" />
                        <span className="text-xs">Created: {formatDate(announcementData.created_at)}</span>
                        {announcementData.created_by && (
                          <span className="text-xs text-gray-500">by {announcementData.created_by}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {announcementData.published_at ? (
                          <>
                            <i className="bi bi-send-check text-gray-400" />
                            <span className="text-xs">Published: {formatDate(announcementData.published_at)}</span>
                            {announcementData.published_by && (
                              <span className="text-xs text-gray-500">by {announcementData.published_by}</span>
                            )}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-clock text-gray-400" />
                            <span className="text-xs text-gray-500">Unpublished</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Second Row - SMS and Type in 2 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      {/* SMS Notification Status */}
                      <div className="flex items-center gap-1.5 text-left">
                        {announcementData.target_type !== null && announcementData.sms_target_groups && announcementData.sms_target_groups.length > 0 ? (
                          <>
                            <i className="bi bi-phone-vibrate" />
                            <span className="text-xs">
                              {announcementData.status === 'published' ? 'SMS sent to:' : 'SMS will be sent to:'}
                            </span>
                            <div className="flex gap-1">
                              {announcementData.sms_target_groups.length <= 2 ? (
                                // Show all groups if 2 or fewer
                                announcementData.sms_target_groups.map((group, index) => (
                                  <span key={index} className="text-xs text-amber-700 font-medium">
                                    {group === 'all' ? 'All Residents' : 
                                     group === 'special_category:PWD' ? 'PWD' :
                                     group === 'special_category:SENIOR_CITIZEN' ? 'Senior Citizens' :
                                     group === 'special_category:SOLO_PARENT' ? 'Solo Parents' :
                                     group === 'special_category:INDIGENT' ? 'Indigent Families' :
                                     group}
                                    {index < announcementData.sms_target_groups.length - 1 && ', '}
                                  </span>
                                ))
                              ) : (
                                // Show count if 3 or more
                                <span className="text-xs text-amber-700 font-medium">
                                  {announcementData.sms_target_groups.length} groups
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-telephone-x text-gray-400" />
                            <span className="text-xs text-gray-500">No SMS notifications</span>
                          </>
                        )}
                      </div>

                      {/* Announcement Type */}
                      <div className="flex items-center gap-1.5 text-left">
                        <i className="bi bi-tag text-gray-400" />
                        <span className="text-xs">Type:</span>
                        <span className="text-xs text-blue-700 font-medium">{getTypeName(announcementData.type)}</span>
                        {announcementData.is_urgent && (
                          <>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-red-700 font-medium">
                              <i className="bi bi-exclamation-triangle-fill mr-1" />
                              Urgent
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Content - Paper Style */}
                <div className="px-6 py-5">
                  {/* Paper Container */}
                  <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    {/* Paper Header */}
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center justify-end">
                        <span className="text-xs text-gray-400 font-mono">
                          {announcementData.content?.length || 0} chars
                        </span>
                      </div>
                    </div>
                    
                    {/* Paper Content */}
                    <div className="p-6 bg-white">
                      <div className="prose prose-base max-w-none">
                        <div className="text-gray-900 leading-relaxed whitespace-pre-wrap font-normal">
                          {announcementData.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Footer - SMS Delivery Status (only when SMS is enabled and status exists) */}
                {smsStatus && announcement?.sms_target_groups?.length > 0 && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">SMS Delivery Status</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Recipients:</span>
                          <span className="font-medium text-gray-800">{smsStatus.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Successfully Sent:</span>
                          <span className="font-medium text-green-600">{smsStatus.sent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Failed:</span>
                          <span className="font-medium text-red-600">{smsStatus.failed}</span>
                        </div>
                        {smsStatus.total > 0 && (
                          <div className="flex justify-between pt-1 border-t border-gray-200">
                            <span className="text-gray-600">Success Rate:</span>
                            <span className="font-medium text-gray-800">{((smsStatus.sent / smsStatus.total) * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <>
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  {/* Form Header */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm">
                        <i className="bi bi-pencil" />
                      </div>
                      <div>
                        <h1 className="text-sm font-medium tracking-normal antialiased text-gray-900">
                          Edit Announcement
                        </h1>
                        <p className="text-xs text-gray-500">Update announcement information</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="space-y-4">
                    {/* Title Field */}
                    <div>
                      <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full rounded-md px-3 py-1.5 text-sm border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-colors h-9 ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter announcement title"
                      />
                      {errors.title && (
                        <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                      )}
                    </div>

                    {/* Content Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700">
                          Content <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-gray-500">
                          {formData.content?.length || 0}/1000
                        </span>
                      </div>
                      <textarea
                        id="edit-content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={6}
                        className={`w-full rounded-md px-3 py-1.5 text-sm border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-colors resize-none ${
                          errors.content ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter announcement content"
                        maxLength={1000}
                      />
                      {errors.content && (
                        <p className="text-xs text-red-600 mt-1">{errors.content}</p>
                      )}
                    </div>

                    {/* Type Field */}
                    <div>
                      <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-1">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="edit-type"
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                          className={`w-full rounded-md px-3 py-1.5 text-sm border focus:ring-1 bg-white transition-colors h-9 cursor-pointer appearance-none pr-8 ${
                            errors.type 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Select</option>
                          {Object.entries(ANNOUNCEMENT_TYPE_NAMES).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                      </div>
                      {errors.type && (
                        <p className="text-xs text-red-600 mt-1">{errors.type}</p>
                      )}
                    </div>

                    {/* Target Groups - FYI Only */}
                    {/* Target Groups - FYI Only */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visibility
                      </label>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <i className="bi bi-info-circle text-blue-600 mt-0.5"></i>
                          <div>
                            <p className="text-sm text-blue-900 font-medium">All Residents</p>
                            <p className="text-xs text-blue-700 mt-1">
                              All announcements are visible to all residents by default. This ensures important information reaches everyone in the barangay.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>                    {/* SMS Notifications */}
                    <SMSTargetSection
                      sendSMS={formData.send_sms || false}
                      targetGroups={formData.sms_target_groups || []}
                      onSendSMSChange={handleSendSMSChange}
                      onTargetGroupsChange={handleSMSTargetChange}
                      hasError={!!errors.smsTargets}
                    />
                    {errors.smsTargets && (
                      <p className="text-xs text-red-600 mt-1">{errors.smsTargets}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end space-x-2">
          {!isEditing ? (
            // View Mode Buttons
            <>
              {!isPublished && (
                <button
                  type="button"
                  onClick={() => setShowPublishModal(true)}
                  disabled={isPublishing}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-3 h-3 mr-2">
                        <div className="w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check text-lg mr-1" />
                      Publish
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            // Edit Mode Buttons
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    title: announcementData.title || '',
                    content: announcementData.content || '',
                    is_urgent: announcementData.is_urgent || false,
                    target_groups: announcementData.target_groups || ['all'],
                    sms_target_groups: announcementData.sms_target_groups || [],
                    status: announcementData.status || 'unpublished'
                  })
                  setErrors({})
                }}
                disabled={isSaving}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasChanges()}
                className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer h-9 disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasChanges() 
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500' 
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                {isSaving ? (
                  <>
                    <i className="bi bi-arrow-clockwise animate-spin mr-1" />
                    Saving...
                  </>
                ) : hasChanges() ? (
                  <>
                    <i className="bi bi-check text-lg mr-1" />
                    Submit
                  </>
                ) : (
                  <>
                    <i className="bi bi-check text-lg mr-1" />
                    No Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

            <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Announcement"
        type="confirm"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="danger"
      >
        <p className="text-gray-700">Are you sure you want to delete this announcement?</p>
      </Modal>

      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Announcement"
        type="confirm"
        confirmText={isPublishing ? "Publishing..." : "Yes, Confirm"}
        cancelText="Cancel"
        onConfirm={handlePublish}
        variant="safe"
        confirmDisabled={isPublishing}
      >
        <div className="space-y-3">
          <p className="text-gray-700">Are you sure you want to publish this announcement?</p>
          
          {formData.sms_target_groups && formData.sms_target_groups.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <i className="bi bi-phone-vibrate text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">SMS notifications will be sent to:</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.sms_target_groups.map((group, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800">
                        {group === 'all' ? 'All Residents' : 
                         group === 'special_category:PWD' ? 'PWD' :
                         group === 'special_category:SENIOR_CITIZEN' ? 'Senior Citizens' :
                         group === 'special_category:SOLO_PARENT' ? 'Solo Parents' :
                         group === 'special_category:INDIGENT' ? 'Indigent Families' :
                         group}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-600">Once published, this announcement will be visible to residents and cannot be edited.</p>
        </div>
      </Modal>
    </div>
  )
}
