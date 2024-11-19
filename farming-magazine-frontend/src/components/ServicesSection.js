// src/components/ServicesSection.js
import React from 'react';
import '../css/servicesection.css';

const ServicesSection = () => (
  <section id="services" className="services-section">
    <h2 className="section-title">Our Services</h2>
    <div className="service-cards">
      <div className="service-card">
        <img src="/images/service1.jpg" alt="Service 1" />
        <h3>Media coverage for agriculture events</h3>
        <p>
          At Ishaazi Livestock Services, we offer comprehensive media coverage for 
          agriculture events across East Africa.
        </p>
      </div>
      <div className="service-card">
        <img src="/images/service2.jpg" alt="Service 2" />
        <h3>Farmer and Farmer Group Trainings</h3>
        <p>
          Empowering farmers is at the heart of our mission. We offer a variety of training programs 
          designed to equip farmers with the skills and knowledge they need to succeed.
        </p>
      </div>
      <div className="service-card">
        <img src="/images/consultancy.png" alt="Service 3" />
        <h3>Consultancy</h3>
        <p>
          Our team of experienced consultants provides tailored solutions to meet the unique needs of 
          our clients. We offer a range of consultancy services, including farm management, production 
          optimization, animal health, market analysis, and strategic planning. By leveraging our expertise 
          and industry insights, we help our clients make informed decisions and achieve their business 
          objectives.
        </p>
      </div>
    </div>
  </section>
);

export default ServicesSection;
