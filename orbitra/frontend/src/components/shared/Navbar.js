import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, LogOut, User, Menu, X, Plus, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <MapPin size={18} />
          </div>
          <span className="brand-name">Orbitra</span>
        </Link>

        {user && (
          <>
            <div className="navbar-links">
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <History size={15} />
                My Itineraries
              </Link>
              <Link
                to="/upload"
                className={`nav-link nav-link-primary ${isActive('/upload') ? 'active' : ''}`}
              >
                <Plus size={15} />
                New Trip
              </Link>
            </div>

            <div className="navbar-user">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.name?.split(' ')[0]}</span>
              <button className="btn btn-ghost" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>

            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </>
        )}

        {!user && (
          <div className="navbar-auth">
            <Link to="/login" className="btn btn-ghost">Log in</Link>
            <Link to="/register" className="btn btn-primary">Sign up</Link>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && user && (
        <div className="mobile-menu">
          <Link to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <History size={16} /> My Itineraries
          </Link>
          <Link to="/upload" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <Plus size={16} /> New Trip
          </Link>
          <Link to="/profile" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <User size={16} /> Profile
          </Link>
          <button className="mobile-link mobile-logout" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
