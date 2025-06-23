import React, { useState } from 'react';

const EventRegistrationList = ({ registrations, onDelete, darkMode, selectedItems, onToggleSelect }) => {
  const [expandedRows, setExpandedRows] = useState([]);

  const toggleExpanded = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return darkMode ? 'text-green-400 bg-green-900 bg-opacity-20' : 'text-green-700 bg-green-100';
      case 'pending':
        return darkMode ? 'text-yellow-400 bg-yellow-900 bg-opacity-20' : 'text-yellow-700 bg-yellow-100';
      case 'cancelled':
        return darkMode ? 'text-red-400 bg-red-900 bg-opacity-20' : 'text-red-700 bg-red-100';
      default:
        return darkMode ? 'text-gray-400 bg-gray-900 bg-opacity-20' : 'text-gray-700 bg-gray-100';
    }
  };

  if (!registrations || registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`text-6xl ${darkMode ? 'text-gray-700' : 'text-gray-300'} mb-4`}>
          <i className="fas fa-user-plus"></i>
        </div>
        <h3 className={`text-xl font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
          No event registrations found
        </h3>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No one has registered for events yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {registrations.map((registration) => (
        <div
          key={registration._id}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedItems && onToggleSelect && (
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(registration._id)}
                    onChange={() => onToggleSelect(registration._id)}
                    className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                  />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {registration.firstName} {registration.lastName}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {registration.email}
                  </p>
                  {registration.phone && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {registration.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                  {registration.status}
                </span>
                <button
                  onClick={() => toggleExpanded(registration._id)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-200`}
                >
                  <i className={`fas fa-chevron-${expandedRows.includes(registration._id) ? 'up' : 'down'} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this registration?')) {
                        onDelete(registration._id);
                      }
                    }}
                    className={`p-2 rounded-lg text-red-500 hover:bg-red-50 ${darkMode ? 'hover:bg-red-900 hover:bg-opacity-20' : ''} transition-colors duration-200`}
                    title="Delete registration"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                )}
              </div>
            </div>

            {expandedRows.includes(registration._id) && (
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                      Event Details
                    </h4>
                    {registration.eventId && (
                      <div className="space-y-1">
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="font-medium">Event:</span> {registration.eventId.title}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="font-medium">Date:</span> {formatDate(registration.eventId.startDate)}
                        </p>
                        {registration.eventId.location && (
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="font-medium">Location:</span> {registration.eventId.location}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                      Registration Details
                    </h4>
                    <div className="space-y-1">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="font-medium">Registered:</span> {formatDate(registration.registrationDate)}
                      </p>
                      {registration.company && (
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="font-medium">Company:</span> {registration.company}
                        </p>
                      )}
                      {registration.attendees && registration.attendees > 1 && (
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="font-medium">Attendees:</span> {registration.attendees}
                        </p>
                      )}
                      {registration.specialRequests && (
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="font-medium">Special Requests:</span> {registration.specialRequests}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventRegistrationList;
