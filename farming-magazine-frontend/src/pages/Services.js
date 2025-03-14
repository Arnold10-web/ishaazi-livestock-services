import React from 'react';
import {
  Camera,
  BookOpen,
  Users,
  BrainCircuit,
  LineChart,
  Globe2
} from 'lucide-react';

const ServiceCard = ({ icon: Icon, title, description, index }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group overflow-hidden relative">
    <div className="w-16 h-16 flex items-center justify-center rounded-lg mb-6 bg-amber-500 text-white transition-all duration-300 group-hover:bg-green-700 group-hover:rotate-6 group-hover:scale-110">
      <Icon size={28} />
    </div>
    
    <h3 className="text-xl font-semibold mb-3 text-green-800 group-hover:text-amber-500 transition-colors duration-300">{title}</h3>
    
    <p className="text-gray-600 mb-4">{description}</p>
    
    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <span className="text-amber-500 font-semibold inline-flex items-center">
        Learn More 
        <svg className="ml-1 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </span>
    </div>
    
    <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-green-700 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
  </div>
);

const Services = () => {
  const services = [
    {
      icon: Camera,
      title: "Media Coverage",
      description: "Comprehensive media coverage for agriculture events across East Africa, capturing key moments and innovations in the agricultural sector."
    },
    {
      icon: BookOpen,
      title: "Publication Services",
      description: "High-quality publications focused on sustainable farming practices, industry trends, and agricultural innovations."
    },
    {
      icon: Users,
      title: "Farmer Training",
      description: "Empowering farmers through comprehensive training programs designed to enhance skills and knowledge in modern farming practices."
    },
    {
      icon: BrainCircuit,
      title: "Agricultural Consultancy",
      description: "Expert consultancy services in farm management, production optimization, and strategic agricultural planning."
    },
    {
      icon: LineChart,
      title: "Market Analysis",
      description: "In-depth market research and analysis to help farmers and agricultural businesses make informed decisions."
    },
    {
      icon: Globe2,
      title: "International Networking",
      description: "Connecting local farmers with international agricultural networks and opportunities for growth and collaboration."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 text-center bg-gradient-to-b from-green-50 to-transparent">
        <h1 className="text-5xl font-bold text-green-800 mb-4 animate-fade-in-down">
          Our Services
        </h1>
        
        <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full mb-6 animate-expand"></div>
        
        <p className="text-gray-600 max-w-2xl mx-auto text-lg animate-fade-in">
          Empowering Agriculture Through Innovation and Expertise
        </p>
      </div>
      
      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
            <ServiceCard
              icon={service.icon}
              title={service.title}
              description={service.description}
              index={index}
            />
          </div>
        ))}
      </div>
      
      {/* CTA Section */}
      <div className="py-20 px-4 text-center bg-gradient-to-t from-green-50 to-transparent mt-12">
        <h2 className="text-3xl font-bold text-green-800 mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 max-w-xl mx-auto">Let us help you achieve your agricultural goals</p>
        <button className="mt-8 px-8 py-3 bg-amber-500 text-white font-medium rounded-full hover:bg-green-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          Contact Us Today
        </button>
      </div>
    </div>
  );
};

export default Services;