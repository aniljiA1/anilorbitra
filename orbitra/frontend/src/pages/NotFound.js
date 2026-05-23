import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import './NotFound.css';

const NotFound = () => (
  <div className="notfound-page">
    <div className="notfound-content">
      <div className="notfound-icon">
        <Compass size={48} />
      </div>
      <h1>404</h1>
      <h2>Lost in transit</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">
        <ArrowLeft size={16} />
        Back to home
      </Link>
    </div>
  </div>
);

export default NotFound;
