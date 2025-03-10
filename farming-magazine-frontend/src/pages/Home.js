// src/pages/Home.js
import React from 'react';
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';
import ServicesSection from '../components/ServicesSection';
import '../css/style.css';
const Home = () => (

    <div className="main-content">
 
      <HeroSection />
     
      <ServicesSection />   
      <Footer />
    </div>
   
);

export default Home;
