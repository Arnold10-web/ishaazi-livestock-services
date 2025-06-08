import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';

// Eager load components for critical paths
import Header from './components/Header';
import Footer from './components/Footer';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsPost = lazy(() => import('./pages/NewsPost'));
const Services = lazy(() => import('./pages/Services'));
const AdminAuth = lazy(() => import('./components/AdminAuth'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const FarmPage = lazy(() => import('./pages/FarmPage'));
const FarmPost = lazy(() => import('./pages/FarmPost'));
const BasicPage = lazy(() => import('./pages/BasicPage'));
const MagazinePage = lazy(() => import('./pages/MagazinePage'));
const GoatPage = lazy(() => import('./pages/GoatPage'));
const GoatPost = lazy(() => import('./pages/GoatPost'));
const BeefPage = lazy(() => import('./pages/BeefPage'));
const BeefPost = lazy(() => import('./pages/BeefPost'));
const DairyPage = lazy(() => import('./pages/DairyPage'));
const DairyPost = lazy(() => import('./pages/DairyPost'));
const PiggeryPage = lazy(() => import('./pages/PiggeryPage'));
const PiggeryPost = lazy(() => import('./pages/PiggeryPost'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Contact = lazy(() => import('./pages/Contact'));
const EventPage = lazy(() => import('./pages/EventPage'));
const SubscriberPage = lazy(() => import('./pages/SubscriberPage'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Advertisements = lazy(() => import('./pages/Advertisements'));
const Auctions = lazy(() => import('./pages/Auctions'));

// Loading component for suspense fallbacks
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Layout component with Header and Footer
const MainLayout = () => (
  <>
    <Header />
    <main className="relative flex-grow">
      <Outlet />
    </main>
    <Footer />
  </>
);

// Layout for admin pages (no header/footer)
const AdminLayout = () => (
  <main className="min-h-screen">
    <Outlet />
  </main>
);

const App = () => {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, prompt user to refresh
                  if (window.confirm('New content available! Refresh to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            });
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Preload critical resources
    const criticalResources = [
      '/static/css/main.css',
      '/static/js/bundle.js'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.css') ? 'style' : 'script';
      document.head.appendChild(link);
    });
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Admin Routes without Header/Footer */}
          <Route element={<AdminLayout />}>
            <Route path="/login" element={
              <Suspense fallback={<PageLoader />}>
                <AdminAuth type="login" />
              </Suspense>
            } />
            <Route path="/register" element={
              <Suspense fallback={<PageLoader />}>
                <AdminAuth type="register" />
              </Suspense>
            } />
            <Route path="/dashboard" element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              </Suspense>
            } />
         </Route>

          {/* Public Routes with Header/Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={
              <Suspense fallback={<PageLoader />}>
                <Home />
              </Suspense>
            } />
            <Route path="/news" element={
              <Suspense fallback={<PageLoader />}>
                <NewsPage />
              </Suspense>
            } />
            <Route path="/news/:id" element={
              <Suspense fallback={<PageLoader />}>
                <NewsPost />
              </Suspense>
            } />
            <Route path="/services" element={
              <Suspense fallback={<PageLoader />}>
                <Services />
              </Suspense>
            } />
            <Route path="/blog" element={
              <Suspense fallback={<PageLoader />}>
                <BlogPage />
              </Suspense>
            } />
            <Route path="/blog/:id" element={
              <Suspense fallback={<PageLoader />}>
                <BlogPost />
              </Suspense>
            } />
            <Route path="/basic" element={
              <Suspense fallback={<PageLoader />}>
                <BasicPage />
              </Suspense>
            } />
            <Route path="/magazine" element={
              <Suspense fallback={<PageLoader />}>
                <MagazinePage />
              </Suspense>
            } />
            <Route path="/farm" element={
              <Suspense fallback={<PageLoader />}>
                <FarmPage />
              </Suspense>
            } />
            <Route path="/farm/:id" element={
              <Suspense fallback={<PageLoader />}>
                <FarmPost />
              </Suspense>
            } />
            <Route path="/goats" element={
              <Suspense fallback={<PageLoader />}>
                <GoatPage />
              </Suspense>
            } />
            <Route path="/goat/:id" element={
              <Suspense fallback={<PageLoader />}>
                <GoatPost />
              </Suspense>
            } />
            <Route path="/beef" element={
              <Suspense fallback={<PageLoader />}>
                <BeefPage />
              </Suspense>
            } />
            <Route path="/beef/:id" element={
              <Suspense fallback={<PageLoader />}>
                <BeefPost />
              </Suspense>
            } />
            <Route path="/dairy" element={
              <Suspense fallback={<PageLoader />}>
                <DairyPage />
              </Suspense>
            } />
            <Route path="/dairy/:id" element={
              <Suspense fallback={<PageLoader />}>
                <DairyPost />
              </Suspense>
            } />
            <Route path="/contact" element={
              <Suspense fallback={<PageLoader />}>
                <Contact />
              </Suspense>
            } />
            <Route path="/piggery" element={
              <Suspense fallback={<PageLoader />}>
                <PiggeryPage />
              </Suspense>
            } />
            <Route path="/piggery/:id" element={
              <Suspense fallback={<PageLoader />}>
                <PiggeryPost />
              </Suspense>
            } />
            <Route path="/events" element={
              <Suspense fallback={<PageLoader />}>
                <EventPage />
              </Suspense>
            } />
            <Route path="/subscribe" element={
              <Suspense fallback={<PageLoader />}>
                <SubscriberPage />
              </Suspense>
            } />
            <Route path="/suppliers" element={
              <Suspense fallback={<PageLoader />}>
                <Suppliers />
              </Suspense>
            } />
            <Route path="/advertisements" element={
              <Suspense fallback={<PageLoader />}>
                <Advertisements />
              </Suspense>
            } />
            <Route path="/auctions" element={
              <Suspense fallback={<PageLoader />}>
                <Auctions />
              </Suspense>
            } />
            <Route path="/search" element={
              <Suspense fallback={<PageLoader />}>
                <SearchResults />
              </Suspense>
            } />
            <Route path="*" element={
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            } />
          </Route>
        </Routes>
      </div>
    </Router>
  );
};

export default App;
