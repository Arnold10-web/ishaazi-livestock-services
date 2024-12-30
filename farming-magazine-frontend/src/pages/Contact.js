// src/pages/Contact.js
import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

const Contact = () => (
    <div>
     <Header />
        <main className="container my-4">
            <section className="contact-section">
                <h1>Contact Us</h1>
                <p>Reach out to Farmer's Weekly for inquiries, support, or feedback.</p>

                <div className="contact-info">
                    <p>Email: info@farmersweekly.com</p>
                    <p>Phone: +123-456-7890</p>
                    <p>Address: 123 Agriculture Rd., City, Country</p>
                </div>

                <form className="contact-form">
                    <input type="text" placeholder="Name" required />
                    <input type="email" placeholder="Email" required />
                    <textarea placeholder="Your message" required></textarea>
                    <button type="submit" className="btn btn-primary">Send Message</button>
                </form>
            </section>
        </main>
    <Footer />
    </div>
);

export default Contact;
