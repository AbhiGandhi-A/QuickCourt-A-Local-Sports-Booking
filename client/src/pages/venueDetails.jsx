import React, { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api } from "../api/axios"

export default function VenueDetails() {
  const { id } = useParams()
  const [venue, setVenue] = useState(null)

  useEffect(() => {
    api.get(`/venues/${id}`).then(res => setVenue(res.data))
  }, [id])

  if (!venue) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <h2>{venue.name}</h2>
      <p>{venue.description}</p>
      <p>{venue.address}, {venue.city}</p>
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        {venue.amenities?.map(a => <span key={a} className="badge">{a}</span>)}
      </div>
      <div className="hr"></div>
      <h3>Courts</h3>
      <div className="grid grid-3">
        {venue.courts?.map(c => (
          <div className="card" key={c._id}>
            <div className="body">
              <h4>{c.name}</h4>
              <p>{c.sportType} • ₹{c.pricePerHour}/hr</p>
              <p>Hours: {c.operatingHours?.open} - {c.operatingHours?.close}</p>
              <Link className="btn" to={`/book/${venue.id}?courtId=${c._id}`}>Book Now</Link>
            </div>
          </div>
        ))}
      </div>
      <div className="hr"></div>
      <h3>About Venue</h3>
      <p>Type: {venue.venueType}</p>
      <p>Sports: {venue.sports?.join(", ")}</p>
      <p>Rating: {venue.ratingAverage}</p>
    </div>
  )
}