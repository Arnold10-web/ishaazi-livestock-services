// src/pages/Services.js
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Services = () => (
    <div>
<Header showAd={true} />
        <main className="container my-4">
            <section>
                <h1>Our Services</h1>
                <p>At Ishaazi Livestock Services, we provide comprehensive support for the agricultural community...</p>
            </section>

            <section className="my-5">
                <h2 className="text-center">Our Range of Services</h2>
                <div className="row">
                    {/* Service Card 1 */}
                    <div className="col-md-4 mb-4">
                        <h3>Media Coverage for Agriculture Events</h3>
                        <p>We offer comprehensive media coverage for agriculture events across East Africa...</p>
                        <img src="/images/media1.jpeg" alt="Media coverage" className="img-fluid" />
                    </div>
                    {/* Service Card 2 */}
                    <div className="col-md-4 mb-4">
                        <h3>Publication</h3>
                        <p>Our publication arm produces high-quality content on sustainable farming practices...</p>
                        <img src="/images/ishaazicover.png" alt="Magazine cover" className="img-fluid" />
                    </div>
                    {/* Service Card 3 */}
                    <div className="col-md-4 mb-4">
                        <h3>Farmer and Group Training</h3>
                        <p>Empowering farmers is at the heart of our mission. We offer tailored training programs...</p>
                        <img src="/images/service2.jpg" alt="Training session" className="img-fluid" />
                    </div>
                    {/* Additional services as needed */}
                </div>
            </section>
        </main>
     <Footer />
    </div>
);

export default Services;
