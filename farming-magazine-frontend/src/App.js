//src/app.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import News from './pages/News';
import Services from './pages/Services';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => (
    <Router>
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<News />} />
            <Route path="/services" element={<Services />} />
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

