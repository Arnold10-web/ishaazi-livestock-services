// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    //localStorage.setItem('myAppAdminToken', response.data.token); // Save token under the new key

    return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute; 

