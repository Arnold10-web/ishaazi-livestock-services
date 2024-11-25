// src/pages/FarmsForSale.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FarmsForSale = () => {
    const [farms, setFarms] = useState([]);

    useEffect(() => {
        fetch('/api/farms-for-sale')
            .then(response => response.json())
            .then(data => setFarms(data));
    }, []);

    return (
        <div>
      <Header />
            <main className="container my-5">
                <h1 className="text-center mb-4">Farms for Sale</h1>
                <p className="text-center">Find your next agricultural property...</p>
                <section className="row">
                    {farms.map((farm, index) => (
                        <div className="col-md-4" key={index}>
                            <div className="card">
                                <img src={`/api/media/${farm.imageId}`} alt="Farm Image" className="card-img-top" />
                                <div className="card-body">
                                    <h5 className="card-title">{farm.name}</h5>
                                    <p className="card-text">{farm.description}</p>
                                    <p><strong>Price:</strong> {farm.price}</p>
                                    <a href={`/api/farm/${farm._id}`} className="btn btn-primary">View Details</a>
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

export default FarmsForSale;
