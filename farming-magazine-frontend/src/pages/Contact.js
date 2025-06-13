/**
 * Contact Page Component
 * 
 * Page displaying contact information and providing a contact form for users
 * to reach out to the farming magazine staff. Features office locations,
 * phone numbers, email addresses, and business hours.
 * 
 * @module pages/Contact
 */
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, Users } from 'lucide-react';
import DynamicAdComponent from '../components/DynamicAdComponent';

/**
 * Renders the complete contact page with form and contact information
 *
 * @returns {JSX.Element} Rendered contact page
 */
const Contact = () => {
  /**
   * Form state for contact form fields
   * Managed as a single object for easier form handling
   */
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  });

  /**
   * Handle contact form submission
   * Currently a placeholder for the actual submission logic
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    // Existing form submission logic would go here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Ad */}
      <div className="py-4 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <DynamicAdComponent 
            adSlot="1234567890"
            adFormat="horizontal"
            adStyle={{ minHeight: '90px' }}
          />
        </div>
      </div>

      <main className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Get In Touch
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions about farming, need advice, or want to share your story? 
            We're here to help connect the farming community and provide the support you need.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 mb-16">
          {/* Contact Information Section */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>
              
              {/* Contact Cards */}
              <div className="space-y-6">
                {/* Email Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-green-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Mail className="text-green-600 w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">Email Us</h3>
                      <p className="text-gray-600 mb-2">General inquiries and support</p>
                      <a href="mailto:info@farmersweekly.com" className="text-green-600 hover:text-green-700 font-medium">
                        info@farmersweekly.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-green-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Phone className="text-blue-600 w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">Call Us</h3>
                      <p className="text-gray-600 mb-2">Mon-Fri, 8AM-6PM</p>
                      <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700 font-medium">
                        +123-456-7890
                      </a>
                    </div>
                  </div>
                </div>

                {/* Address Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-green-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <MapPin className="text-orange-600 w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">Visit Us</h3>
                      <p className="text-gray-600 mb-2">Our main office</p>
                      <p className="text-orange-600 font-medium">
                        123 Agriculture Road<br />
                        Farming District, City 12345
                      </p>
                    </div>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-green-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Clock className="text-purple-600 w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">Office Hours</h3>
                      <div className="text-gray-600 space-y-1">
                        <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                        <p>Saturday: 9:00 AM - 4:00 PM</p>
                        <p>Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      required
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                      value={formState.name}
                      onChange={(e) => setFormState({...formState, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      required
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                      value={formState.email}
                      onChange={(e) => setFormState({...formState, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    placeholder="Tell us how we can help you..."
                    required
                    rows="6"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 resize-none text-gray-900 placeholder-gray-500"
                    value={formState.message}
                    onChange={(e) => setFormState({...formState, message: e.target.value})}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-8 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <span>Send Message</span>
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* Map Section */}
        <div className="mb-16">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Our Location</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Visit us at our main office or use the map below to get directions.
              </p>
            </div>
            <div className="relative w-full h-96 rounded-xl overflow-hidden border border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1234.5678!2d-123.456789!3d12.345678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM0LCsDEyJzM0LjUiTiAxMjPCsDI3JzM0LjUiVw!5e0!3m2!1sen!2sus!4v1234567890123"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              ></iframe>
            </div>
          </div>
        </div>

        {/* In-Content Ad */}
        <div className="mb-16">
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <DynamicAdComponent 
              adSlot="1122334455"
              adFormat="rectangle"
              adStyle={{ minHeight: '200px' }}
            />
          </div>
        </div>

        {/* Why Contact Us Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Contact Us?</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              We're here to support the farming community with expert advice, resources, and connections.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Support</h3>
              <p className="text-gray-600">
                Connect with agricultural experts and experienced farmers for guidance and advice.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="text-blue-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-gray-600">
                We respond to all inquiries within 24 hours during business days.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="text-orange-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multiple Channels</h3>
              <p className="text-gray-600">
                Reach us via phone, email, or visit our office - whatever works best for you.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;