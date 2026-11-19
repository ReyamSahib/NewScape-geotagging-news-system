
import './HomePage.css'

export default function HomePage({ setPage }) {
  return (
    <div className="ns-home">
      <div className="ns-city-glow" aria-hidden="true" />
      <div className="ns-light-trails" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      <header className="ns-header">
        <button
  className="ns-logo"
  onClick={() => setPage('home')}
>
  <img
    src="/newscape-logo.png"
    alt="NewScape Logo"
    className="ns-home-logo"
  />
  <span>NewScape</span>
</button>

      
<nav aria-label="Main navigation">
  <button onClick={() => setPage('home')}>
    Home
  </button>

  <button onClick={() => setPage('map')}>
    Explore Map
  </button>

  <button onClick={() => setPage('analytics')}>
    Analytics
  </button>

  <button
    onClick={() =>
      document.getElementById('about')?.scrollIntoView({
        behavior: 'smooth'
      })
    }
  >
    About
  </button>

  <button
    onClick={() => setPage('login')}
    className="ns-nav-login"
  >
    Sign In
  </button>
</nav>

      </header>

      <main>
        <section className="ns-hero">
          <span className="ns-eyebrow">
            LOCATION-BASED NEWS INTELLIGENCE
          </span>

          <h1>
            News has a place.
            <br />
            <span>Discover where.</span>
          </h1>

          <p>
            Explore real-world news through an interactive map.
            Discover stories by location, explore nearby events,
            and understand the world around you.
          </p>

          <div className="ns-actions">
            <button
              className="ns-primary"
              onClick={() => setPage('map')}
            >
              Explore Live Map <span aria-hidden="true">↗</span>
            </button>

            <button
              className="ns-secondary"
              onClick={() => setPage('analytics')}
            >
              View Analytics
            </button>
          </div>

          <div className="ns-feature-grid">
            <article>
              <span>01 / DISCOVER</span>
              <h3>Interactive News Map</h3>
              <p>Explore geographically tagged news stories.</p>
            </article>

            <article>
              <span>02 / EXPLORE</span>
              <h3>Nearby News</h3>
              <p>Find stories within a selected distance.</p>
            </article>

            <article>
              <span>03 / UNDERSTAND</span>
              <h3>News Analytics</h3>
              <p>Explore news trends and category insights.</p>
            </article>
          </div>
        </section>

        <section className="ns-about" id="about">
          <div>
            <span className="ns-eyebrow">ABOUT THE PROJECT</span>
            <h2>See the bigger picture.</h2>
          </div>
          <p>
            NewScape is a geotagging news platform that connects
            news stories with geographic locations, helping users
            explore information through interactive maps and
            meaningful data visualizations.
          </p>
        </section>
      </main>

      <footer className="ns-footer">
        <span>© {new Date().getFullYear()} NewScape</span>
        <span>Discover news through location.</span>
      </footer>
    </div>
  )
}
