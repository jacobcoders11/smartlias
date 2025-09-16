import React from 'react'

export default function ResidentsView({ open, onClose, children }) {
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
  return (
    <div
      className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Slide Panel - Responsive */}
      <div
  className={`relative ml-auto h-full w-full sm:w-[65vw] sm:max-w-2xl bg-white shadow-xl shadow-[rgba(0,0,0,0.12)_-8px_0px_24px_0px] transition-transform duration-300 ease-in-out transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none cursor-pointer text-xs font-medium shadow-sm"
          onClick={onClose}
        >
          Close
        </button>
        {/* Spacer row to prevent overlap */}
        <div className="h-8 w-full" />
        {/* Panel Content */}
        <div className="p-6 overflow-y-auto h-full">
          {/* Sectioned resident details layout */}
          {children && typeof children === 'object' && children.id ? (
            <div className="w-full max-w-2xl mx-auto space-y-6">
              {/* Status badge moved to card header for compact layout */}
              {/* Main Resident Info Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                    <i className="bi bi-person" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-gray-900 truncate">{children.name || '-'}</div>
                    <div className="text-xs text-gray-500">ID: {children.id || '-'}</div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ml-2 ${children.is_active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{children.is_active === 1 ? 'Active' : 'Inactive'}</span>
                </div>
                {/* Personal Information Section */}
                <div className="text-base font-semibold text-gray-900 mb-2 mt-4">Personal Information</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                  <div><span className="block text-xs text-gray-500 mb-1">Gender</span>{children.gender || '-'}</div>
                  <div><span className="block text-xs text-gray-500 mb-1">Date of Birth</span>{children.birth_date ? new Date(children.birth_date).toLocaleDateString() : '-'}</div>
                  <div><span className="block text-xs text-gray-500 mb-1">Civil Status</span>{children.civil_status || '-'}</div>
                  <div><span className="block text-xs text-gray-500 mb-1">Created</span>{children.created_at ? new Date(children.created_at).toLocaleDateString() : '-'}</div>
                  <div className="col-span-2"><span className="block text-xs text-gray-500 mb-1">Address</span>{children.address || '-'}</div>
                </div>
                {/* Contact Information Section */}
                <div className="text-base font-semibold text-gray-900 mb-2">Contact Information</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                  <div><span className="block text-xs text-gray-500 mb-1">Email</span>{children.email || '-'}</div>
                  <div><span className="block text-xs text-gray-500 mb-1">Phone</span>{children.phone || '-'}</div>
                </div>
                {/* Account Information Section */}
                <div className="text-base font-semibold text-gray-900 mb-2">Account Information</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                  <div><span className="block text-xs text-gray-500 mb-1">Status</span>{children.status || '-'}</div>
                  <div><span className="block text-xs text-gray-500 mb-1">Updated</span>{children.updated_at ? new Date(children.updated_at).toLocaleDateString() : '-'}</div>
                </div>
                {/* Actions Section */}
                {/*
                <div className="flex justify-end gap-2 pt-2">
                  <button className="px-4 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">Edit</button>
                  <button className={`px-4 py-1.5 text-xs font-medium rounded ${children.status === 'Active' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'} transition-colors`}>{children.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                  <button className="px-4 py-1.5 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Delete</button>
                </div>
                */}
              </div>
              {/* Family Relationship Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                <div className="text-base font-semibold text-gray-900 mb-2">Family Relationship</div>
                <div className="flex flex-col items-center">
                  {/* Father → Resident → Children Tree */}
                  <div className="flex items-center gap-6 mb-4">
                    {/* Father Node */}
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                        <i className="bi bi-person" />
                      </div>
                      <div className="text-xs text-gray-700 mt-2 font-medium">{children.father_name || 'Father'}</div>
                    </div>
                    <div className="w-10 h-0.5 bg-gray-300" />
                    {/* Resident Node */}
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold">
                        <i className="bi bi-person" />
                      </div>
                      <div className="text-xs text-gray-700 mt-2 font-medium">{children.name || 'Resident'}</div>
                    </div>
                  </div>
                  {/* Children Nodes (if any) */}
                  {Array.isArray(children.children) && children.children.length > 0 && (
                    <div className="flex items-center gap-6 mt-2">
                      {children.children.map((child, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-lg font-bold">
                            <i className="bi bi-person" />
                          </div>
                          <div className="text-xs text-gray-700 mt-2 font-medium">{child.name || 'Child'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  )
}
