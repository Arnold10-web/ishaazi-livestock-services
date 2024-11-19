// src/components/MagazineCard.js
import React from 'react';
import '../css/magazinecard.css';

const MagazineCard = () => (
  <div className="magazine-card">
    <img src="/images/ishaazicover.png" alt="Magazine Cover" />
    <div className="card-content">
      <h2>Farmer's Magazine</h2>
      <p>Get the latest edition now!</p>
      <p className="price">shs10,000 /copy</p>
      <button className="btn btn-dark">Pay Now</button>
      <a href="/magazine/latest" download className="btn btn-success">Download</a>
    </div>
  </div>
);

export default MagazineCard;
