import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

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
    { platform: 'facebook', url: 'https://facebook.com/yourpage' },
    { platform: 'twitter', url: 'https://twitter.com/yourpage' },
    { platform: 'instagram', url: 'https://instagram.com/yourpage' },
    { platform: 'whatsapp', url: 'https://wa.me/yournumber' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/yourprofile' },
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
      <div className="hidden md:block bg-[#C8F336] py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between">
         {/* Centered Links on all screen sizes */}
<div className="flex space-x-6 mb-2 lg:mb-0 justify-center w-full">
  {topLinks.map(({ to, label }) => (
    <Link
      key={to}
      to={to}
      className="text-sm text-gray-700 hover:text-orange-500 transition-colors font-medium"
    >
      {label}
    </Link>
  ))}
</div>
            
            {/* Social Icons */}
            <div className="flex items-center space-x-4">
              {socialLinks.map(({ platform, url }) => (
                <a
                  key={platform}
                  href={url}
                  className="transform hover:scale-110 transition-transform"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                >
                  <img
                    src={`/images/${platform}.png`}
                    alt={`${platform} icon`}
                    className="w-6 h-6"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-[#C8F336] border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/images/ishaazi.jpg"
                alt="Farmer's Weekly Logo"
                className="h-12 w-auto max-w-[200px] transition-all duration-300"
              />
            </Link>

            {/* Ad Space */}
            {showAd && (
              <div className="hidden md:block flex-1 mx-6 h-20 bg-gray-100 rounded-lg shadow-md overflow-hidden">
                <img
                  src={adBannerUrl || '/images/advert.jpeg'}
                  alt="Advertisement"
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-green-200"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Categories Navigation */}
      <div className="hidden md:block bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8">
            {categoryLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="py-4 px-2 text-sm font-bold uppercase text-gray-700 hover:text-orange-500 hover:bg-gray-200 transition-all transform hover:scale-105 rounded"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-white transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
        style={{ top: '0' }}
      >
        <div className="h-full overflow-y-auto py-4 bg-gray-50">
          <div className="flex flex-col space-y-2 px-4">
            {categoryLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="py-3 text-lg font-bold uppercase text-gray-700 hover:text-orange-500 border-b border-gray-200 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4">
              {topLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="block py-2 text-sm text-gray-700 hover:text-orange-500"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex space-x-4 pt-4">
              {socialLinks.map(({ platform, url }) => (
                <a
                  key={platform}
                  href={url}
                  className="transform hover:scale-110 transition-transform"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`/images/${platform}.png`}
                    alt={`${platform} icon`}
                    className="w-6 h-6"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;