"use client"

import React from "react"

// Mock Link component for Next.js
const Link = ({ to, children, className, style }) => (
  <a href={to} className={className} style={style}>
    {children}
  </a>
)

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="animate-fadeInUp">
            Book Sports Courts
            <br />
            <span className="text-accent-coral">Instantly</span>
          </h1>
          <p className="animate-fadeInUp">
            Find and reserve your favorite sports courts in seconds. From badminton to football, tennis to table tennis
            - your perfect game is just a click away.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary btn-lg animate-fadeInUp">
              Start Booking Now
            </Link>
            <Link to="#features" className="btn btn-ghost btn-lg animate-fadeInUp">
              Learn More
            </Link>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="floating-card animate-float">🏸</div>
          <div className="floating-card animate-float" style={{ animationDelay: "1s" }}>
            ⚽
          </div>
          <div className="floating-card animate-float" style={{ animationDelay: "2s" }}>
            🎾
          </div>
          <div className="floating-card animate-float" style={{ animationDelay: "0.5s" }}>
            🏓
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="text-center">
            <h2 className="animate-fadeInUp">Why Choose QuickCourt?</h2>
            <p className="animate-fadeInUp">
              Experience the future of sports court booking with our innovative platform
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card animate-fadeInUp hover-lift">
              <div className="feature-icon">⚡</div>
              <h3>Instant Booking</h3>
              <p>
                Book your favorite courts in real-time with our lightning-fast booking system. No waiting, no hassle.
              </p>
            </div>
            <div className="feature-card animate-fadeInUp hover-lift" style={{ animationDelay: "0.1s" }}>
              <div className="feature-icon">📍</div>
              <h3>Find Nearby Courts</h3>
              <p>
                Discover sports facilities near you with our smart location-based search and detailed venue information.
              </p>
            </div>
            <div className="feature-card animate-fadeInUp hover-lift" style={{ animationDelay: "0.2s" }}>
              <div className="feature-icon">💳</div>
              <h3>Secure Payments</h3>
              <p>Safe and secure payment processing with multiple payment options for your convenience.</p>
            </div>
            <div className="feature-card animate-fadeInUp hover-lift" style={{ animationDelay: "0.3s" }}>
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Book on the go with our responsive design that works perfectly on all your devices.</p>
            </div>
            <div className="feature-card animate-fadeInUp hover-lift" style={{ animationDelay: "0.4s" }}>
              <div className="feature-icon">⭐</div>
              <h3>Verified Venues</h3>
              <p>All our partner venues are verified and rated by our community for quality assurance.</p>
            </div>
            <div className="feature-card animate-fadeInUp hover-lift" style={{ animationDelay: "0.5s" }}>
              <div className="feature-icon">🎯</div>
              <h3>Smart Matching</h3>
              <p>Get personalized court recommendations based on your preferences and playing history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <h2 className="animate-fadeInUp">Trusted by Athletes Everywhere</h2>
          <div className="stats-grid">
            <div className="stat-item animate-fadeInUp">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat-item animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <span className="stat-number">500+</span>
              <span className="stat-label">Partner Venues</span>
            </div>
            <div className="stat-item animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
              <span className="stat-number">50K+</span>
              <span className="stat-label">Bookings Made</span>
            </div>
            <div className="stat-item animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
              <span className="stat-number">4.9★</span>
              <span className="stat-label">User Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section className="sports-section">
        <div className="container">
          <div className="text-center">
            <h2 className="animate-fadeInUp">Popular Sports</h2>
            <p className="animate-fadeInUp">Find courts for your favorite sports</p>
          </div>
          <div className="sports-grid">
            <div className="sport-card animate-fadeInUp hover-scale">
              <div className="sport-icon">🏸</div>
              <h3>Badminton</h3>
              <p>Indoor courts with professional lighting</p>
              <Link to="/venues?sport=badminton" className="btn btn-outline">
                Find Courts
              </Link>
            </div>
            <div className="sport-card animate-fadeInUp hover-scale" style={{ animationDelay: "0.1s" }}>
              <div className="sport-icon">⚽</div>
              <h3>Football</h3>
              <p>Full-size and 5-a-side pitches</p>
              <Link to="/venues?sport=football" className="btn btn-outline">
                Find Courts
              </Link>
            </div>
            <div className="sport-card animate-fadeInUp hover-scale" style={{ animationDelay: "0.2s" }}>
              <div className="sport-icon">🎾</div>
              <h3>Tennis</h3>
              <p>Clay, grass, and hard court surfaces</p>
              <Link to="/venues?sport=tennis" className="btn btn-outline">
                Find Courts
              </Link>
            </div>
            <div className="sport-card animate-fadeInUp hover-scale" style={{ animationDelay: "0.3s" }}>
              <div className="sport-icon">🏓</div>
              <h3>Table Tennis</h3>
              <p>Professional tables and equipment</p>
              <Link to="/venues?sport=table-tennis" className="btn btn-outline">
                Find Courts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2 className="animate-fadeInUp">Ready to Play?</h2>
          <p className="animate-fadeInUp">
            Join thousands of athletes who trust QuickCourt for their sports booking needs. Start your journey today and
            never miss a game again.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-primary btn-xl animate-fadeInUp">
              Create Free Account
            </Link>
            <Link to="/venues" className="btn btn-dark btn-xl animate-fadeInUp">
              Browse Venues
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>QuickCourt</h3>
              <p>Your ultimate sports court booking platform. Find, book, and play at the best venues in your city.</p>
              <div className="social-links">
                <a href="#" className="social-link">📘</a>
                <a href="#" className="social-link">🐦</a>
                <a href="#" className="social-link">📷</a>
                <a href="#" className="social-link">💼</a>
              </div>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><Link to="/venues">Find Venues</Link></li>
                <li><Link to="/signup">Sign Up</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/about">About Us</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Sports</h3>
              <ul>
                <li><Link to="/venues?sport=badminton">Badminton</Link></li>
                <li><Link to="/venues?sport=football">Football</Link></li>
                <li><Link to="/venues?sport=tennis">Tennis</Link></li>
                <li><Link to="/venues?sport=table-tennis">Table Tennis</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Support</h3>
              <ul>
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 QuickCourt. All rights reserved. Built with ❤️ for athletes everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
