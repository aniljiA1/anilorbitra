import React from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Sparkles, Map, Share2, ArrowRight,
  Zap
} from 'lucide-react';
import './Landing.css';

const features = [
  {
    icon: <Upload size={22} />,
    title: 'Upload Any Document',
    desc: 'Drop in flight tickets, hotel confirmations, or any travel PDF/image. We handle the rest.',
  },
  {
    icon: <Zap size={22} />,
    title: 'Instant AI Extraction',
    desc: 'Our AI reads every detail — dates, times, booking refs, hotel names — in seconds.',
  },
  {
    icon: <Sparkles size={22} />,
    title: 'Smart Itinerary Generation',
    desc: 'Get a day-by-day schedule with activities, meals, and local tips tailored to your trip.',
  },
  {
    icon: <Share2 size={22} />,
    title: 'One-Click Sharing',
    desc: 'Share your itinerary with travel companions via a single public link — no login needed to view.',
  },
];

const steps = [
  { num: '01', title: 'Upload', desc: 'Drag & drop your travel documents — PDFs or images.' },
  { num: '02', title: 'Extract', desc: 'AI parses all booking details automatically.' },
  { num: '03', title: 'Generate', desc: 'A structured itinerary is built in under a minute.' },
  { num: '04', title: 'Share', desc: 'Copy a link and send it to anyone.' },
];

const Landing = () => (
  <div className="landing">
    {/* Background orbs */}
    <div className="landing-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>

    {/* Hero */}
    <section className="hero container">
      <div className="hero-badge">
        <Sparkles size={12} />
        AI-Powered Travel Planning
      </div>
      <h1 className="hero-title">
        Upload your bookings.<br />
        <span className="gradient-text">Get your itinerary.</span>
      </h1>
      <p className="hero-subtitle">
        Orbitra reads your flight tickets, hotel confirmations, and travel documents —
        then generates a complete day-by-day itinerary using AI. Zero manual planning.
      </p>
      <div className="hero-actions">
        <Link to="/register" className="btn btn-primary hero-cta">
          Get started free <ArrowRight size={16} />
        </Link>
        <Link to="/login" className="btn btn-secondary">
          Sign in
        </Link>
      </div>
      <p className="hero-note">No credit card required · Takes 30 seconds to set up</p>
    </section>

    {/* How it works */}
    <section className="steps-section container">
      <div className="section-label">How it works</div>
      <h2 className="section-title">From documents to itinerary in minutes</h2>
      <div className="steps-grid">
        {steps.map((s) => (
          <div key={s.num} className="step-card">
            <span className="step-num">{s.num}</span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section className="features-section container">
      <div className="section-label">Features</div>
      <h2 className="section-title">Everything you need for trip planning</h2>
      <div className="features-grid">
        {features.map((f) => (
          <div key={f.title} className="feature-card card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA banner */}
    <section className="cta-section container">
      <div className="cta-card">
        <div className="cta-glow" />
        <Map size={40} className="cta-icon" />
        <h2>Ready to plan smarter?</h2>
        <p>Join thousands of travelers who let AI do the heavy lifting.</p>
        <Link to="/register" className="btn btn-primary cta-btn">
          Create your first itinerary <ArrowRight size={16} />
        </Link>
      </div>
    </section>

    {/* Footer */}
    <footer className="landing-footer container">
      <p>© {new Date().getFullYear()} Orbitra. Built for Orbitra Technologies assignment.</p>
    </footer>
  </div>
);

export default Landing;
