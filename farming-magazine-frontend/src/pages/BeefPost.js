import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, Beef } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const BeefPost = () => {
  const [beef, setBeef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchBeef = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/beef/${id}`);
        setBeef(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching beef post:', err);
        setError('Failed to fetch beef information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchBeef();
  }, [id, API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-red-500" />
          <p className="text-lg text-gray-600">Loading beef information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center p-4 bg-red-50 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!beef) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
          <AlertCircle className="w-6 h-6 text-yellow-500 mr-2" />
          <p className="text-yellow-700">No beef information found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Beef className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{beef.title}</h1>
              <p className="text-gray-500">Posted on {new Date(beef.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {beef.image && (
              <img
                src={beef.image}
                alt={beef.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            <div className="prose max-w-none">
              <p className="text-gray-600">{beef.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {beef.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h2 className="text-xl font-semibold mb-2">Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-gray-500">Cut Type</dt>
                  <dd className="font-medium">{beef.cutType}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Grade</dt>
                  <dd className="font-medium">{beef.grade}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Weight</dt>
                  <dd className="font-medium">{beef.weight}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Price per lb</dt>
                  <dd className="font-medium">${beef.pricePerPound}</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BeefPost;