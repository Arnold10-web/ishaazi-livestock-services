// src/pages/Services.js
import React from 'react';
import Footer from '../components/Footer';
import '../css/Services.css'
import { 
  Camera, 
  BookOpen, 
  Users, 
  BrainCircuit, 
  LineChart, 
  Globe2 
} from 'lucide-react';

const ServiceCard = ({ icon: Icon, title, description, delay }) => (
  <div className="service-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="icon-wrapper">
      <Icon size={32} />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
    <div className="hover-reveal">
      <span className="learn-more">Learn More →</span>
    </div>
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
    <div>
   
      
      <main className="services-page">
        <div className="services-hero">
          <h1>Our Services</h1>
          <div className="animated-bar"></div>
          <p>Empowering Agriculture Through Innovation and Expertise</p>
        </div>

        <section className="services-grid">
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              delay={index * 100}
            />
          ))}
        </section>

        <section className="services-cta">
          <h2>Ready to Get Started?</h2>
          <p>Let us help you achieve your agricultural goals</p>
          <button className="cta-button">Contact Us Today</button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;