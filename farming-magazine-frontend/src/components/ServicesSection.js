import React from 'react';
import { Camera, Users, BrainCircuit } from 'lucide-react';
import '../css/ServicesSection.css';
const ServicesSection = () => {
  return (
    <div className="services-wrapper">
      <div className="services-container">
        <h2 className="services-title">
          Our Services
          <span className="title-underline"/>
        </h2>
        
        <div className="services-grid">
          {/* Media Coverage Card */}
          <div className="service-card">
            <div className="icon-container">
              <Camera />
            </div>
            <h3 className="service-title">
              Media Coverage
            </h3>
            <p className="service-description">
              Comprehensive media coverage for agriculture events across East Africa, capturing and sharing industry innovations.
            </p>
          </div>

          {/* Training Card */}
          <div className="service-card">
            <div className="icon-container green">
              <Users />
            </div>
            <h3 className="service-title">
              Farmer Training
            </h3>
            <p className="service-description">
              Empowering farmers with skills and knowledge through comprehensive training programs designed for success.
            </p>
          </div>

          {/* Consultancy Card */}
          <div className="service-card">
            <div className="icon-container">
              <BrainCircuit />
            </div>
            <h3 className="service-title">
              Consultancy
            </h3>
            <p className="service-description">
              Expert consultancy in farm management, production optimization, animal health, and strategic planning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesSection;