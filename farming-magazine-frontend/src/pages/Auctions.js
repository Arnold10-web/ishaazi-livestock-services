import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Calendar, Phone, Eye } from 'lucide-react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import DynamicAdComponent from '../components/DynamicAdComponent';

const Auctions = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('upcoming');
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [selectedAuction, setSelectedAuction] = useState(null);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                setLoading(true);
                const response = await axios.get(API_ENDPOINTS.GET_AUCTIONS, {
                    params: {
                        category: selectedCategory,
                        location: selectedLocation,
                        status: selectedStatus,
                        limit: 20
                    }
                });
                
                if (response.data && response.data.success) {
                    setAuctions(response.data.data.auctions);
                    setError(null);
                } else {
                    throw new Error('Failed to fetch auctions');
                }
            } catch (error) {
                console.error('Error fetching auctions:', error);
                setError('Failed to load auctions. Please try again later.');
                setAuctions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAuctions();
    }, [selectedCategory, selectedLocation, selectedStatus]);

    const filteredAuctions = auctions.filter(auction =>
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRegisterInterest = async (auctionId, formData) => {
        try {
            const response = await axios.post(
                API_ENDPOINTS.REGISTER_AUCTION_INTEREST(auctionId),
                formData
            );
            
            if (response.data && response.data.success) {
                alert('Interest registered successfully!');
                setShowRegistrationModal(false);
                setSelectedAuction(null);
            } else {
                throw new Error('Failed to register interest');
            }
        } catch (error) {
            console.error('Error registering interest:', error);
            alert(error.response?.data?.message || 'Failed to register interest. Please try again.');
        }
    };

    const RegistrationModal = () => {
        const [formData, setFormData] = useState({ name: '', contact: '' });

        const handleSubmit = (e) => {
            e.preventDefault();
            if (formData.name && formData.contact) {
                handleRegisterInterest(selectedAuction._id, formData);
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold mb-4 text-green-700">
                        Register Interest - {selectedAuction?.title}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact (Phone/Email)
                            </label>
                            <input
                                type="text"
                                value={formData.contact}
                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Phone number or email"
                                required
                            />
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button
                                type="submit"
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                            >
                                Register Interest
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRegistrationModal(false);
                                    setSelectedAuction(null);
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const AuctionCard = ({ auction }) => (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            {auction.imageUrl && (
                <img 
                    src={auction.imageUrl} 
                    alt={auction.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                />
            )}
            
            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{auction.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        auction.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                        auction.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        auction.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {auction.status}
                    </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{auction.description}</p>
                
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                            {new Date(auction.date).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm">{auction.startTime} - {auction.endTime}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{auction.location}</span>
                    </div>
                    {auction.views > 0 && (
                        <div className="flex items-center text-gray-600">
                            <Eye className="h-4 w-4 mr-2" />
                            <span className="text-sm">{auction.views} views</span>
                        </div>
                    )}
                </div>

                {auction.livestock && auction.livestock.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Livestock Categories:</p>
                        <div className="flex flex-wrap gap-1">
                            {auction.livestock.slice(0, 3).map((item, index) => (
                                <span 
                                    key={index}
                                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                                >
                                    {item.category}
                                </span>
                            ))}
                            {auction.livestock.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    +{auction.livestock.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex space-x-2">
                    <button 
                        onClick={() => {
                            setSelectedAuction(auction);
                            setShowRegistrationModal(true);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        disabled={auction.status !== 'upcoming'}
                    >
                        {auction.status === 'upcoming' ? 'Register Interest' : 'View Details'}
                    </button>
                    {auction.auctioneer?.contact?.phone && (
                        <a 
                            href={`tel:${auction.auctioneer.contact.phone}`}
                            className="px-3 py-2 border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <div className="text-xl">Loading auctions...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl text-red-600 mb-4">{error}</div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'cattle', label: 'Cattle' },
        { value: 'dairy', label: 'Dairy' },
        { value: 'beef', label: 'Beef' },
        { value: 'goats', label: 'Goats' },
        { value: 'sheep', label: 'Sheep' },
        { value: 'pigs', label: 'Pigs' },
        { value: 'poultry', label: 'Poultry' }
    ];

    const locations = [
        { value: 'all', label: 'All Locations' },
        { value: 'kampala', label: 'Kampala' },
        { value: 'wakiso', label: 'Wakiso' },
        { value: 'mukono', label: 'Mukono' },
        { value: 'jinja', label: 'Jinja' },
        { value: 'mbale', label: 'Mbale' },
        { value: 'mbarara', label: 'Mbarara' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            {/* Header Ad */}
            <div className="py-4">
                <DynamicAdComponent 
                    adSlot="1234567890"
                    adFormat="horizontal"
                    adStyle={{ minHeight: '90px' }}
                />
            </div>

            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Livestock Auctions</h1>
                    <p className="text-xl text-gray-600">Find and participate in livestock auctions across Uganda</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search auctions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            {categories.map(category => (
                                <option key={category.value} value={category.value}>
                                    {category.label}
                                </option>
                            ))}
                        </select>

                        {/* Location Filter */}
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            {locations.map(location => (
                                <option key={location.value} value={location.value}>
                                    {location.label}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="all">All Status</option>
                        </select>
                    </div>
                </div>

                {/* Results */}
                {filteredAuctions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-xl text-gray-600 mb-4">
                            No auctions found matching your criteria
                        </div>
                        <p className="text-gray-500">
                            Try adjusting your filters or check back later for new auctions
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Showing {filteredAuctions.length} auction{filteredAuctions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredAuctions.map((auction) => (
                                <AuctionCard key={auction._id} auction={auction} />
                            ))}
                        </div>
                    </>
                )}

                {/* In-Content Ad */}
                <div className="py-8">
                    <DynamicAdComponent 
                        adSlot="1122334455"
                        adFormat="rectangle"
                        adStyle={{ minHeight: '200px' }}
                    />
                </div>

                {/* Registration Modal */}
                {showRegistrationModal && <RegistrationModal />}
            </div>
        </div>
    );
};

export default Auctions;
