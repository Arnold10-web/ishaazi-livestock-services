// src/pages/Auctions.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';


const Auctions = () => {
    const [auctions, setAuctions] = useState([]);

    useEffect(() => {
        fetch('/api/auctions')
            .then(response => response.json())
            .then(data => setAuctions(data));
    }, []);

    return (
    
        <div>
             <Header />
            <main className="container my-5">
                <h1 className="text-center mb-4">Upcoming Auctions</h1>
                <section className="row">
                    {auctions.map((auction, index) => (
                        <div className="col-md-4" key={index}>
                            <div className="card">
                                <img src={`/api/media/${auction.imageId}`} alt="Auction Image" className="card-img-top" />
                                <div className="card-body">
                                    <h5 className="card-title">{auction.title}</h5>
                                    <p className="card-text">{auction.description}</p>
                                    <p><strong>Date:</strong> {new Date(auction.date).toLocaleDateString()}</p>
                                    <a href={`/api/auction/${auction._id}`} className="btn btn-primary">View Details</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
            <Footer />
        </div>
    
    );
};

export default Auctions;
