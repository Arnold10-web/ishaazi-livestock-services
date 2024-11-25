import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import News from './pages/News';
import Services from './pages/Services';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import BlogPage from './pages/BlogPage'; // Adjust path if needed
import Farms from './pages/Farms'; // Add new Farms page
import FarmBasics from './pages/FarmBasics'; // For Media (videos/audio)

// Define Routes
const App = () => (
    <Router>
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<News />} />
            <Route path="/services" element={<Services />} />
            <Route path="/blogpage" element={<BlogPage />} /> {/* New Blogs Page */}
            <Route path="/farms" element={<Farms />} /> {/* New Farms Page */}
            <Route path="/farm-basics" element={<FarmBasics />} /> {/* Media page */}
            <Route path="/login" element={<AdminAuth type="login" />} />
            <Route path="/register" element={<AdminAuth type="register" />} />

            {/* Protected Admin Route */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
        </Routes>
    </Router>
);

export default App;
