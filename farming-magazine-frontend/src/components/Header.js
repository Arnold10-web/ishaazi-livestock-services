import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Facebook, Twitter, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import AdBanner from './AdBanner';

const Header = ({ showAd, adBannerUrl }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  const topLinks = [
    { to: '/auctions', label: 'Auctions' },
    { to: '/events', label: 'Events' },
    { to: '/advertise', label: 'Advertise' },
    { to: '/suppliers', label: 'Suppliers' },
    { to: '/subscribe', label: 'Subscribe' },
    { to: '/contact', label: 'Contact' },
  ];

  const socialLinks = [
    { platform: 'Facebook', icon: <Facebook size={20} />, url: 'https://facebook.com/yourpage' },
    { platform: 'Twitter', icon: <Twitter size={20} />, url: 'https://twitter.com/yourpage' },
    { platform: 'Instagram', icon: <Instagram size={20} />, url: 'https://instagram.com/yourpage' },
    { platform: 'WhatsApp', icon: <MessageCircle size={20} />, url: 'https://wa.me/yournumber' },
    { platform: 'LinkedIn', icon: <Linkedin size={20} />, url: 'https://linkedin.com/in/yourprofile' },
  ];

  const categoryLinks = [
    { to: '/', label: 'Home' },
    { to: '/news', label: 'News' },
    { to: '/services', label: 'Services' },
    { to: '/dairy', label: 'Dairy' },
    { to: '/beef', label: 'Beef' },
    { to: '/goats', label: 'Goats' },
    { to: '/piggery', label: 'Piggery' },
    { to: '/basic', label: 'Farm Basics' },
    { to: '/farm', label: 'Farms For Sale' },
  ];

  return (
    <header 
      className={`sticky top-0 w-full z-50 transition-all duration-300 font-sans bg-white ${
        isScrolled ? 'shadow-lg' : ''
      }`}
    >
      {/* Top Bar */}
      <div className="hidden md:block bg-gradient-to-r from-[#2D5016] to-[#3D6B1F] py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between">
            {/* Centered Links on all screen sizes */}
            <div className="flex space-x-6 mb-2 lg:mb-0 justify-center w-full">
              {topLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-[#F5F5DC] hover:text-[#DAA520] transition-colors font-medium relative group"
                >
                  {label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#DAA520] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Social Icons */}
            <div className="flex items-center space-x-4">
              {socialLinks.map(({ platform, icon, url }) => (
                <a
                  key={platform}
                  href={url}
                  className="transform hover:scale-110 transition-transform p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-[#F5F5DC] hover:text-[#DAA520]"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-gradient-to-r from-[#F5F5DC] to-white border-b border-[#2D5016] border-opacity-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/images/ishaazi.jpg"
                alt="Farmer's Weekly Logo"
                className="h-12 w-auto max-w-[200px] transition-all duration-300 rounded shadow-sm"
              />
            </Link>

            {/* Strategic Ad Space */}
            <div className="hidden md:block flex-1 mx-6">
              <AdBanner
                position="header"
                size="banner"
                category="farming"
                showCloseButton={false}
                autoRotate={true}
                rotationInterval={45000}
                className="h-16"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center space-x-2 p-2 rounded-md bg-[#2D5016] text-[#F5F5DC] hover:text-white hover:bg-[#3D6B1F] transition-all"
              aria-label="Toggle menu"
            >
              <span className="text-sm font-medium">Menu</span>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Categories Navigation */}
      <div className="hidden md:block bg-gradient-to-r from-[#8B4513] to-[#A0522D] border-b border-[#2D5016] border-opacity-30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8 overflow-x-auto">
            {categoryLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="py-4 px-3 text-sm font-bold uppercase text-[#F5F5DC] hover:text-[#DAA520] transition-all relative group"
              >
                {label}
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#DAA520] transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Redesigned to not cover the whole screen */}
      <div
        className={`fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden z-50`}
      >
        <div className="h-full overflow-y-auto py-4 bg-gray-50">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Menu</h2>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col space-y-1 px-4 pt-4">
            {categoryLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="py-3 px-3 text-lg font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-100 rounded-lg transition-all"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            
            <div className="h-px bg-gray-200 my-4"></div>
            
            <div className="space-y-2">
              {topLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="block py-2 px-3 text-sm text-gray-600 hover:text-orange-500 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
            
            <div className="h-px bg-gray-200 my-4"></div>
            
            <div className="flex justify-around py-4">
              {socialLinks.map(({ platform, icon, url }) => (
                <a
                  key={platform}
                  href={url}
                  className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-[#C8F336] hover:text-gray-800 transition-all"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay when mobile menu is open */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;