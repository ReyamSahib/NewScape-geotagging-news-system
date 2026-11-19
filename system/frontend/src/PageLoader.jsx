import { useEffect, useRef } from 'react'
import './PageLoader.css'

// Loading screen shown when the site opens and when moving between pages.
// The logo pulses while rings spread out from it,
// like a location signal, and then the loading screen fades away.
// waiting = true keeps the loading screen until the page has
// finished loading its data (used for Analytics).
export default function PageLoader({ onFinish, quick = false, waiting = false }) {

  // Remember that this loading screen waited for data, so it can
  // fade away straight away once the data is ready.
  const waitedForData = useRef(false)
  if (waiting) waitedForData.current = true
  const ready = !waiting && waitedForData.current

  // Safety: close the loading screen even if the animation does not run
  // (for example when the browser tab is in the background).
  useEffect(() => {
    const timer = setTimeout(
      onFinish,
      waiting ? 20000 : quick ? 900 : 2800
    )
    return () => clearTimeout(timer)
  }, [onFinish, quick, waiting])

  return (
    <div
      className={`page-loader ${quick ? 'quick' : ''} ${
        waiting ? 'waiting' : ''
      } ${ready ? 'ready' : ''}`}
      role="status"
      aria-label="Loading"
      onAnimationEnd={event => {
        if (event.animationName === 'pageLoaderFadeOut') {
          onFinish()
        }
      }}
    >
      <div className="page-loader-pulse">
        <span className="page-loader-ring" aria-hidden="true" />
        <span className="page-loader-ring second" aria-hidden="true" />
        <span className="page-loader-ring third" aria-hidden="true" />

        <div className="page-loader-badge">
          <img
            className="page-loader-logo"
            src="/newscape-logo.png"
            alt=""
          />
        </div>
      </div>

      <span className="page-loader-text">FINDING WHERE THE NEWS IS</span>
    </div>
  )
}