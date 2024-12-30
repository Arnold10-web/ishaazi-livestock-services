// src/pages/Home.js
import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';

const Home = () => (

    <div className="main-content">
    <Header showAd={true} />
      <HeroSection />
     
     
      <Footer />
    </div>
   
);

export default Home;
