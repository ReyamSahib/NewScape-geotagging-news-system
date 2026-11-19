import './InsightsPages.css'

// Shared header for the About, Analytics and account pages,
// so all of them use the same navigation.
export function InsightsNav({ setPage, active, user, isAdmin = false }) {
  return (
    <header className="insights-nav">
      <button
        className="insights-brand"
        onClick={() => setPage('home')}
      >
        <img src="/newscape-logo.png" alt="" />
        NewScape
      </button>

      <nav>
        <button onClick={() => setPage('home')}>Home</button>
        <button
          className={active === 'map' ? 'active' : ''}
          onClick={() => setPage('map')}
        >
          Explore Map
        </button>
        <button
          className={active === 'analytics' ? 'active' : ''}
          onClick={() => setPage('analytics')}
        >
          Analytics
        </button>
        <button
          className={active === 'about' ? 'active' : ''}
          onClick={() => setPage('about')}
        >
          About
        </button>
        {/* Only shown to admin accounts (Aqsa's admin moderation) */}
        {isAdmin && (
          <button
            className={active === 'admin' ? 'active' : ''}
            onClick={() => setPage('admin')}
          >
            Admin Reports
          </button>
        )}
        <button
          className={`insights-account ${
            active === 'account' ? 'active' : ''
          }`}
          onClick={() => setPage(user ? 'profile' : 'login')}
        >
          {user ? 'My Profile' : 'Login'}
        </button>
      </nav>
    </header>
  )
}

