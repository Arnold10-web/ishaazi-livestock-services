// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  
    const token = localStorage.getItem('myAppAdminToken'); // Correct token key

    return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute; 
