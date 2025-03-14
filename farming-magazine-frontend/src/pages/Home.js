import React from 'react';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';

const Home = () => (
  <div className="min-h-screen bg-gray-50">
    <main className="max-w-7xl mx-auto">
      <HeroSection />
      <ServicesSection />
    </main>
  </div>
);

export default Home;