import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Users, BrainCircuit } from 'lucide-react';

const ServicesSection = () => {
  const services = [
    {
      icon: <Camera className="w-6 h-6 text-white" />,
      title: "Media Coverage",
      description: "Comprehensive media coverage for agriculture events across East Africa, capturing and sharing industry innovations.",
      color: "bg-amber-500"
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: "Farmer Training",
      description: "Empowering farmers with skills and knowledge through comprehensive training programs designed for success.",
      color: "bg-green-700"
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-white" />,
      title: "Consultancy",
      description: "Expert consultancy in farm management, production optimization, animal health, and strategic planning.",
      color: "bg-amber-500"
    }
  ];

  return (
    <section className="w-full py-8 bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Link 
            to="/services"
            className="group cursor-pointer"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 relative inline-block hover:text-amber-600 transition-colors duration-300">
              Our Services
              <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-amber-500 rounded-full group-hover:w-32 transition-all duration-300"></span>
            </h2>
          </Link>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Dedicated to supporting agricultural excellence through comprehensive services tailored to modern farming needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Link
              key={index}
              to="/services"
              className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group relative overflow-hidden cursor-pointer block"
            >
              {/* Decorative corner accent */}
              <div className="absolute -right-4 -top-4 w-16 h-16 opacity-10 rounded-full bg-gray-400 group-hover:bg-amber-500 transition-colors duration-300"></div>
              
              {/* Icon container */}
              <div className={`${service.color} w-16 h-16 rounded-lg flex items-center justify-center mb-6 shadow-md transform transition-transform duration-300 group-hover:rotate-6`}>
                {service.icon}
              </div>
              
              {/* Service title */}
              <h3 className="text-xl font-semibold text-green-800 mb-4 group-hover:text-amber-600 transition-colors duration-300">
                {service.title}
              </h3>
              
              {/* Service description */}
              <p className="text-gray-600 leading-relaxed mb-6">
                {service.description}
              </p>
              
              {/* Learn more button - always visible */}
              <div className="transition-all duration-300 transform">
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center hover:from-amber-600 hover:to-amber-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Learn more
                  <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;