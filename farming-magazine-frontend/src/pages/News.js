// src/pages/News.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const News = () => {
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        fetch('/api/news')
            .then(response => response.json())
            .then(data => setArticles(data));
    }, []);

    return (
        <div>
          <Header />
            <main className="container mt-4">
                <h1 className="text-center mb-5">Latest Agricultural News</h1>
                <section className="row">
                    {articles.map((article, index) => (
                        <div className="col-md-6 mb-4" key={index}>
                            <div className="card">
                                <img src={`/api/media/${article.imageId}`} alt="News" className="card-img-top" />
                                <div className="card-body">
                                    <h5 className="card-title">{article.title}</h5>
                                    <p className="card-text">{article.summary}</p>
                                    <a href={`/api/news/${article._id}`} className="btn btn-primary">Read More</a>
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

export default News;
