// src/pages/Dairy.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dairy = () => {
    const [content, setContent] = useState({});

    useEffect(() => {
        fetch('/api/content/dairy')
            .then(response => response.json())
            .then(data => setContent(data));
    }, []);

    return (
        <div>
        <Header />
            <main className="container mt-4">
                <h1>{content.title || "Dairy Farming"}</h1>
                <p>{content.description || "Essential knowledge for successful dairy farming."}</p>
                <section className="row">
                    {content.articles ? content.articles.map((article, index) => (
                        <div className="col-md-4" key={index}>
                            <div className="card">
                                <img src={`/api/media/${article.imageId}`} alt="Dairy Article Image" className="card-img-top" />
                                <div className="card-body">
                                    <h5 className="card-title">{article.title}</h5>
                                    <p className="card-text">{article.summary}</p>
                                    <a href={`/api/article/${article._id}`} className="btn btn-primary">Read More</a>
                                </div>
                            </div>
                        </div>
                    )) : "Loading articles..."}
                </section>
            </main>
        <Footer />
        </div>
    );
};

export default Dairy;
