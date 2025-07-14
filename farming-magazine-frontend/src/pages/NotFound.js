import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="text-blue-500 w-24 h-24" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            404 - Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Oops! The page you are looking for does not exist.
          </p>
          <p className="text-md text-gray-500 mb-6">
            It might have been moved or deleted.
          </p>
        </div>
        <div>
          <Link 
            to="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;