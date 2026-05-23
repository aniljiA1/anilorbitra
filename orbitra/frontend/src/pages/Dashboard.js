import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, MapPin, Calendar, Clock, Share2, Trash2,
  AlertCircle, Loader, ChevronRight, Compass
} from 'lucide-react';
import toast from 'react-hot-toast';
import { itineraryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
import './Dashboard.css';

const statusConfig = {
  completed: { label: 'Completed', className: 'badge-success' },
  processing: { label: 'Processing', className: 'badge-warning' },
  failed: { label: 'Failed', className: 'badge-danger' },
};

const Dashboard = () => {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const { user } = useAuth();

  const fetchItineraries = async () => {
    try {
      const { data } = await itineraryAPI.getAll();
      setItineraries(data.itineraries);
    } catch {
      toast.error('Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh while any itinerary is still processing
  useEffect(() => {
    const interval = setInterval(() => {
      if (itineraries.some((i) => i.status === 'processing')) {
        fetchItineraries();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [itineraries]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this itinerary? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await itineraryAPI.delete(id);
      setItineraries((prev) => prev.filter((i) => i._id !== id));
      toast.success('Itinerary deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleShare = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await itineraryAPI.share(id);
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch {
      toast.error('Failed to share');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <span className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading your itineraries...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>My Itineraries</h1>
            <p>Welcome back, {user?.name?.split(' ')[0]}! Here are your travel plans.</p>
          </div>
          <Link to="/upload" className="btn btn-primary">
            <Plus size={16} />
            New Trip
          </Link>
        </div>

        {/* Stats */}
        {itineraries.length > 0 && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <span className="stat-num">{itineraries.length}</span>
              <span className="stat-label">Total Trips</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">
                {itineraries.filter((i) => i.status === 'completed').length}
              </span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">
                {itineraries.filter((i) => i.isShared).length}
              </span>
              <span className="stat-label">Shared</span>
            </div>
          </div>
        )}

        {/* Grid */}
        {itineraries.length === 0 ? (
          <div className="empty-state">
            <Compass size={56} />
            <h3>No trips yet</h3>
            <p>Upload your first travel document to generate an AI-powered itinerary</p>
            <Link to="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>
              <Plus size={16} /> Create your first trip
            </Link>
          </div>
        ) : (
          <div className="itinerary-grid">
            {itineraries.map((it) => {
              const sc = statusConfig[it.status] || statusConfig.completed;
              return (
                <Link
                  key={it._id}
                  to={it.status === 'completed' ? `/itinerary/${it._id}` : '#'}
                  className={`itinerary-card card ${it.status !== 'completed' ? 'disabled' : ''}`}
                >
                  <div className="itinerary-card-header">
                    <div className={`badge ${sc.className}`}>
                      {it.status === 'processing' && <Loader size={10} className="pulse" />}
                      {it.status === 'failed' && <AlertCircle size={10} />}
                      {sc.label}
                    </div>
                    {it.isShared && (
                      <div className="badge badge-info">
                        <Share2 size={10} /> Shared
                      </div>
                    )}
                  </div>

                  <h3 className="itinerary-title">{it.title}</h3>

                  {it.destination && (
                    <div className="itinerary-meta">
                      <MapPin size={13} />
                      <span>{it.destination}</span>
                    </div>
                  )}

                  {it.startDate && (
                    <div className="itinerary-meta">
                      <Calendar size={13} />
                      <span>
                        {formatDate(it.startDate)}
                        {it.endDate && ` → ${formatDate(it.endDate)}`}
                      </span>
                    </div>
                  )}

                  {it.duration && (
                    <div className="itinerary-meta">
                      <Clock size={13} />
                      <span>{it.duration} day{it.duration !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {it.tags?.length > 0 && (
                    <div className="itinerary-tags">
                      {it.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="itinerary-card-footer">
                    <span className="itinerary-date">
                      {format(new Date(it.createdAt), 'MMM d, yyyy')}
                    </span>
                    <div className="itinerary-actions">
                      {it.status === 'completed' && (
                        <button
                          className="btn btn-ghost"
                          onClick={(e) => handleShare(it._id, e)}
                          title="Copy share link"
                        >
                          <Share2 size={14} />
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-delete"
                        onClick={(e) => handleDelete(it._id, e)}
                        disabled={deleting === it._id}
                        title="Delete"
                      >
                        {deleting === it._id ? (
                          <span className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                      {it.status === 'completed' && (
                        <ChevronRight size={14} className="card-arrow" />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
