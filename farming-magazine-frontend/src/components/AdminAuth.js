import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../config/apiConfig';
import '../css/auth.css';

const AdminAuth = ({ type }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = type === 'login' ? API_ENDPOINTS.ADMIN_LOGIN : API_ENDPOINTS.ADMIN_REGISTER;

        try {
            const response = await axios.post(endpoint, { username, password });
            setMessage(response.data.message);

            if (type === 'login') {
                localStorage.setItem('myAppAdminToken', response.data.token); // Save token
                console.log('Token saved to localStorage:', response.data.token);
                alert('Login successful!');
                navigate('/dashboard'); // Redirect to dashboard
            }
        } catch (error) {
            console.error('Error during authentication:', error.response?.data || error.message);
            setMessage(error.response?.data?.error || 'Authentication failed.');
        }
    };

    return (
        <div className={`auth-container ${type === 'login' ? 'login-container' : 'register-container'}`}>
            <h2>{type === 'login' ? 'Admin Login' : 'Admin Register'}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit">{type === 'login' ? 'Login' : 'Register'}</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default AdminAuth;
