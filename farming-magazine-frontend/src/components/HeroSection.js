import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../css/style.css';

const HeroSection = () => {
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [hasPurchased, setHasPurchased] = useState(false); // Track purchase status
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/blogs?limit=3`);
        setLatestBlogs(response.data.data.blogs);
      } catch (error) {
        console.error('Error fetching latest blogs:', error);
      }
    };

    fetchLatestBlogs();
  }, []);

  const handlePayment = async () => {
    try {
      // TODO: Integrate with real payment gateway
      // Example integration placeholder:
      /*
      const paymentGateway = new PaymentGateway({
        apiKey: process.env.PAYMENT_GATEWAY_API_KEY,
        merchantId: process.env.MERCHANT_ID
      });
      
      const payment = await paymentGateway.createPayment({
        amount: 10000,
        currency: 'UGX',
        description: 'Ishaazi Magazine Purchase'
      });
      
      if (payment.status === 'success') {
        setHasPurchased(true);
        // Store purchase record in database
      }
      */

      // For demonstration, we'll just set hasPurchased to true
      alert('This is a dummy payment implementation. Replace with actual payment gateway integration.');
      setHasPurchased(true);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handleDownload = () => {
    // TODO: Implement secure download logic after payment verification
    if (hasPurchased) {
      // Example secure download implementation:
      /*
      const downloadUrl = await generateSecureDownloadUrl(magazineId);
      window.location.href = downloadUrl;
      */
      alert('Download started! (Demo implementation)');
    } else {
      alert('Please purchase the magazine first to download.');
    }
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>Ishaazi Magazine, Empowering Farmers</h1>
        <p>
          Welcome to Ishaazi Magazine, your go-to source for the latest news, trends,<br/>
          cutting-edge developments, expert insights, and in-depth analysis about the livestock industry.
        </p>
        <div className="hero-buttons">
          <a href="/services" className="btn-primary">Explore Services</a>
          <a href="/magazine" className="btn-secondary">Read Our Magazine</a>
        </div>
      </div>

      <div className="hero-magazine">
        <div className="magazine-card">
          <img src="/images/ishaazicover.png" alt="Magazine Cover" />
          <div className="card-content">
            <h2>Farmer's Magazine</h2>
            <p>Get the latest edition now!</p>
            <p className="price">shs10,000 /copy</p>
            {!hasPurchased ? (
              <button onClick={handlePayment} className="btn btn-dark">Pay Now</button>
            ) : (
              <button onClick={handleDownload} className="btn btn-success">Download Magazine</button>
            )}
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same */}
      <div className="latest-blogs-section">
        <h2><Link to="/blog" className="btn-primary">Our Blogs</Link></h2>
        <div className="blog-cards">
          {latestBlogs.map((blog) => (
            <div key={blog._id} className="blog-card">
              <img src={`${API_BASE_URL}${blog.imageUrl}`} alt={blog.title} />
              <h3>{blog.title}</h3>
              <p>{truncateContent(blog.content)}</p>
              <Link to={`/blog/${blog._id}`} className="read-more">Read More</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="services-section">
        <h2>Our Services</h2>
        <div className="service-cards">
          <div className="service-card">
            <img src="/images/service1.jpg" alt="Service 1" />
            <h3>Media coverage for agriculture events</h3>
            <p>At Ishaazi Livestock Services, we offer comprehensive media coverage for agriculture events across East Africa.</p>
          </div>
          <div className="service-card">
            <img src="/images/service2.jpg" alt="Service 2" />
            <h3>Farmer and Farmer Group Trainings</h3>
            <p>Empowering farmers is at the heart of our mission. We offer a variety of training programs designed to equip farmers with the skills and knowledge they need to succeed.</p>
          </div>
          <div className="service-card">
            <img src="/images/consultancy.png" alt="Service 3" />
            <h3>Consultancy</h3>
            <p>Our team of experienced consultants provides tailored solutions to meet the unique needs of our clients. We offer a range of consultancy services, including farm management, production optimization, animal health, market analysis, and strategic planning.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;