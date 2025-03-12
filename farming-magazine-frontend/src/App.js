import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import NewsPage from './pages/NewsPage';
import NewsPost from './pages/NewsPost';
import Services from './pages/Services';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import BlogPage from './pages/BlogPage';
import BlogPost from './pages/BlogPost';
import FarmPage from './pages/FarmPage';
import FarmPost from './pages/FarmPost';
import BasicPage from './pages/BasicPage';
import MagazinePage from './pages/MagazinePage';
import GoatPage from './pages/GoatPage';
import GoatPost from './pages/GoatPost';
import BeefPage from './pages/BeefPage';
import BeefPost from './pages/BeefPost';
import DairyPage from './pages/DairyPage';
import DairyPost from './pages/DairyPost';
import PiggeryPage from './pages/PiggeryPage';
import PiggeryPost from './pages/PiggeryPost';
import NotFound from './pages/NotFound';
import Contact from './pages/Contact';
import Header from './components/Header';
import Footer from './components/Footer';

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

const App = () => (
  <Router>
    <div className="min-h-screen flex flex-col">
      <Routes>
        {/* Admin Routes without Header/Footer */}
        <Route element={<AdminLayout />}>
          <Route path="/login" element={<AdminAuth type="login" />} />
          <Route path="/register" element={<AdminAuth type="register" />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
       </Route>

        {/* Public Routes with Header/Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsPost />} />
          <Route path="/services" element={<Services />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/basic" element={<BasicPage />} />
          <Route path="/magazine" element={<MagazinePage />} />
          <Route path="/farm" element={<FarmPage />} />
          <Route path="/farm/:id" element={<FarmPost />} />
          <Route path="/goats" element={<GoatPage />} />
          <Route path="/goat/:id" element={<GoatPost />} />
          <Route path="/beef" element={<BeefPage />} />
          <Route path="/beef/:id" element={<BeefPost />} />
          <Route path="/dairy" element={<DairyPage />} />
          <Route path="/dairy/:id" element={<DairyPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/piggery" element={<PiggeryPage />} />
          <Route path="/piggery/:id" element={<PiggeryPost />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  </Router>
);

export default App;