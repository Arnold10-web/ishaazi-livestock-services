// src/components/HeroSection.js
import React from 'react';
import MagazineCard from './MagazineCard';
import '../css/style.css';

const HeroSection = () => (
  <section className="hero-section">
    <div className="hero-content">
      <h1>Ishaazi Magazine, Empowering Farmers</h1>
      <p>Welcome to Ishaazi Magazine, your go-to source for the latest news, trends, cutting-edge developments, expert insights, 
          and in-depth analysis about the livestock industry.</p>
      <div className="hero-buttons">
        <a href="/services" className="btn-primary">Explore Services</a>
        <a href="/magazine/latest" className="btn-secondary">Read Latest Magazine</a>
      </div>
    </div>
    <div className="hero-magazine">
      <MagazineCard /> {/* Magazine card integrated here */}
    </div>
  </section>
);

export default HeroSection;
