import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Facebook, Instagram, Linkedin, MessageCircle, Search } from 'lucide-react';
import DynamicAdComponent from './DynamicAdComponent';

const Header = ({ showAd, adBannerUrl }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

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

  // Search handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      // Focus search input when opening (for mobile/tablet)
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }, 100);
    }
  };

  const topLinks = [
    { to: '/auctions', label: 'Auctions' },
    { to: '/events', label: 'Events' },
    { to: '/advertisements', label: 'Advertise' },
    { to: '/suppliers', label: 'Suppliers' },
    { to: '/subscribe', label: 'Subscribe' },
    { to: '/contact', label: 'Contact' },
  ];

  const socialLinks = [
    { platform: 'Facebook', icon: <Facebook size={20} />, url: 'https://facebook.com/ishaaziservices' },
    { platform: 'X', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, url: 'https://x.com/ishaaziservices' },
    { platform: 'Instagram', icon: <Instagram size={20} />, url: 'https://instagram.com/ishaaziservices' },
    { platform: 'WhatsApp', icon: <MessageCircle size={20} />, url: 'https://wa.me/256700123456' },
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
      {/* Top Bar - Professional deep green */}
      <div className="hidden md:block bg-green-800 py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between">
            {/* Centered Links on all screen sizes */}
            <div className="flex space-x-6 mb-2 lg:mb-0 justify-center w-full">
              {topLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-white hover:text-amber-300 transition-colors font-medium relative group"
                >
                  {label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Social Icons */}
            <div className="flex items-center space-x-4">
              {socialLinks.map(({ platform, icon, url }) => (
                <a
                  key={platform}
                  href={url}
                  className="transform hover:scale-110 transition-transform p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white hover:text-amber-300"
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

      {/* Main Navigation - Clean white background */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 z-10">
              <img
                src="/images/ishaazi.jpg"
                alt="Farmer's Weekly Logo"
                className="h-12 w-auto max-w-[200px] transition-all duration-300 rounded shadow-sm"
              />
            </Link>

            {/* Main content area - flex container for ad and search */}
            <div className="hidden lg:flex flex-1 items-center justify-between mx-4">
              {/* Ad Component - positioned in middle, shifted slightly right */}
              <div className="flex-shrink-0 ml-8">
                <div className="xl:block hidden">
                  <DynamicAdComponent
                    adSlot="1234567890"
                    adFormat="horizontal"
                    adStyle={{ height: '60px', width: '300px', minWidth: '250px' }}
                  />
                </div>
                <div className="lg:block xl:hidden">
                  <DynamicAdComponent
                    adSlot="1234567890"
                    adFormat="horizontal"
                    adStyle={{ height: '50px', width: '200px', minWidth: '180px' }}
                  />
                </div>
              </div>

              {/* Desktop Search Bar - takes remaining space */}
              <div className="flex-1 max-w-md mx-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles, news, livestock tips..."
                    className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent shadow-sm text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-green-800 text-white rounded-full hover:bg-green-900 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Search and Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Search Button - Only visible on medium and smaller screens */}
              <button
                onClick={handleSearchToggle}
                className="lg:hidden p-2 rounded-full bg-green-800 text-white hover:bg-green-900 transition-all duration-300 shadow-md hover:shadow-lg"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden flex items-center space-x-2 p-2 rounded-md bg-green-800 text-white hover:bg-green-900 transition-all"
                aria-label="Toggle menu"
              >
                <span className="text-sm font-medium">Menu</span>
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search Bar - Expandable - Only for mobile/tablet when search button is clicked */}
          {showSearch && (
            <div className="lg:hidden pb-4 border-t border-gray-100 mt-2 pt-4">
              <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles, news, livestock tips..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent shadow-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-green-800 text-white rounded-full hover:bg-green-900 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </nav>

      {/* Categories Navigation */}
      <div className="hidden md:block bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8 overflow-x-auto">
            {categoryLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="py-4 px-3 text-sm font-bold uppercase text-gray-600 hover:text-green-800 transition-all relative group"
              >
                {label}
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-green-800 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
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
            {/* Mobile Search */}
            <div className="mb-4">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-green-800"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

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
            
            {/* Mobile Ad */}
            <div className="px-4 mb-4">
              <DynamicAdComponent
                adSlot="1122334455"
                adFormat="rectangle"
                adStyle={{ minHeight: '150px' }}
              />
            </div>
            
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