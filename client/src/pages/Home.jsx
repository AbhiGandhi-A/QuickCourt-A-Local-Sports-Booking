"use client"
import React from "react";

"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../api/axios"

export default function Home() {
  const [popular, setPopular] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    api.get("/venues/popular").then((res) => setPopular(res.data.data || []))
  }, [])

  const slides = [
    {
      title: "Find Your Perfect Court",
      subtitle: "Book sports courts instantly",
      description:
        "Discover and reserve badminton, tennis, football, and table tennis courts near you with just a few clicks.",
      cta: "Start Booking",
      ctaLink: "/venues",
      background: "hero-bg-1",
    },
    {
      title: "Play With Friends",
      subtitle: "Connect with local players",
      description: "Join matches, create teams, and connect with fellow sports enthusiasts in your area.",
      cta: "Find Players",
      ctaLink: "/venues",
      background: "hero-bg-2",
    },
    {
      title: "Premium Facilities",
      subtitle: "Quality guaranteed",
      description: "All our partner venues are verified and rated by our community for the best playing experience.",
      cta: "Explore Venues",
      ctaLink: "/venues",
      background: "hero-bg-3",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const sports = [
    { key: "badminton", label: "Badminton", icon: "🏸" },
    { key: "football", label: "Football", icon: "⚽" },
    { key: "tennis", label: "Tennis", icon: "🎾" },
    { key: "table-tennis", label: "Table Tennis", icon: "🏓" },
  ]

  const getVenueImageUrl = (photoPath) => {
    if (!photoPath) return "/vibrant-sports-arena.png"

    // If it's already a full URL, return as is
    if (photoPath.startsWith("http") || photoPath.startsWith("/upload")) {
      return photoPath
    }

    // Otherwise, prepend the upload folder path
    return `/upload/${photoPath}`
  }

  return (
    <main className="home-page">
      <section className="hero-carousel">
        <div className="carousel-container">
          {slides.map((slide, index) => (
            <div key={index} className={`carousel-slide ${index === currentSlide ? "active" : ""} ${slide.background}`}>
              <div className="hero-content">
                <div className="hero-text">
                  <h1 className="hero-title animate-fadeInUp">{slide.title}</h1>
                  <h2 className="hero-subtitle animate-fadeInUp">{slide.subtitle}</h2>
                  <p className="hero-description animate-fadeInUp">{slide.description}</p>
                  <div className="hero-actions animate-fadeInUp">
                    <Link to={slide.ctaLink} className="btn btn-primary btn-lg">
                      {slide.cta}
                    </Link>
                    <Link to="/signup" className="btn btn-outline btn-lg">
                      Sign Up Free
                    </Link>
                  </div>
                </div>
                <div className="hero-visual">
                  <div className="floating-sports">
                    <div className="sport-icon animate-float">🏸</div>
                    <div className="sport-icon animate-float" style={{ animationDelay: "1s" }}>
                      ⚽
                    </div>
                    <div className="sport-icon animate-float" style={{ animationDelay: "2s" }}>
                      🎾
                    </div>
                    <div className="sport-icon animate-float" style={{ animationDelay: "0.5s" }}>
                      🏓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        <button
          className="carousel-nav prev"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        >
          ‹
        </button>
        <button className="carousel-nav next" onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}>
          ›
        </button>
      </section>

      <section className="quick-access">
        <div className="container">
          <h3 className="section-title">Quick Access to Sports</h3>
          <div className="sports-grid">
            {sports.map((sport) => (
              <button
                key={sport.key}
                className="sport-card hover-lift"
                onClick={() => navigate(`/venues?sportType=${sport.key}`)}
              >
                <div className="sport-icon-large">{sport.icon}</div>
                <span className="sport-label">{sport.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-banner">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item animate-fadeInUp">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Happy Players</span>
            </div>
            <div className="stat-item animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <span className="stat-number">500+</span>
              <span className="stat-label">Premium Courts</span>
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

      <section className="popular-venues">
        <div className="container">
          <div className="section-header">
            <h3 className="section-title">Popular Venues</h3>
            <p className="section-subtitle">Discover the most loved sports facilities in your area</p>
          </div>

          <div className="venues-grid">
            {popular.map((venue) => (
              <div className="venue-card hover-lift" key={venue.id}>
                <div className="venue-image">
                  <img
                    src={getVenueImageUrl(venue.photos?.[0]) || "../download.jpeg"}
                    alt={venue.name}
                    className="venue-photo"
                  />
                  <div className="venue-badge">
                    <span className="rating">★ {venue.ratingAverage || "4.5"}</span>
                  </div>
                </div>
                <div className="venue-info">
                  <h4 className="venue-name">{venue.name}</h4>
                  <div className="venue-sports">
                    {venue.sports?.map((sport) => (
                      <span key={sport} className="sport-badge">
                        {sport}
                      </span>
                    ))}
                  </div>
                  <div className="venue-details">
                    <span className="venue-price">From ₹{venue.startingPrice}/hr</span>
                    <span className="venue-location">{venue.locationShort}</span>
                  </div>
                  <Link to={`/venues/${venue.id}`} className="btn btn-primary venue-cta">
                    Book Now
                  </Link>
                </div>
              </div>
            ))}

            {popular.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🏟️</div>
                <h4>No venues available yet</h4>
                <p>Check back soon for amazing sports facilities!</p>
              </div>
            )}
          </div>

          {popular.length > 0 && (
            <div className="section-footer">
              <Link to="/venues" className="btn btn-outline btn-lg">
                View All Venues
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
