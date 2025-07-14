// Suppliers.js - Page for livestock suppliers and vendors
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Mail, Star, Filter, Grid, List } from 'lucide-react';
import DynamicAdComponent from '../components/DynamicAdComponent';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Mock supplier data - in production this would come from API
  useEffect(() => {
    const mockSuppliers = [
      {
        id: 1,
        name: "Premium Dairy Cattle Co.",
        category: "dairy",
        location: "Nairobi County",
        rating: 4.8,
        reviews: 124,
        description: "Leading supplier of high-quality dairy cattle and breeding services",
        services: ["Dairy Cattle", "Breeding Services", "Veterinary Support"],
        phone: "+254 700 123 456",
        email: "info@premiumdairy.co.ke",
        image: "/api/placeholder/300/200",
        verified: true,
        yearsInBusiness: 12
      },
      {
        id: 2,
        name: "East Africa Goat Breeders",
        category: "goats",
        location: "Kiambu County",
        rating: 4.6,
        reviews: 89,
        description: "Specialized in Boer goats, Dairy goats, and breeding programs",
        services: ["Boer Goats", "Dairy Goats", "Breeding Programs", "Training"],
        phone: "+254 722 654 321",
        email: "contact@eagoats.co.ke",
        image: "/api/placeholder/300/200",
        verified: true,
        yearsInBusiness: 8
      },
      {
        id: 3,
        name: "Modern Piggery Solutions",
        category: "pigs",
        location: "Nakuru County",
        rating: 4.7,
        reviews: 67,
        description: "Complete piggery setup and high-quality pig breeds",
        services: ["Yorkshire Pigs", "Large White", "Farm Setup", "Feed Supply"],
        phone: "+254 733 987 654",
        email: "sales@modernpiggery.ke",
        image: "/api/placeholder/300/200",
        verified: true,
        yearsInBusiness: 15
      },
      {
        id: 4,
        name: "Beef Masters Kenya",
        category: "beef",
        location: "Meru County",
        rating: 4.9,
        reviews: 156,
        description: "Premium beef cattle breeds and ranching consultancy",
        services: ["Angus Cattle", "Simmental", "Ranching Consultation", "Pasture Management"],
        phone: "+254 711 456 789",
        email: "info@beefmasters.ke",
        image: "/api/placeholder/300/200",
        verified: true,
        yearsInBusiness: 20
      },
      {
        id: 5,
        name: "Poultry Excellence Ltd",
        category: "poultry",
        location: "Machakos County",
        rating: 4.5,
        reviews: 203,
        description: "Day-old chicks, feeds, and complete poultry farming solutions",
        services: ["Day-old Chicks", "Poultry Feeds", "Equipment", "Technical Support"],
        phone: "+254 720 321 654",
        email: "orders@poultryexcellence.ke",
        image: "/api/placeholder/300/200",
        verified: true,
        yearsInBusiness: 10
      },
      {
        id: 6,
        name: "Sheep & Wool Co-op",
        category: "sheep",
        location: "Kajiado County",
        rating: 4.4,
        reviews: 78,
        description: "Dorper sheep, wool production, and cooperative farming",
        services: ["Dorper Sheep", "Wool Processing", "Cooperative Programs", "Training"],
        phone: "+254 734 567 890",
        email: "coop@sheepwool.ke",
        image: "/api/placeholder/300/200",
        verified: false,
        yearsInBusiness: 6
      }
    ];

    setTimeout(() => {
      setSuppliers(mockSuppliers);
      setFilteredSuppliers(mockSuppliers);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter suppliers based on search term, category, and location
  useEffect(() => {
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.services.some(service => 
          service.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(supplier => supplier.category === selectedCategory);
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(supplier => supplier.location === selectedLocation);
    }

    setFilteredSuppliers(filtered);
  }, [searchTerm, selectedCategory, selectedLocation, suppliers]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'dairy', label: 'Dairy Cattle' },
    { value: 'beef', label: 'Beef Cattle' },
    { value: 'goats', label: 'Goats' },
    { value: 'sheep', label: 'Sheep' },
    { value: 'pigs', label: 'Pigs' },
    { value: 'poultry', label: 'Poultry' }
  ];

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'Nairobi County', label: 'Nairobi County' },
    { value: 'Kiambu County', label: 'Kiambu County' },
    { value: 'Nakuru County', label: 'Nakuru County' },
    { value: 'Meru County', label: 'Meru County' },
    { value: 'Machakos County', label: 'Machakos County' },
    { value: 'Kajiado County', label: 'Kajiado County' }
  ];

  const SupplierCard = ({ supplier }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img 
          src={supplier.image} 
          alt={supplier.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {supplier.verified && (
          <span className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 text-xs rounded-full">
            Verified
          </span>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{supplier.name}</h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">{supplier.rating}</span>
            <span className="ml-1 text-sm text-gray-500">({supplier.reviews})</span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{supplier.location}</span>
        </div>
        
        <p className="text-gray-700 mb-4 line-clamp-2">{supplier.description}</p>
        
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Services:</p>
          <div className="flex flex-wrap gap-1">
            {supplier.services.slice(0, 3).map((service, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {service}
              </span>
            ))}
            {supplier.services.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{supplier.services.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <a 
              href={`tel:${supplier.phone}`}
              className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <Phone className="h-4 w-4 mr-1" />
              Call
            </a>
            <a 
              href={`mailto:${supplier.email}`}
              className="flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </a>
          </div>
          <span className="text-xs text-gray-500">{supplier.yearsInBusiness} years</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-48 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-16 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Ad */}
      <div className="py-4">
        <DynamicAdComponent 
          adSlot="1234567890"
          adFormat="horizontal"
          adStyle={{ minHeight: '90px' }}
        />
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Livestock Suppliers</h1>
          <p className="text-gray-600">Find verified suppliers for all your livestock needs</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {locations.map(location => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>

            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredSuppliers.length} of {suppliers.length} suppliers</span>
            <button className="flex items-center text-blue-600 hover:text-blue-800">
              <Filter className="h-4 w-4 mr-1" />
              More Filters
            </button>
          </div>
        </div>

        {/* Suppliers Grid */}
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg">No suppliers found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredSuppliers.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}

        {/* In-Content Ad */}
        <div className="py-8">
          <DynamicAdComponent 
            adSlot="1122334455"
            adFormat="rectangle"
            adStyle={{ minHeight: '200px' }}
          />
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Are you a livestock supplier?</h2>
          <p className="mb-4">Join our platform and connect with farmers across Kenya</p>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
            Register as Supplier
          </button>
        </div>
      </main>
    </div>
  );
};

export default Suppliers;
