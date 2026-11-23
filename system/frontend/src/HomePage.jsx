import './HomePage.css';

// Decorative homepage pins; the live article pins remain on Explore Map.
// Percentages correspond to the 1536 × 1024 transparent UAE illustration.
const PINS = [
  { id: 'abu-dhabi', label: 'Abu Dhabi', x: 43.5, y: 66.0, color: '#5bd8ff' },
  { id: 'al-ain', label: 'Al Ain', x: 64.0, y: 66.5, color: '#75d6ff' },
  { id: 'dubai', label: 'Dubai', x: 70.5, y: 42.5, color: '#50efff' },
  { id: 'sharjah', label: 'Sharjah', x: 74.0, y: 36.1, color: '#a5b6ff' },
  { id: 'ras-al-khaimah', label: 'Ras Al Khaimah', x: 82.7, y: 27.5, color: '#51d3ff' },
  { id: 'fujairah', label: 'Fujairah', x: 85.5, y: 42.0, color: '#7fe8e2' },
];

export default function HomePage({ setPage }) {
  return (
    <div className="ns-home">
      <div className="ns-home-ambient" aria-hidden="true" />
      <div className="ns-home-orbit ns-home-orbit-a" aria-hidden="true" />
      <div className="ns-home-orbit ns-home-orbit-b" aria-hidden="true" />

      <header className="ns-header">
        <button className="ns-logo" type="button" onClick={() => setPage('home')} aria-label="NewScape home">
          <img src="/newscape-logo.png" alt="" className="ns-home-logo" />
          <span>NewScape</span>
        </button>
        <nav aria-label="Main navigation">
          <button type="button" className="ns-nav-active" aria-current="page" onClick={() => setPage('home')}>Home</button>
          <button type="button" onClick={() => setPage('map')}>Explore Map</button>
          <button type="button" onClick={() => setPage('analytics')}>Analytics</button>
          <button type="button" onClick={() => setPage('about')}>About</button>
          <button type="button" className="ns-nav-login" onClick={() => setPage('login')}>Login</button>
        </nav>
      </header>

      <main>
        <section className="ns-hero" aria-label="Welcome to NewScape">
          <div className="ns-hero-copy">
            <span className="ns-eyebrow"><span className="ns-eyebrow-dot" /> UAE NEWS, REIMAGINED</span>
            <h1>News has a place.<br /><span>Discover where.</span></h1>
            <p>Explore news across the UAE through location. Find the stories behind every pin and see the bigger picture with meaningful insights.</p>
            <div className="ns-actions">
              <button type="button" className="ns-primary" onClick={() => setPage('map')}>Explore Live Map <span aria-hidden="true">↗</span></button>
              <button type="button" className="ns-secondary" onClick={() => setPage('analytics')}>View Analytics <span aria-hidden="true">→</span></button>
            </div>
            <div className="ns-hero-caption"><span className="ns-caption-line" /> LOCATION-BASED NEWS DISCOVERY</div>
          </div>

          <div className="ns-hero-art" aria-label="Geographically accurate outline of the United Arab Emirates with sequentially animated location pins">
            <div className="ns-art-glow" aria-hidden="true" />
            <div className="ns-art-grid" aria-hidden="true" />
            <div className="ns-map-aura" aria-hidden="true" />
            <div className="ns-reference-stage">
              <img className="ns-reference-map" src="/newscape-uae-map.png" alt="Blue illustrated map of the United Arab Emirates" />
              <div className="ns-reference-pulses" aria-hidden="true">
                {PINS.map((pin, index) => (
                  <span
                    key={pin.id}
                    className="ns-reference-pulse"
                    title={pin.label}
                    style={{
                      '--x': `${pin.x}%`,
                      '--y': `${pin.y}%`,
                      '--pin-delay': `${index * 1.45}s`,
                      '--pin-color': pin.color,
                    }}
                  >
                    <svg className="ns-location-pin" viewBox="0 0 32 43" role="presentation" focusable="false" aria-hidden="true">
                      <path d="M16 1.5C8 1.5 2 7.6 2 15.2c0 10.1 14 25.5 14 25.5s14-15.4 14-25.5C30 7.6 24 1.5 16 1.5Z" fill="var(--pin-color)" stroke="#e6fbff" strokeWidth="2.2" />
                      <circle cx="16" cy="15" r="6.2" fill="#06243b" stroke="rgba(255,255,255,.65)" strokeWidth="1" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
            <span className="ns-art-corner ns-art-corner-tl" aria-hidden="true" />
            <span className="ns-art-corner ns-art-corner-br" aria-hidden="true" />
          </div>
        </section>

        <section className="ns-features" aria-label="NewScape features">
          <div className="ns-features-intro"><span className="ns-eyebrow">EXPLORE THE POSSIBILITIES</span><h2>Every story, in context.</h2><p>Find, understand, and explore the news through the places that matter.</p></div>
          <div className="ns-feature-grid">
            <article><span className="ns-feature-index">01 / DISCOVER</span><span className="ns-feature-symbol" aria-hidden="true">◎</span><h3>News on the Map</h3><p>Explore UAE news through geotagged locations and interactive pins.</p></article>
            <article><span className="ns-feature-index">02 / FILTER</span><span className="ns-feature-symbol" aria-hidden="true">⌖</span><h3>Explore Your Way</h3><p>Search by location, category, or date to discover relevant stories.</p></article>
            <article><span className="ns-feature-index">03 / ANALYZE</span><span className="ns-feature-symbol" aria-hidden="true">▥</span><h3>See the Trends</h3><p>Understand categories, source coverage, and geotagging through analytics.</p></article>
          </div>
        </section>
      </main>
      <footer className="ns-footer"><span>© {new Date().getFullYear()} NewScape</span><span>News has a place. Discover where.</span></footer>
    </div>
  );
}
