// src/components/BlogSection.js
import React from 'react';
import '../css/blogsection.css';

const blogs = [
  {
    title: "Uganda's Livestock Sector",
    imgSrc: "/images/article1.jpeg",
    description: "An essential part of Uganda's agricultural industry, boosting the economy.",
  },
  {
    title: "East Africa: A Livestock Stronghold",
    imgSrc: "/images/article2.jpeg",
    description: "East Africa houses a majority of Africa's livestock population.",
  },
  {
    title: "The EAC's Initiative for Pastoralists",
    imgSrc: "/images/article3.jpg",
    description: "East African pastoralism's socioeconomic importance is hard to overestimate.",
  }
];

const BlogSection = () => (
  <section className="blog-section">
    <h2>Latest Blogs</h2>
    <div className="blog-cards">
      {blogs.map((blog, index) => (
        <div key={index} className="blog-card">
          <img src={blog.imgSrc} alt={blog.title} />
          <h3>{blog.title}</h3>
          <p>{blog.description}</p>
          <a href="/" className="btn-read-more">Read More</a>
        </div>
      ))}
    </div>
  </section>
);

export default BlogSection;
