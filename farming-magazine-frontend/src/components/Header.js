import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Home,
  BookOpen,
  Newspaper,
  MessageSquare,
  Building,
  Search,
  Zap,
  Sparkles,
  ChevronDown,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';
import PerformanceMonitor from './PerformanceMonitor';

const Header = ({ showAd, adBannerUrl }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const location = useLocation();

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
    { to: '/advertisements', label: 'Advertisements' },
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
    { to: '/dairy', label: 'Dairy' },
    { to: '/beef', label: 'Beef' },
    { to: '/goats', label: 'Goats' },
    { to: '/piggery', label: 'Piggery' },
    { to: '/services', label: 'Services' },
    { to: '/basic', label: 'Farm Basics' },
    { to: '/farm', label: 'Farms For Sale' },
  ];

  const mobileNavItems = [
    { to: '/', icon: <Home size={20} />, label: 'Home' },
    { to: '/news', icon: <Newspaper size={20} />, label: 'News' },
    { to: '/basic', icon: <BookOpen size={20} />, label: 'Basics' },
    { to: '/farm', icon: <Building size={20} />, label: 'Farms' },
    { to: '/contact', icon: <MessageSquare size={20} />, label: 'Contact' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`sticky top-0 w-full z-50 transition-all duration-300 font-sans ${
        isScrolled
          ? 'bg-white shadow-lg border-b border-neutral-200'
          : 'bg-white/95 shadow-sm'
      }`}
    >
      {/* Enhanced Top Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="hidden md:block bg-primary-500 py-3"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between">
            {/* Enhanced Links */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex space-x-8 mb-2 lg:mb-0 justify-center w-full"
            >
              {topLinks.map(({ to, label }, index) => (
                <motion.div
                  key={to}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link
                    to={to}
                    className="text-sm text-white hover:text-accent-200 transition-colors duration-200 font-medium px-3 py-2 rounded-lg hover:bg-primary-600"
                  >
                    {label}
                    <motion.span 
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"
                      whileHover={{ width: "100%" }}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Enhanced Social Icons */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-3"
            >
              {socialLinks.map(({ platform, icon, url }, index) => (
                <motion.a
                  key={platform}
                  href={url}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * index, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white hover:text-accent-200 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                >
                  {icon}
                </motion.a>
              ))}

              {/* Performance Monitor Button */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPerformanceMonitor(true)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white hover:text-accent-200 transition-colors duration-200"
                aria-label="Performance Monitor"
                title="View Performance Metrics"
              >
                <Activity className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Main Navigation */}
      <motion.nav 
        className="bg-white border-b border-neutral-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Enhanced Logo */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0"
            >
              <Link to="/" className="block">
                <motion.img
                  src="/images/ishaazi.jpg"
                  alt="Farmer's Weekly Logo"
                  className="h-14 w-auto max-w-[200px] transition-all duration-200 rounded-lg"
                  whileHover={{ rotate: 1 }}
                />
              </Link>
            </motion.div>

            {/* Enhanced Search Bar (Desktop) */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="hidden md:block w-1/3 mx-4"
            >
              <div className="relative">
                <div className="bg-neutral-50 rounded-lg border border-neutral-200">
                  <SearchBar />
                </div>
              </div>
            </motion.div>

            {/* Enhanced Ad Space */}
            {showAd && (
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                className="hidden md:block flex-1 mx-6 h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
              >
                <img
                  src={adBannerUrl || '/images/advert.jpeg'}
                  alt="Advertisement"
                  className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                />
              </motion.div>
            )}

            {/* Enhanced Mobile Menu Button */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center space-x-2 p-3 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors duration-200 border border-primary-200"
              aria-label="Toggle menu"
            >
              <span className="text-sm font-medium">Menu</span>
              <motion.div
                animate={{ rotate: menuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <Menu className="h-5 w-5" />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Enhanced Categories Navigation */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="hidden md:block bg-neutral-50 border-b border-neutral-200"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-2 overflow-x-auto py-2">
            {categoryLinks.map(({ to, label }, index) => (
              <motion.div
                key={to}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index + 0.5 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={to}
                  className={`relative px-6 py-3 text-sm font-semibold transition-colors duration-200 rounded-lg ${
                    isActive(to)
                      ? 'text-white bg-primary-500'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-white'
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                  {isActive(to) && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {!isActive(to) && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                    />
                  )}
                  <motion.span 
                    className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-300 group-hover:w-1/2 transform -translate-x-1/2"
                  />
                  <motion.span 
                    className="absolute bottom-1 right-1/2 w-0 h-0.5 bg-gradient-to-l from-green-400 to-emerald-400 transition-all duration-300 group-hover:w-1/2 transform translate-x-1/2"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-4/5 max-w-sm z-50 md:hidden"
          >
            <div className="h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
              <div className="h-full overflow-y-auto">
                {/* Enhanced Mobile Menu Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                      className="p-2 rounded-xl bg-gradient-to-r from-green-400 to-emerald-400 shadow-lg"
                    >
                      <Sparkles className="h-5 w-5 text-white" />
                    </motion.div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Navigation
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMenuOpen(false)}
                    className="p-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 shadow-lg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </motion.div>

                {/* Main Categories */}
                <div className="p-6 space-y-2">
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4 flex items-center space-x-2"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Main Categories</span>
                  </motion.h3>
                  {categoryLinks.map(({ to, label }, index) => (
                    <motion.div
                      key={to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index + 0.3 }}
                    >
                      <Link
                        to={to}
                        className={`flex items-center space-x-3 p-4 rounded-2xl transition-all duration-300 group ${
                          isActive(to)
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50 shadow-lg'
                            : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 backdrop-blur-sm border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50'
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`p-2 rounded-xl ${
                            isActive(to)
                              ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-600 dark:group-hover:text-green-400'
                          }`}
                        >
                          <Home className="h-4 w-4" />
                        </motion.div>
                        <span className="font-medium text-lg">{label}</span>
                        {isActive(to) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto p-1 rounded-full bg-green-400 text-white"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </motion.div>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                {/* Decorative Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mx-6 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"
                />
                
                {/* Additional Links */}
                <div className="p-6 space-y-2">
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4 flex items-center space-x-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Quick Links</span>
                  </motion.h3>
                  {topLinks.map(({ to, label }, index) => (
                    <motion.div
                      key={to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index + 0.8 }}
                    >
                      <Link
                        to={to}
                        className="block p-3 rounded-xl text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/80 dark:hover:bg-green-900/20 transition-all duration-300 backdrop-blur-sm border border-transparent hover:border-green-200/50 dark:hover:border-green-700/50"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="font-medium">{label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                {/* Enhanced Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="p-6 bg-gradient-to-r from-gray-50/50 to-green-50/50 dark:from-gray-800/50 dark:to-green-900/20 border-t border-gray-200/50 dark:border-gray-700/50"
                >
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4 flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Connect With Us</span>
                  </h3>
                  <div className="flex justify-around">
                    {socialLinks.map(({ platform, icon, url }, index) => (
                      <motion.a
                        key={platform}
                        href={url}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 * index + 1.1, type: "spring", stiffness: 300 }}
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100/80 dark:hover:bg-green-900/30 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-green-300/50 dark:hover:border-green-600/50"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={platform}
                      >
                        {icon}
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Mobile Bottom Navigation */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
        className="block md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-40"
      >
        <div className="flex justify-around py-3">
          {mobileNavItems.map(({ to, icon, label }, index) => (
            <motion.div
              key={to}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * index + 1, type: "spring", stiffness: 300 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={to}
                className={`flex flex-col items-center px-3 py-2 rounded-2xl transition-all duration-300 group ${
                  isActive(to)
                    ? 'text-green-600 dark:text-green-400 bg-green-100/80 dark:bg-green-900/30 shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/80 dark:hover:bg-green-900/20'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <motion.div
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    isActive(to)
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg'
                      : 'bg-gray-100/80 dark:bg-gray-700/50 group-hover:bg-green-100 dark:group-hover:bg-green-900/30'
                  }`}
                  whileHover={{ rotate: 5 }}
                >
                  {icon}
                </motion.div>
                <span className="text-xs font-medium mt-1">{label}</span>
                {isActive(to) && (
                  <motion.div
                    layoutId="activeMobileTab"
                    className="absolute -top-1 w-1 h-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
          
          {/* Enhanced Search Button */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, type: "spring", stiffness: 300 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/search"
              className={`flex flex-col items-center px-3 py-2 rounded-2xl transition-all duration-300 group ${
                isActive('/search')
                  ? 'text-green-600 dark:text-green-400 bg-green-100/80 dark:bg-green-900/30 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/80 dark:hover:bg-green-900/20'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <motion.div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive('/search')
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg'
                    : 'bg-gray-100/80 dark:bg-gray-700/50 group-hover:bg-green-100 dark:group-hover:bg-green-900/30'
                }`}
                whileHover={{ rotate: 5 }}
              >
                <Search size={20} />
              </motion.div>
              <span className="text-xs font-medium mt-1">Search</span>
              {isActive('/search') && (
                <motion.div
                  layoutId="activeMobileTab"
                  className="absolute -top-1 w-1 h-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Overlay when mobile menu is open */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-black/50 via-gray-900/40 to-black/60 backdrop-blur-sm md:hidden z-40"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Performance Monitor Modal */}
      <PerformanceMonitor
        isVisible={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
      />
    </motion.header>
  );
};

export default Header;