export function AnalyticsPage({ articles = [], setPage }) {
  const geotagged = articles.filter(article => {
    const lat = Number(article.latitude)
    const lng = Number(article.longitude)

    return (
      article.latitude != null &&
      article.longitude != null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= 22 &&
      lat <= 27 &&
      lng >= 51 &&
      lng <= 57
    )
  })

  const categoryCounts = articles.reduce((result, article) => {
    const category = article.category || 'Other'
    result[category] = (result[category] || 0) + 1
    return result
  }, {})

  const categories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])

  const geotaggingRate = articles.length
    ? ((geotagged.length / articles.length) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="insights-page">
      <header className="insights-nav">
        <button
          className="insights-brand"
          onClick={() => setPage('home')}
        >
          <img src="/newscape-logo.png" alt="" />
          NewScape
        </button>

        <nav>
          <button onClick={() => setPage('home')}>Home</button>
          <button onClick={() => setPage('map')}>Explore Map</button>
          <button onClick={() => setPage('analytics')}>Analytics</button>
          <button onClick={() => setPage('about')}>About</button>
        </nav>
      </header>

      <main className="insights-content">
        <span className="insights-label">
          NEWSCAPE / DATA INTELLIGENCE
        </span>

        <h1>News Analytics</h1>

        <p>
          Discover how news is distributed across locations
          and categories through meaningful insights.
        </p>

        <div className="insights-stats">
          <article>
            <span>Total Articles</span>
            <strong>{articles.length}</strong>
            <small>Retrieved news records</small>
          </article>

          <article>
            <span>Geotagged UAE Articles</span>
            <strong>{geotagged.length}</strong>
            <small>Articles with usable UAE coordinates</small>
          </article>

          <article>
            <span>Geotagging Rate</span>
            <strong>{geotaggingRate}%</strong>
            <small>Percentage of articles mapped in UAE</small>
          </article>
        </div>

        <section className="insights-panel">
          <div className="insights-panel-header">
            <div>
              <span className="insights-label">CATEGORY OVERVIEW</span>
              <h2>News by Category</h2>
            </div>
            <span>{categories.length} categories</span>
          </div>

          {categories.length === 0 ? (
            <p>No article data available yet.</p>
          ) : (
            categories.map(([category, count]) => (
              <div className="insights-category" key={category}>
                <div className="insights-category-label">
                  <span>{category}</span>
                  <strong>{count}</strong>
                </div>

                <div className="insights-track">
                  <div
                    style={{
                      width: `${(count / articles.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </section>

        <button
          className="insights-primary"
          onClick={() => setPage('map')}
        >
          Explore News Map →
        </button>
      </main>
    </div>
  )
}

export function AboutPage({ setPage, user, isAdmin = false }) {
  return (
    <div className="insights-page">
      <InsightsNav
        setPage={setPage}
        active="about"
        user={user}
        isAdmin={isAdmin}
      />

      <main className="insights-content insights-about">
        <span className="insights-label">ABOUT THE PROJECT</span>

        <h1>News has a place.</h1>

        <p>
          NewScape is a location-based news discovery platform
          that connects news articles with geographic locations.
          Through an interactive map and news analytics, users
          can explore stories, discover nearby events, and
          better understand where news happens.
        </p>

        <div className="insights-about-features">
          <article>
            <h3>Interactive News Map</h3>
            <p>Explore geotagged news across the UAE.</p>
          </article>

          <article>
            <h3>Location-Based Discovery</h3>
            <p>Find news relevant to specific places.</p>
          </article>

          <article>
            <h3>News Analytics</h3>
            <p>Understand news categories and geographic coverage.</p>
          </article>

          <article>
            <h3>News Near You</h3>
            <p>
              Share your location to see stories within 5 to 50 km,
              nearest first. Your location never leaves your browser.
            </p>
          </article>

          <article>
            <h3>Smart Filters</h3>
            <p>Search by keyword and filter by category, emirate and date.</p>
          </article>

          <article>
            <h3>One Story, Once</h3>
            <p>
              The same story from several sources is shown only once,
              so the headlines stay clear.
            </p>
          </article>
        </div>

        {/* HOW IT WORKS */}
        <section className="insights-section">
          <span className="insights-label">HOW IT WORKS</span>
          <h2>From headline to map pin</h2>

          <ol className="insights-steps">
            <li>
              <strong>Collect</strong>
              <span>
                News is retrieved from several sources and repeated
                stories are removed.
              </span>
            </li>
            <li>
              <strong>Locate</strong>
              <span>
                AI reads each article and identifies where the main
                event happened, not just which places are mentioned.
              </span>
            </li>
            <li>
              <strong>Classify</strong>
              <span>AI assigns each story one news category.</span>
            </li>
            <li>
              <strong>Pin</strong>
              <span>
                The location is turned into map coordinates and checked
                against the right emirate.
              </span>
            </li>
            <li>
              <strong>Explore</strong>
              <span>
                Stories appear on the map, in Latest News and in the
                analytics dashboard.
              </span>
            </li>
          </ol>
        </section>

        {/* NEWS SOURCES */}
        <section className="insights-section">
          <span className="insights-label">WHERE THE NEWS COMES FROM</span>
          <h2>Real articles from real publishers</h2>

          <div className="insights-sources">
            <article>
              <h3>Abu Dhabi Media Office</h3>
              <p>Official government news feeds by topic.</p>
            </article>
            <article>
              <h3>GNews</h3>
              <p>UAE headlines and searches across all seven emirates.</p>
            </article>
            <article>
              <h3>World News API</h3>
              <p>News published by UAE-based outlets.</p>
            </article>
            <article>
              <h3>NewsAPI</h3>
              <p>UAE-related coverage from international publishers.</p>
            </article>
          </div>

          <p className="insights-note">
            Every story links back to the original article.
          </p>
        </section>

        {/* CATEGORIES */}
        <section className="insights-section">
          <span className="insights-label">NEWS CATEGORIES</span>
          <h2>Ten ways to browse</h2>

          <div className="insights-chips">
            <span>Business</span>
            <span>Finance</span>
            <span>Technology</span>
            <span>Health</span>
            <span>Education</span>
            <span>Sports</span>
            <span>Entertainment</span>
            <span>Weather</span>
            <span>Traffic &amp; Transport</span>
            <span>Other</span>
          </div>
        </section>

        {/* TEAM */}
        <section className="insights-section">
          <span className="insights-label">THE TEAM</span>
          <h2>Built at the University of Sharjah</h2>

          <p className="insights-section-intro">
            NewScape is a Senior Project in the Computer Science
            Department, College of Computing and Informatics.
          </p>

          <div className="insights-team">
            <article>
              <strong>Hind Khalfan Alsuwaidi</strong>
              <span>Team member</span>
            </article>
            <article>
              <strong>Aqsa Muhammad Bairan</strong>
              <span>Team member</span>
            </article>
            <article>
              <strong>Reyam Sahib Alhebshi</strong>
              <span>Team member</span>
            </article>
            <article>
              <strong>Dr. Osman Abul</strong>
              <span>Supervisor</span>
            </article>
          </div>
        </section>

        <button
          className="insights-primary"
          onClick={() => setPage('map')}
        >
          Start Exploring →
        </button>
      </main>
    </div>
  )
}