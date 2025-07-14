import React, { useState, useEffect } from 'react';
import apiConfig from '../config/apiConfig';

const AuctionManagement = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    livestockCategory: 'cattle',
    auctioneerName: '',
    auctioneerContact: '',
    location: '',
    date: '',
    estimatedPrice: '',
    image: null
  });

  const categories = ['cattle', 'goats', 'sheep', 'pigs', 'poultry', 'other'];

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiConfig.auctions.getAdminAuctions, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('myAppAdminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuctions(data.data || []);
      } else {
        setError('Failed to fetch auctions');
      }
    } catch (err) {
      setError('Error fetching auctions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const url = editingAuction 
        ? apiConfig.auctions.updateAuction.replace(':id', editingAuction._id)
        : apiConfig.auctions.createAuction;
      
      const method = editingAuction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('myAppAdminToken')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        await fetchAuctions();
        resetForm();
        setShowCreateModal(false);
        setEditingAuction(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save auction');
      }
    } catch (err) {
      setError('Error saving auction: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) return;
    
    try {
      const response = await fetch(apiConfig.auctions.deleteAuction.replace(':id', id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('myAppAdminToken')}`
        }
      });

      if (response.ok) {
        await fetchAuctions();
      } else {
        setError('Failed to delete auction');
      }
    } catch (err) {
      setError('Error deleting auction: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      livestockCategory: 'cattle',
      auctioneerName: '',
      auctioneerContact: '',
      location: '',
      date: '',
      estimatedPrice: '',
      image: null
    });
  };

  const openEditModal = (auction) => {
    setEditingAuction(auction);
    setFormData({
      title: auction.title,
      description: auction.description,
      livestockCategory: auction.livestockCategory,
      auctioneerName: auction.auctioneerName,
      auctioneerContact: auction.auctioneerContact,
      location: auction.location,
      date: auction.date.split('T')[0], // Format for date input
      estimatedPrice: auction.estimatedPrice,
      image: null // Don't pre-fill image
    });
    setShowCreateModal(true);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Auction Management</h2>
        <button
          onClick={() => {
            resetForm();
            setEditingAuction(null);
            setShowCreateModal(true);
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          <i className="fas fa-plus mr-2"></i>Create Auction
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Auctions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <div key={auction._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {auction.image && (
              <img
                src={`/uploads/images/${auction.image}`}
                alt={auction.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {auction.title}
                </h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  auction.status === 'live' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {auction.status}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                {auction.description}
              </p>
              
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <i className="fas fa-tag mr-2"></i>
                  <span className="capitalize">{auction.livestockCategory}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  <span>{auction.location}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-calendar mr-2"></i>
                  <span>{formatDate(auction.date)}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-dollar-sign mr-2"></i>
                  <span>${auction.estimatedPrice?.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-users mr-2"></i>
                  <span>{auction.interestedBuyers?.length || 0} interested</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => openEditModal(auction)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition duration-200"
                >
                  <i className="fas fa-edit mr-1"></i>Edit
                </button>
                <button
                  onClick={() => handleDelete(auction._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition duration-200"
                >
                  <i className="fas fa-trash mr-1"></i>Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {auctions.length === 0 && !loading && (
        <div className="text-center py-12">
          <i className="fas fa-gavel text-6xl text-gray-400 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No auctions found</h3>
          <p className="text-gray-500 dark:text-gray-400">Create your first auction to get started.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editingAuction ? 'Edit Auction' : 'Create New Auction'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAuction(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Livestock Category *
                </label>
                <select
                  required
                  value={formData.livestockCategory}
                  onChange={(e) => setFormData({ ...formData, livestockCategory: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Auctioneer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.auctioneerName}
                    onChange={(e) => setFormData({ ...formData, auctioneerName: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.auctioneerContact}
                    onChange={(e) => setFormData({ ...formData, auctioneerContact: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Price
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedPrice}
                    onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAuction(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition duration-200"
                >
                  {editingAuction ? 'Update' : 'Create'} Auction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionManagement;
