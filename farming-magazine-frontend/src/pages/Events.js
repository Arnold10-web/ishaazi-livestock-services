// src/pages/Events.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Events = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetch('/api/events')
            .then(response => response.json())
            .then(data => setEvents(data));
    }, []);

    return (
        <div>
            <Header />
            <main className="container my-5">
                <h1 className="text-center mb-4">Upcoming Events</h1>
                <section className="row">
                    {events.map((event, index) => (
                        <div className="col-md-4" key={index}>
                            <div className="card">
                                <img src={`/api/media/${event.imageId}`} alt="Event Image" className="card-img-top" />
                                <div className="card-body">
                                    <h5 className="card-title">{event.name}</h5>
                                    <p className="card-text">{event.description}</p>
                                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                    <a href={`/api/event/${event._id}`} className="btn btn-primary">Learn More</a>
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

export default Events;
