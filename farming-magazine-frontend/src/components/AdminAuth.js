import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminAuth = ({ type }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = type === 'login' ? '/login' : '/register';

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin${endpoint}`, {
                username,
                password,
            });
            setMessage(res.data.message);

            if (type === 'login') {
                localStorage.setItem('token', res.data.token); // Save token
                navigate('/dashboard'); // Redirect to dashboard after login
            }
        } catch (error) {
            setMessage(error.response?.data?.error || 'An error occurred');
        }
    };

    return (
        <div>
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
