import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, Star, Users, Globe, TrendingUp } from 'lucide-react';
import DynamicAdComponent from '../components/DynamicAdComponent';

const Advertisements = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  // Contact site owner modal
  const ContactOwnerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4 text-green-700">Contact Ishaazi Livestock Services</h3>
        <p className="text-gray-600 mb-6">
          Get in touch with us to discuss your advertising needs and requirements.
        </p>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Phone className="text-green-600" size={20} />
            <div>
              <p className="font-medium">Call Us</p>
              <p className="text-green-600">+256 700 123 456</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-green-600" size={20} />
            <div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-green-600">+256 700 123 456</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="text-green-600" size={20} />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-green-600">info@ishaazilivestockservices.com</p>
            </div>
          </div>
          <div className="mt-6 flex space-x-3">
            <a 
              href="tel:+256700123456" 
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-center hover:bg-green-700 transition-colors"
            >
              Call Now
            </a>
            <a 
              href="https://wa.me/256700123456?text=Hi, I'm interested in advertising opportunities with Ishaazi Livestock Services" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-center hover:bg-green-700 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <button 
          onClick={() => setShowContactModal(false)}
          className="mt-4 w-full text-gray-600 hover:text-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Advertise With Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Reach Uganda's farming community through Ishaazi Livestock Services - your trusted partner in agricultural communication.
          </p>
        </div>

        {/* Why Advertise With Us */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose Our Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Targeted Audience</h3>
              <p className="text-gray-600 text-sm">Reach farmers, livestock owners, and agricultural professionals across Uganda</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Globe className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Wide Reach</h3>
              <p className="text-gray-600 text-sm">Connect with farming communities throughout all regions of Uganda</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Growing Platform</h3>
              <p className="text-gray-600 text-sm">Join our expanding network of agricultural service providers and suppliers</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Trusted Brand</h3>
              <p className="text-gray-600 text-sm">Leverage our reputation as a reliable source of livestock information</p>
            </div>
          </div>
        </div>

        {/* Advertising Options */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Advertising Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Display Ads</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Banner advertisements</li>
                <li>• Sidebar placements</li>
                <li>• Header/footer positions</li>
                <li>• Custom sizing options</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Marketing</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Sponsored articles</li>
                <li>• Product features</li>
                <li>• Educational content</li>
                <li>• Case studies</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Directory Listings</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Business profiles</li>
                <li>• Service listings</li>
                <li>• Product catalogs</li>
                <li>• Contact information</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Perfect For Section */}
        <div className="bg-green-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Agricultural Businesses</h3>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Feed suppliers and manufacturers</li>
                <li>• Veterinary services and clinics</li>
                <li>• Farm equipment dealers</li>
                <li>• Livestock transporters</li>
                <li>• Agricultural banks and financing</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Providers</h3>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Farm consultants and advisors</li>
                <li>• Agricultural training institutes</li>
                <li>• Insurance companies</li>
                <li>• Technology providers</li>
                <li>• Government agencies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* In-Content Ad */}
        <div className="py-8">
          <DynamicAdComponent 
            adSlot="1122334455"
            adFormat="rectangle"
            adStyle={{ minHeight: '200px' }}
          />
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Advertising?</h2>
          <p className="text-xl mb-6 opacity-90">
            Contact us today to discuss your advertising needs and get a customized quote
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-white text-green-700 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Us Now
            </button>
            <div className="flex space-x-4">
              <a 
                href="tel:+256700123456" 
                className="bg-green-800 text-white px-6 py-3 rounded-md hover:bg-green-900 transition-colors flex items-center space-x-2"
              >
                <Phone size={18} />
                <span>Call</span>
              </a>
              <a 
                href="https://wa.me/256700123456?text=Hi, I'm interested in advertising opportunities with Ishaazi Livestock Services" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-800 text-white px-6 py-3 rounded-md hover:bg-green-900 transition-colors flex items-center space-x-2"
              >
                <MessageSquare size={18} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && <ContactOwnerModal />}
      </div>
    </div>
  );
};

export default Advertisements;
