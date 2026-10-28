import './App.css'

import { useEffect, useState } from 'react'

import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow
} from '@react-google-maps/api'


// ======================================
// GOOGLE MAP SETTINGS
// ======================================

const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

const uaeCenter = {
  lat: 24.4539,
  lng: 54.3773
}

const emirates = {
  All: uaeCenter,
  'Abu Dhabi, UAE': { lat: 24.4539, lng: 54.3773 },
  'Dubai, UAE': { lat: 25.2048, lng: 55.2708 },
  'Sharjah, UAE': { lat: 25.3463, lng: 55.4209 },
  'Ajman, UAE': { lat: 25.4052, lng: 55.5136 },
  'Umm Al Quwain, UAE': { lat: 25.5647, lng: 55.5552 },
  'Ras Al Khaimah, UAE': { lat: 25.7895, lng: 55.9432 },
  'Fujairah, UAE': { lat: 25.1288, lng: 56.3265 }
}


// ======================================
// ALL 11 NEWS CATEGORIES
// ======================================

const categories = [
  'Business & Economy',
  'Crime & Security',
  'Traffic & Transport',
  'Weather',
  'Health',
  'Education',
  'Sports',
  'Technology',
  'Events & Entertainment',
  'Environment',
  'Other'
]


// ======================================
// CATEGORY PIN COLORS
// ======================================

const categoryColors = {
  'Business & Economy': '#0f766e',
  'Crime & Security': '#dc2626',
  'Traffic & Transport': '#f97316',
  'Weather': '#38bdf8',
  'Health': '#fbbf24',
  'Education': '#16a34a',
  'Sports': '#eab308',
  'Technology': '#2478f2',
  'Events & Entertainment': '#ec4899',
  'Environment': '#059669',
  'Other': '#8b5cf6'
}


// ======================================
// CREATE COLORED LOCATION PINS
// ======================================

