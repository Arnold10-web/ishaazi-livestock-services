import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/admin.css';

const MediaManagement = lazy(() => import('./MediaManagement'));
const MagazineManagement = lazy(() => import('./MagazineManagement'));
const ContentManagement = lazy(() => import('./ContentManagement'));

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('media');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token'); // Use consistent token naming
        if (!token) navigate('/login'); // Redirect to login if not authenticated
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token'); // Clear token
        navigate('/login');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'media':
                return <MediaManagement />;
            case 'magazines':
                return <MagazineManagement />;
            case 'content':
                return <ContentManagement />;
            default:
                return <div>Error: Tab not found</div>;
        }
    };

    return (
        <div className="admin-dashboard container">
            <header className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </header>
            <nav className="admin-nav">
                {['media', 'magazines', 'content'].map((tab) => (
                    <button
                        key={tab}
                        className={`nav-button ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {`${tab.charAt(0).toUpperCase()}${tab.slice(1)} Management`}
                    </button>
                ))}
            </nav>
            <div className="tab-content">
                <Suspense fallback={<div>Loading...</div>}>
                    {renderTabContent()}
                </Suspense>
            </div>
        </div>
    );
};

export default AdminDashboard;
