// src/pages/Piggery.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Piggery = () => {
    const [content, setContent] = useState({});

    // Example: Fetch piggery content from the backend
    useEffect(() => {
        fetch('/api/content/piggery') // Backend endpoint to fetch content for this page
            .then(response => response.json())
            .then(data => setContent(data));
    }, []);

    return (
        <div>
      <Header />
            <main className="container my-4">
                <section>
                    <h1>{content.title || "Piggery Farming"}</h1>
                    <p>{content.description || "Explore the essentials of successful pig farming..."}</p>
                </section>

                <section className="my-5">
                    <h2 className="text-center">Key Topics in Piggery Farming</h2>
                    <div className="row">
                        {content.topics ? content.topics.map((topic, index) => (
                            <div className="col-md-4" key={index}>
                                <h3>{topic.title}</h3>
                                <p>{topic.description}</p>
                                <img src={topic.imageURL} alt={topic.title} className="img-fluid" />
                            </div>
                        )) : "Loading topics..."}
                    </div>
                </section>
            </main>
      <Footer />
        </div>
    );
};

export default Piggery;
