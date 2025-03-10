import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../config/apiConfig';

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
        localStorage.setItem('myAppAdminToken', response.data.token);
        console.log('Token saved to localStorage:', response.data.token);
        alert('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during authentication:', error.response?.data || error.message);
      setMessage(error.response?.data?.error || 'Authentication failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        {type === 'login' ? 'Admin Login' : 'Admin Register'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">
          {type === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
      {message && <p className="mt-4 text-center text-red-500">{message}</p>}
    </div>
  );
};

export default AdminAuth;
