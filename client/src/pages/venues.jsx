import React, { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { api } from "../api/axios"

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function Venues() {
  const q = useQuery()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(Number(q.get("page")) || 1)
  const [pages, setPages] = useState(1)
  const [filters, setFilters] = useState({
    q: q.get("q") || "",
    sportType: q.get("sportType") || "",
    minPrice: q.get("minPrice") || "",
    maxPrice: q.get("maxPrice") || "",
    venueType: q.get("venueType") || "",
    minRating: q.get("minRating") || ""
  })

  const fetchData = async (pageNum = page) => {
    const params = { page: pageNum, limit: 9, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }
    const res = await api.get("/venues", { params })
    setItems(res.data.data)
    setTotal(res.data.total)
    setPage(res.data.page)
    setPages(res.data.pages)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const onFilter = (e) => {
    e.preventDefault()
    const sp = new URLSearchParams()
    Object.entries(filters).forEach(([k,v]) => v && sp.set(k, v))
    sp.set("page", "1")
    navigate(`/venues?${sp.toString()}`)
    setPage(1)
    fetchData(1)
  }

  const onPage = (p) => {
    const sp = new URLSearchParams()
    Object.entries(filters).forEach(([k,v]) => v && sp.set(k, v))
    sp.set("page", String(p))
    navigate(`/venues?${sp.toString()}`)
    fetchData(p)
  }

  return (
    <div className="container">
      <h2>Venues</h2>
      <form onSubmit={onFilter} className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto", gap: 8 }}>
        <input className="input" placeholder="Search name or city" value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })}/>
        <select className="select" value={filters.sportType} onChange={e => setFilters({ ...filters, sportType: e.target.value })}>
          <option value="">Sport</option>
          <option value="badminton">Badminton</option>
          <option value="football">Football</option>
          <option value="tennis">Tennis</option>
          <option value="table-tennis">Table Tennis</option>
        </select>
        <input className="input" type="number" placeholder="Min Price" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })}/>
        <input className="input" type="number" placeholder="Max Price" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}/>
        <select className="select" value={filters.venueType} onChange={e => setFilters({ ...filters, venueType: e.target.value })}>
          <option value="">Type</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
          <option value="mixed">Mixed</option>
        </select>
        <select className="select" value={filters.minRating} onChange={e => setFilters({ ...filters, minRating: e.target.value })}>
          <option value="">Min Rating</option>
          <option value="3">3.0</option>
          <option value="3.5">3.5</option>
          <option value="4">4.0</option>
          <option value="4.5">4.5</option>
        </select>
        <button className="btn" type="submit">Apply</button>
      </form>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        {items.map(v => (
          <div className="card" key={v.id}>
            <div className="body">
              <h4>{v.name}</h4>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {v.sports?.map(s => <span key={s} className="badge">{s}</span>)}
              </div>
              <p className="muted">From ₹{v.startingPrice}/hr • {v.locationShort}</p>
              <Link to={`/venues/${v.id}`} className="btn" style={{ marginTop: 8 }}>View</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
        <span>Total: {total}</span>
        <div className="row">
          <button disabled={page <= 1} className="btn ghost" onClick={() => onPage(page - 1)}>Prev</button>
          <span style={{ padding: "0 10px" }}>{page} / {pages}</span>
          <button disabled={page >= pages} className="btn ghost" onClick={() => onPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}