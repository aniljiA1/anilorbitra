import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Users, Share2, ChevronLeft,
  Plane, Hotel, Utensils, Camera, Heart,
  Check, Globe, Lightbulb, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { itineraryAPI } from '../services/api';
import { format, parseISO } from 'date-fns';
import './ItineraryDetail.css';

const activityIcons = {
  transport: <Plane size={14} />,
  accommodation: <Hotel size={14} />,
  food: <Utensils size={14} />,
  sightseeing: <Camera size={14} />,
  leisure: <Heart size={14} />,
  other: <MapPin size={14} />,
};

const ItineraryDetail = ({ shared = false }) => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        let data;
        if (shared) {
          const res = await itineraryAPI.getShared(token);
          data = res.data.itinerary;
        } else {
          const res = await itineraryAPI.getOne(id);
          data = res.data.itinerary;
        }
        setItinerary(data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Itinerary not found');
        if (!shared) navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, token, shared, navigate]);

  const handleShare = async () => {
    setSharing(true);
    try {
      const { data } = await itineraryAPI.share(id);
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      toast.success('Share link copied!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to generate share link');
    } finally {
      setSharing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try { return format(parseISO(dateStr), 'MMMM d, yyyy'); } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <span className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading itinerary...</p>
      </div>
    );
  }

  if (!itinerary) return null;

  return (
    <div className="detail-page">
      <div className="container">
        {/* Back nav */}
        {!shared && (
          <Link to="/dashboard" className="back-link">
            <ChevronLeft size={16} /> Back to dashboard
          </Link>
        )}

        {/* Hero */}
        <div className="detail-hero">
          <div className="detail-hero-content">
            {itinerary.tags?.length > 0 && (
              <div className="hero-tags">
                {itinerary.tags.map((tag) => (
                  <span key={tag} className="hero-tag">{tag}</span>
                ))}
              </div>
            )}
            <h1>{itinerary.title}</h1>
            {itinerary.summary && <p className="detail-summary">{itinerary.summary}</p>}

            <div className="detail-meta-row">
              {itinerary.destination && (
                <div className="detail-meta-item">
                  <MapPin size={14} />
                  <span>{itinerary.destination}</span>
                </div>
              )}
              {itinerary.startDate && (
                <div className="detail-meta-item">
                  <Calendar size={14} />
                  <span>
                    {formatDate(itinerary.startDate)}
                    {itinerary.endDate && ` → ${formatDate(itinerary.endDate)}`}
                  </span>
                </div>
              )}
              {itinerary.duration && (
                <div className="detail-meta-item">
                  <Clock size={14} />
                  <span>{itinerary.duration} days</span>
                </div>
              )}
              {itinerary.travelers && (
                <div className="detail-meta-item">
                  <Users size={14} />
                  <span>{itinerary.travelers} traveler{itinerary.travelers !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {!shared && (
            <button
              className="btn btn-secondary share-btn"
              onClick={handleShare}
              disabled={sharing}
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              {copied ? 'Copied!' : 'Share Itinerary'}
            </button>
          )}

          {shared && (
            <div className="shared-badge">
              <Globe size={14} />
              Shared itinerary by {itinerary.user?.name}
            </div>
          )}
        </div>

        {/* Day tabs */}
        {itinerary.days?.length > 0 && (
          <div className="days-section">
            <div className="day-tabs">
              {itinerary.days.map((day, i) => (
                <button
                  key={i}
                  className={`day-tab ${activeDay === i ? 'active' : ''}`}
                  onClick={() => setActiveDay(i)}
                >
                  <span className="day-num">Day {day.day}</span>
                  {day.date && <span className="day-date">{day.date}</span>}
                </button>
              ))}
            </div>

            {itinerary.days[activeDay] && (
              <div className="day-content fade-in" key={activeDay}>
                <div className="day-title-row">
                  <h2>{itinerary.days[activeDay].title}</h2>
                  {itinerary.days[activeDay].date && (
                    <span className="day-full-date">
                      {formatDate(itinerary.days[activeDay].date) || itinerary.days[activeDay].date}
                    </span>
                  )}
                </div>

                <div className="timeline">
                  {itinerary.days[activeDay].activities?.map((act, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-time">
                        <span>{act.time || '—'}</span>
                      </div>
                      <div className={`timeline-dot type-${act.type || 'other'}`}>
                        {activityIcons[act.type] || activityIcons.other}
                      </div>
                      <div className="timeline-content">
                        <div className="activity-header">
                          <h4>{act.activity}</h4>
                          {act.type && (
                            <span className="activity-type">{act.type}</span>
                          )}
                        </div>
                        {act.location && (
                          <p className="activity-location">
                            <MapPin size={12} /> {act.location}
                          </p>
                        )}
                        {act.notes && (
                          <p className="activity-notes">{act.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom grid: Tips + Emergency */}
        <div className="detail-bottom-grid">
          {itinerary.tips?.length > 0 && (
            <div className="card tips-card">
              <div className="card-section-header">
                <Lightbulb size={16} />
                <h3>Travel Tips</h3>
              </div>
              <ul className="tips-list">
                {itinerary.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {itinerary.emergencyInfo && (
            <div className="card emergency-card">
              <div className="card-section-header">
                <Shield size={16} />
                <h3>Emergency Info</h3>
              </div>
              <div className="emergency-items">
                {itinerary.emergencyInfo.localEmergency && (
                  <div className="emergency-item">
                    <span className="emergency-label">Emergency</span>
                    <span>{itinerary.emergencyInfo.localEmergency}</span>
                  </div>
                )}
                {itinerary.emergencyInfo.embassy && (
                  <div className="emergency-item">
                    <span className="emergency-label">Embassy</span>
                    <span>{itinerary.emergencyInfo.embassy}</span>
                  </div>
                )}
                {itinerary.emergencyInfo.nearestHospital && (
                  <div className="emergency-item">
                    <span className="emergency-label">Hospital</span>
                    <span>{itinerary.emergencyInfo.nearestHospital}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryDetail;
