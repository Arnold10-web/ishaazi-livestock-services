// src/pages/Home.js
import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';


import Footer from '../components/Footer';

const Home = () => (

    <div className="main-content">
    <Header showAd={true} />
      <HeroSection />
      <ServicesSection />
     
      <Footer />
    </div>
   
);

export default Home;
