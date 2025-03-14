import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Contact = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Existing form submission logic would go here
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
     <Header showAd={true} />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <section className="space-y-8">
          {/* Animated Header Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl font-bold text-[#4b774f] mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600">
              Reach out to Farmer's Weekly for inquiries, support, or feedback.
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 my-8">
            {/* Email Card */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <Mail className="text-[#e2a800] w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-gray-800">Email</h3>
                  <p className="text-gray-600">info@farmersweekly.com</p>
                </div>
              </div>
            </div>

            {/* Phone Card */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <Phone className="text-[#e2a800] w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-gray-800">Phone</h3>
                  <p className="text-gray-600">+123-456-7890</p>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <MapPin className="text-[#e2a800] w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-gray-800">Address</h3>
                  <p className="text-gray-600">123 Agriculture Rd., City</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-semibold text-[#4b774f] mb-4">Find Us</h2>
            <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-inner">
              {/* Replace the iframe src with your Google Maps embed URL */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1234.5678!2d-123.456789!3d12.345678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM0LCsDEyJzM0LjUiTiAxMjPCsDI3JzM0LjUiVw!5e0!3m2!1sen!2sus!4v1234567890123"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
                title="Location Map"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <form 
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-lg shadow-lg space-y-6 max-w-2xl mx-auto"
          >
            <div className="space-y-4">
              <div className="transform transition-all duration-300 hover:translate-x-2">
                <input
                  type="text"
                  placeholder="Name"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e2a800] focus:border-transparent outline-none transition-all duration-300"
                  value={formState.name}
                  onChange={(e) => setFormState({...formState, name: e.target.value})}
                />
              </div>

              <div className="transform transition-all duration-300 hover:translate-x-2">
                <input
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e2a800] focus:border-transparent outline-none transition-all duration-300"
                  value={formState.email}
                  onChange={(e) => setFormState({...formState, email: e.target.value})}
                />
              </div>

              <div className="transform transition-all duration-300 hover:translate-x-2">
                <textarea
                  placeholder="Your message"
                  required
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e2a800] focus:border-transparent outline-none transition-all duration-300 resize-none"
                  value={formState.message}
                  onChange={(e) => setFormState({...formState, message: e.target.value})}
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#4b774f] text-white py-3 px-6 rounded-lg hover:bg-[#3a5c3d] transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>Send Message</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;