function createPinIcon(category) {

  const color =
    categoryColors[category] || categoryColors.Other

  const pinSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="40"
         height="52"
         viewBox="0 0 40 52">

      <path
        d="M20 2
           C10 2 3 10 3 20
           C3 34 20 49 20 49
           C20 49 37 34 37 20
           C37 10 30 2 20 2 Z"
        fill="${color}"
        stroke="white"
        stroke-width="2"
      />

      <circle
        cx="20"
        cy="20"
        r="7"
        fill="white"
      />

    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSVG)}`,
    scaledSize: new window.google.maps.Size(34, 44),
    anchor: new window.google.maps.Point(17, 42)
  }
}


// ======================================
// FORMAT ARTICLE DATE
// ======================================

function formatDate(dateValue) {

  if (!dateValue) return ''

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}


// ======================================
// MAIN APPLICATION
// ======================================

function App() {

  // Articles from MySQL through FastAPI
  const [articles, setArticles] = useState([])

  // Loading
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Messages
  const [statusMessage, setStatusMessage] = useState('')
  const [loadError, setLoadError] = useState('')

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLocation, setSelectedLocation] = useState('All')
  const [selectedDate, setSelectedDate] = useState('All')

  // Selected news
  const [selectedArticle, setSelectedArticle] = useState(null)

  // Google Maps settings
  const [mapCenter, setMapCenter] = useState(uaeCenter)
  const [mapZoom, setMapZoom] = useState(7)
  const [mapType, setMapType] = useState('roadmap')

  const [analyticsSummary, setAnalyticsSummary] = useState(null)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/analytics/summary")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load analytics")
        }
        return response.json()
      })
      .then((data) => setAnalyticsSummary(data))
      .catch((error) => console.error("Analytics error:", error))
  }, [])


  // ======================================
  // FETCH SAVED ARTICLES
  // ======================================

  const fetchArticles = async (refresh = false) => {

    if (refresh) {
      setIsRefreshing(true)
      setStatusMessage('Refreshing saved news...')
    } else {
      setIsLoading(true)
    }

    setLoadError('')

    try {

      const response = await fetch(
        'http://127.0.0.1:8000/articles',
        { cache: 'no-store' }
      )

      if (!response.ok) {
        throw new Error('Unable to retrieve articles')
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error('Invalid article data')
      }

      setArticles(data)
      setSelectedArticle(null)

      setStatusMessage(
        refresh ? 'News updated successfully!' : ''
      )

    } catch (error) {

      console.error('Error loading articles:', error)

      setLoadError(
        'Unable to load news. Please check that FastAPI is running.'
      )

      setStatusMessage('')

    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }


  // Load articles when website opens
  useEffect(() => {
    fetchArticles()
  }, [])


  // ======================================
  // VALID UAE ARTICLES
  // ======================================

  const validArticles = articles.filter((article) => {

    if (
      article.latitude == null ||
      article.longitude == null
    ) {
      return false
    }

    const lat = Number(article.latitude)
    const lng = Number(article.longitude)

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= 22 &&
      lat <= 27 &&
      lng >= 51 &&
      lng <= 57
    )
  })


  // Check if article publication dates are available
  const hasDates = articles.some(
    (article) =>
      article.published_datetime ||
      article.publishedAt
  )


  // ======================================
  // FILTER ARTICLES
  // ======================================

  const filteredArticles = validArticles.filter((article) => {

    const query = searchQuery.toLowerCase().trim()

    const searchableText = [
      article.title,
      article.category,
      article.location,
      article.content
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const searchMatches =
      !query || searchableText.includes(query)

    const categoryMatches =
      selectedCategory === 'All' ||
      article.category === selectedCategory

    const locationMatches =
      selectedLocation === 'All' ||
      article.location === selectedLocation

    let dateMatches = true

    if (selectedDate !== 'All') {

      const dateValue =
        article.published_datetime || article.publishedAt

      const published = dateValue
        ? new Date(dateValue)
        : null

      const days = selectedDate === '7' ? 7 : 30

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      dateMatches =
        published !== null &&
        !Number.isNaN(published.getTime()) &&
        published >= cutoff
    }

    return (
      searchMatches &&
      categoryMatches &&
      locationMatches &&
      dateMatches
    )
  })


  // ======================================
  // RESET FILTERS
  // ======================================

  const resetFilters = () => {

    setSearchQuery('')
    setSelectedCategory('All')
    setSelectedLocation('All')
    setSelectedDate('All')

    setSelectedArticle(null)

    setMapCenter(uaeCenter)
    setMapZoom(7)
  }


  // ======================================
  // CHANGE CITY
  // ======================================

  const handleLocationChange = (event) => {

    const location = event.target.value

    setSelectedLocation(location)
    setSelectedArticle(null)

    setMapCenter(emirates[location])
    setMapZoom(location === 'All' ? 7 : 10)
  }


  // ======================================
  // OPEN ARTICLE
  // ======================================

  const openArticle = (article) => {

    setSelectedArticle(article)

    setMapCenter({
      lat: Number(article.latitude),
      lng: Number(article.longitude)
    })

    setMapZoom(11)
  }


  // ======================================
  // WEBSITE
  // ======================================

  return (

    <div className="app">

      {/* NAVIGATION BAR */}

      <header className="navbar">

        <div className="brand">

          <img
            src="/newscape-logo.png"
            alt="NewScape Logo"
            className="brand-logo"
          />

          <div className="brand-text">
            <h1>NewScape</h1>
          </div>

        </div>


        <nav className="nav-links" aria-label="Main navigation">

          <a href="#home" className="active">
            Home
          </a>

          <a href="#explore-map">
            Explore Map
          </a>

          <a href="#analytics">
            Analytics
          </a>

          <span className="nav-placeholder" title="Coming soon">
            About
          </span>

        </nav>


        <div className="nav-actions">

          <span className="nav-search-icon" aria-hidden="true">
            ⌕
          </span>

          <button
            className="login-button"
            disabled
            title="Coming soon"
          >
            Login
          </button>

          <button
            className="signup-button"
            disabled
            title="Coming soon"
          >
            Sign Up
          </button>

        </div>

      </header>


      {/* HOME PAGE */}

      <main id="home" className="home-page">

        <div className="home-layout">


          {/* LEFT SIDE */}

          <section className="map-section" id="explore-map">

            <div className="hero-text">

              <h2>Discover News Across the UAE</h2>

            </div>


            {/* SEARCH BAR */}

            <div className="search-bar">

              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                placeholder="Search for news, keywords, or locations..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                aria-label="Search news"
              />

              <button
                type="button"
                className="search-button"
                aria-label="Search"
              >
                ⌕
              </button>

            </div>


            {/* FILTERS */}

            <div className="filters">


              {/* CATEGORY FILTER */}

              <div className="filter-group">

                <span aria-hidden="true">▤</span>

                <select
                  value={selectedCategory}
                  aria-label="Filter by category"
                  onChange={(event) => {
                    setSelectedCategory(event.target.value)
                    setSelectedArticle(null)
                  }}
                >

                  <option value="All">All Categories</option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}

                </select>

              </div>


              {/* CITY FILTER */}

              <div className="filter-group">

                <span aria-hidden="true">♧</span>

                <select
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  aria-label="Filter by city"
                >

                  <option value="All">All Cities</option>

                  {Object.keys(emirates)
                    .filter((location) => location !== 'All')
                    .map((location) => (

                      <option key={location} value={location}>
                        {location.replace(', UAE', '')}
                      </option>

                    ))}

                </select>

              </div>


              {/* DATE FILTER */}

              <div className="filter-group">

                <span aria-hidden="true">▦</span>

                <select
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(event.target.value)
                  }
                  disabled={!hasDates}
                  aria-label="Filter by date"
                  title={
                    hasDates
                      ? 'Filter articles by date'
                      : 'Publication dates are not available yet'
                  }
                >

                  <option value="All">All Dates</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>

                </select>

              </div>


              {/* RESET */}

              <button
                type="button"
                className="reset-button"
                onClick={resetFilters}
              >
                Reset
              </button>


              {/* REFRESH */}

              <button
                type="button"
                className="refresh-button"
                onClick={() => fetchArticles(true)}
                disabled={isRefreshing || isLoading}
              >
                {isRefreshing ? 'Refreshing...' : '↻ Refresh'}
              </button>

            </div>


            {/* STATUS MESSAGES */}

            {isLoading && (
              <p className="status-text" role="status">
                Loading news...
              </p>
            )}

            {statusMessage && (
              <p className="status-text" role="status">
                {statusMessage}
              </p>
            )}

            {loadError && (
              <p className="error-text" role="alert">
                {loadError}
              </p>
            )}


            {/* GOOGLE MAP */}

            <div className="map-card">

              <div className="google-map-area">


                <LoadScript
                  googleMapsApiKey={
                    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                  }
                  language="en"
                  region="AE"
                >

                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={mapZoom}
                    mapTypeId={mapType}
                    options={{
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: true,

                      restriction: {
                        latLngBounds: {
                          north: 27,
                          south: 22,
                          east: 57,
                          west: 51
                        },
                        strictBounds: false
                      }
                    }}
                  >


                    {/* NEWS LOCATION PINS */}

                    {filteredArticles.map((article) => (

                      <Marker
                        key={article.id}
                        position={{
                          lat: Number(article.latitude),
                          lng: Number(article.longitude)
                        }}
                        icon={createPinIcon(article.category)}
                        onClick={() => setSelectedArticle(article)}
                      />

                    ))}


                    {/* NEWS DETAILS POPUP */}

                    {selectedArticle && (

                      <InfoWindow
                        position={{
                          lat: Number(selectedArticle.latitude),
                          lng: Number(selectedArticle.longitude)
                        }}
                        onCloseClick={() => setSelectedArticle(null)}
                      >

                        <div className="news-popup">

                          <h3>{selectedArticle.title}</h3>

                          <span className="popup-category">
                            {selectedArticle.category}
                          </span>

                          <p>
                            📍 {selectedArticle.location}
                          </p>

                          <p>
                            {selectedArticle.content ||
                              'No article details available.'}
                          </p>

                          {selectedArticle.url &&
                            !selectedArticle.url.includes('example.com') && (

                              <a
                                href={selectedArticle.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Read Full Article →
                              </a>

                            )}

                        </div>

                      </InfoWindow>

                    )}

                  </GoogleMap>

                </LoadScript>


                {/* MAP / SATELLITE BUTTONS */}

                <div className="map-type-control">

                  <button
                    type="button"
                    className={
                      mapType === 'roadmap' ? 'selected' : ''
                    }
                    onClick={() => setMapType('roadmap')}
                  >
                    Map
                  </button>

                  <button
                    type="button"
                    className={
                      mapType === 'hybrid' ? 'selected' : ''
                    }
                    onClick={() => setMapType('hybrid')}
                  >
                    Satellite
                  </button>

                </div>

              </div>


              {/* ======================================
                  MAP LEGEND — ALL 11 CATEGORIES
              ====================================== */}

              <div className="map-legend">

                {categories.map((category) => (

                  <div
                    className="legend-item"
                    key={category}
                  >

                    <span
                      className="legend-dot"
                      style={{
                        backgroundColor: categoryColors[category]
                      }}
                    />

                    <span>{category}</span>

                  </div>

                ))}

              </div>

            </div>

          </section>


          {/* RIGHT SIDE — LATEST NEWS */}

          <aside className="latest-news-panel">

            <div className="latest-news-header">

              <h3>Latest News</h3>

              <button
                type="button"
                onClick={resetFilters}
              >
                View All
              </button>

            </div>


            <div className="latest-news-list">

              {filteredArticles.length === 0 &&
                !isLoading &&
                !loadError && (

                  <p className="no-news">
                    No articles found for the selected filters.
                  </p>

                )}


              {filteredArticles.slice(0, 5).map((article) => (

                <button
                  type="button"
                  className="news-card"
                  key={article.id}
                  onClick={() => openArticle(article)}
                >

                  {/* NEWS IMAGE */}

                  <div
                    className="news-thumbnail"
                    style={{
                      backgroundImage: article.image_url
                        ? `url("${article.image_url}")`
                        : undefined
                    }}
                  >

                    {!article.image_url && (
                      <span>📰</span>
                    )}

                  </div>


                  {/* NEWS INFORMATION */}

                  <div className="news-card-content">

                    <h4>{article.title}</h4>

                    <span className="category-badge">
                      {article.category}
                    </span>

                    <p>
                      📍 {article.location || 'UAE'}
                    </p>

                    {(article.published_datetime ||
                      article.publishedAt) && (

                      <p>
                        ▦ {formatDate(
                          article.published_datetime ||
                          article.publishedAt
                        )}
                      </p>

                    )}

                  </div>

                  <span className="news-arrow">
                    ›
                  </span>

                </button>

              ))}

            </div>


            <div className="news-count">
              Showing {filteredArticles.length} articles
            </div>

          </aside>

        </div>

            </main>

      {/* ANALYTICS DASHBOARD */}

      <section id="analytics" className="analytics-section">

        <div className="analytics-header">
          <h2>NewScape Analytics</h2>
          <p>
            Explore news trends, category distribution,
            and geotagging performance across the UAE.
          </p>
        </div>

        <div className="analytics-stats">

          <div className="analytics-stat-card">
            <h3>Total Articles</h3>
            <p>{analyticsSummary?.total_articles ?? "—"}</p>
          </div>

          <div className="analytics-stat-card">
            <h3>Geotagged Articles</h3>
            <p>{analyticsSummary?.map_articles ?? "—"}</p>
          </div>

          <div className="analytics-stat-card">
            <h3>Unlocated Articles</h3>
            <p>{analyticsSummary?.non_geotaggable_articles ?? "—"}</p>
          </div>

        </div>

      </section>

  </div>
  )
}

export default App