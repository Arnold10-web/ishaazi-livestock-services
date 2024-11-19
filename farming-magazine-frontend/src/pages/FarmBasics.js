// src/pages/FarmBasics.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FarmBasics = () => {
    const [content, setContent] = useState({});

    useEffect(() => {
        fetch('/api/content/farm-basics')
            .then(response => response.json())
            .then(data => setContent(data));
    }, []);

    return (
        <div>
      <Header />
            <main className="container mt-4">
                <section>
                    <h1>{content.title || "Farm Basics"}</h1>
                    <p>{content.description || "Learn the fundamentals of farming with practical advice on animal husbandry and management."}</p>
                </section>

                <section className="media-section mt-5">
                    <h2 className="text-center">Videos & Audio</h2>
                    <div className="row">
                        {content.mediaFiles ? content.mediaFiles.map((media, index) => (
                            <div className="col-md-6 mb-4" key={index}>
                                <div className="card">
                                    <h3>{media.title}</h3>
                                    <video controls>
                                        <source src={`/api/media/${media.fileId}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                    <a href={`/api/media/download/${media.fileId}`} className="btn btn-primary mt-2">Download Video</a>
                                </div>
                            </div>
                        )) : "Loading media..."}
                    </div>
                </section>
            </main>
        <Footer />
        </div>
    );
};

export default FarmBasics;
