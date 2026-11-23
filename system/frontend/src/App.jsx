import "./App.css";

import "./MapPage.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {

  GoogleMap,

  useJsApiLoader,

  Marker,

  InfoWindow,

  CircleF,

} from "@react-google-maps/api";

import AnalyticsDashboard from "./AnalyticsDashboard";

import UserPages from "./UserPages";

import HomePage from "./HomePage";

import { AboutPage, InsightsNav } from "./InsightsPages";

import PageLoader from "./PageLoader";



const API_URL = "http\://127.0.0.1:8000";



const mapContainerStyle = {

  width: "100%",

  height: "100%",

};



const uaeCenter = {

  lat: 24.4539,

  lng: 54.3773,

};



const emirates = {

  All: uaeCenter,

  "Abu Dhabi, UAE": { lat: 24.4539, lng: 54.3773 },

  "Dubai, UAE": { lat: 25.2048, lng: 55.2708 },

  "Sharjah, UAE": { lat: 25.3463, lng: 55.4209 },

  "Ajman, UAE": { lat: 25.4052, lng: 55.5136 },

  "Umm Al Quwain, UAE": { lat: 25.5647, lng: 55.5552 },

  "Ras Al Khaimah, UAE": { lat: 25.7895, lng: 55.9432 },

  "Fujairah, UAE": { lat: 25.1288, lng: 56.3265 },

};



// Categories exactly as stored in the Category table of the

// database (and shown in Analytics). "Other" is always last.

const categories = [

  "Business",

  "Finance",

  "Technology",

  "Health",

  "Education",

  "Sports",

  "Entertainment",

  "Weather",

  "Traffic & Transport",

  "Other",

];



const categoryColors = {

  Business: "#0f766e",

  Finance: "#dc2626",

  Technology: "#2478f2",

  Health: "#fbbf24",

  Education: "#16a34a",

  Sports: "#eab308",

  Entertainment: "#ec4899",

  Weather: "#38bdf8",

  "Traffic & Transport": "#f97316",

  Other: "#8b5cf6",

};



// Cache pin icons so markers are not rebuilt on every render.

const pinIconCache = {};



function createPinIcon(category) {

  const color = categoryColors[category] || categoryColors.Other;



  if (pinIconCache[color]) return pinIconCache[color];



  const pinSVG = `

    <svg xmlns="http\://www.w3.org/2000/svg"

         width="40" height="52" viewBox="0 0 40 52">

      <path

        d="M20 2 C10 2 3 10 3 20

           C3 34 20 49 20 49

           C20 49 37 34 37 20

           C37 10 30 2 20 2 Z"

        fill="${color}"

        stroke="white"

        stroke-width="2"

      />

      <circle cx="20" cy="20" r="7" fill="white" />

    </svg>

  `;



  pinIconCache[color] = {

    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSVG)}`,

    scaledSize: new window.google.maps.Size(34, 44),

    anchor: new window.google.maps.Point(17, 42),

  };



  return pinIconCache[color];

}



function formatDate(dateValue) {

  if (!dateValue) return "";



  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";



  return date.toLocaleDateString("en-US", {

    month: "short",

    day: "numeric",

    year: "numeric",

  });

}



function hasUsableCoordinates(article) {

  if (

    article.latitude == null ||

    article.longitude == null

  ) {

    return false;

  }



  const lat = Number(article.latitude);

  const lng = Number(article.longitude);



  return (

    Number.isFinite(lat) &&

    Number.isFinite(lng) &&

    lat >= 22 &&

    lat <= 27 &&

    lng >= 51 &&

    lng <= 57

  );

}



// ======================================

// DISTANCE (NEWS NEAR ME)

// ======================================

// Straight-line distance in km between two coordinates

// (haversine formula). Used to find news close to the user.



function distanceKm(lat1, lng1, lat2, lng2) {

  const toRadians = (value) => (value * Math.PI) / 180;



  const dLat = toRadians(lat2 - lat1);

  const dLng = toRadians(lng2 - lng1);



  const a =

    Math.sin(dLat / 2) ** 2 +

    Math.cos(toRadians(lat1)) *

      Math.cos(toRadians(lat2)) *

      Math.sin(dLng / 2) ** 2;



  return 6371 * 2 * Math.asin(Math.sqrt(a));

}



function formatDistance(distance) {

  if (distance < 1) return "less than 1 km away";

  if (distance < 10) return `${distance.toFixed(1)} km away`;

  return `${Math.round(distance)} km away`;

}



// ======================================

// NO LOCATION ICON

// ======================================

// Image shown on headlines that could not be geotagged.

// Same size as the 📍 used for located news.



function NoLocationIcon() {

  return (

    <svg

      className="no-location-icon"

      viewBox="0 0 24 24"

      width="20"

      height="20"

      fill="none"

      stroke="#ef4444"

      strokeWidth="2"

      strokeLinecap="round"

      strokeLinejoin="round"

      aria-hidden="true"

    >

      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z" />

      <circle cx="12" cy="10" r="2.5" />

      <path d="M3 3l18 18" />

    </svg>

  );

}



// Checks that an article has a real link to the original page.

function hasArticleLink(article) {

  return (

    article.url &&

    /^https?:\/\//i.test(article.url) &&

    !article.url.includes("example.com")

  );

}



// ======================================

// SPREAD PINS THAT SHARE A LOCATION

// ======================================

// Several articles can have exactly the same coordinates (for

// example when only the emirate is known), so their pins sit on

// top of each other and only the last one can be clicked.

// Pins at the same spot are spread in a small spiral around it.

// Only the map position changes: the stored coordinates and the

// distances shown to the user stay the same.



function spreadOverlappingPins(articles) {

  const groups = {};



  articles.forEach((article) => {

    const key = `${Number(article.latitude).toFixed(4)},${Number(

      article.longitude

    ).toFixed(4)}`;



    if (!groups[key]) groups[key] = [];

    groups[key].push(article);

  });



  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const step = 0.004; // about 400 m between neighbouring pins



  return Object.values(groups).flatMap((group) =>

    group.map((article, index) => {

      const radius = step * Math.sqrt(index);

      const angle = index * goldenAngle;



      return {

        ...article,

        map_lat: Number(article.latitude) + radius * Math.cos(angle),

        map_lng: Number(article.longitude) + radius * Math.sin(angle),

      };

    })

  );

}



// Rough UAE bounding box, used to check the user's location.

function isInsideUae(location) {

  return (

    location.lat >= 22 &&

    location.lat <= 27 &&

    location.lng >= 51 &&

    location.lng <= 57

  );

}



// ======================================

// EMIRATE DETECTION

// ======================================

// The database stores free-text locations such as

// "Dubai World Trade Centre, Dubai", so an exact match against

// "Dubai, UAE" never succeeds. We first look for the emirate (or a

// well-known area inside it) in the location text, and only fall

// back to the nearest emirate centre when the text gives no clue.



const emirateKeywords = {

  "Abu Dhabi, UAE": [

    "abu dhabi", "al ain", "yas island", "saadiyat", "ruwais",

    "al dhafra", "khalifa city", "mussafah", "liwa", "madinat zayed",

  ],

  "Dubai, UAE": [

    "dubai", "jebel ali", "hatta", "deira", "jumeirah", "bur dubai",

    "business bay", "al barsha", "downtown dubai",

  ],

  "Sharjah, UAE": [

    "sharjah", "khor fakkan", "khorfakkan", "kalba", "al dhaid",

    "dibba al-hisn", "dibba al hisn", "al majaz", "muwaileh",

  ],

  "Ajman, UAE": ["ajman", "masfout"],

  "Umm Al Quwain, UAE": ["umm al quwain", "umm al-quwain", "uaq"],

  "Ras Al Khaimah, UAE": [

    "ras al khaimah", "ras al-khaimah", "rak", "al marjan island",

    "jebel jais",

  ],

  "Fujairah, UAE": ["fujairah", "dibba al-fujairah", "masafi", "dibba"],

};



function normalizeText(value) {

  return String(value || "")

    .toLowerCase()

    .replace(/[^a-z0-9\s,-]/g, " ")

    .replace(/\s+/g, " ")

    .trim();

}



function getArticleEmirate(article) {

  const text = normalizeText(article.location);



  if (text) {

    // Check the last part first ("..., Dubai") because the AI

    // prompt writes the emirate after the specific place.

    const parts = text.split(",").map((part) => part.trim()).reverse();



    for (const part of parts) {

      for (const [emirate, keywords] of Object.entries(emirateKeywords)) {

        if (

          keywords.some((keyword) =>

            new RegExp(`(^|[\\s-])${keyword}($|[\\s-])`).test(part)

          )

        ) {

          return emirate;

        }

      }

    }

  }



  if (!hasUsableCoordinates(article)) return null;



  // Fallback: nearest emirate centre.

  const lat = Number(article.latitude);

  const lng = Number(article.longitude);

  let nearest = null;

  let nearestDistance = Infinity;



  for (const [emirate, center] of Object.entries(emirates)) {

    if (emirate === "All") continue;



    const distance =

      (center.lat - lat) ** 2 + (center.lng - lng) ** 2;



    if (distance < nearestDistance) {

      nearestDistance = distance;

      nearest = emirate;

    }

  }



  return nearest;

}



function normalizeHeadline(title) {

  return String(title || "")

    .toLowerCase()

    .normalize("NFKC")

    .replace(/[^\p{L}\p{N}\s]/gu, " ")

    .replace(/\s+/g, " ")

    .trim();

}



function matchesFilters(

  article,

  searchQuery,

  selectedCategory,

  selectedLocation,

  selectedDate

) {

  const query = searchQuery.toLowerCase().trim();



  const searchableText = [

    article.title,

    article.category,

    article.location,

    article.content,

  ]

    .filter(Boolean)

    .join(" ")

    .toLowerCase();



  const searchMatches =

    !query || searchableText.includes(query);



  const categoryMatches =

    selectedCategory === "All" ||

    article.category === selectedCategory;



  const locationMatches =

    selectedLocation === "All" ||

    (hasUsableCoordinates(article) &&

      getArticleEmirate(article) === selectedLocation);



  let dateMatches = true;



  if (selectedDate !== "All") {

    const dateValue =

      article.published_datetime || article.publishedAt;



    const published = dateValue

      ? new Date(dateValue)

      : null;



    if (published === null || Number.isNaN(published.getTime())) {

      dateMatches = false;

    } else if (selectedDate === "today") {

      // Published on today's date

      dateMatches =

        published.toDateString() === new Date().toDateString();

    } else {

      const days = Number(selectedDate);



      const cutoff = new Date();

      cutoff.setHours(0, 0, 0, 0);

      cutoff.setDate(cutoff.getDate() - days);



      dateMatches = published >= cutoff;

    }

  }



  return (

    searchMatches &&

    categoryMatches &&

    locationMatches &&

    dateMatches

  );

}



// ======================================

// ARTICLE REPORTING AND ADMIN MODERATION (Aqsa)

// ======================================

// Signed-in users can report an article with a reason.

// Admins can review the reports, dismiss them, or hide the

// reported article from the map and news list.



function AdminReports({ reports, token, onResolved }) {

  const [busyReport, setBusyReport] = useState(null)

  const [error, setError] = useState('')



  async function resolve(report, action) {

    if (busyReport !== null) return

    if (action === 'hide' && !window.confirm('Hide this article from the public news view?')) return



    setBusyReport(report.report_id)

    setError('')

    try {

      const response = await fetch(

        `${API_URL}/admin/reports/` + report.report_id + '/' + action,

        { method: 'POST', headers: { Authorization: 'Bearer ' + token } }

      )

      const result = await response.json()

      if (!response.ok) {

        throw new Error(typeof result.detail === 'string' ? result.detail : 'Could not update the report.')

      }

      onResolved(report, result.status)

    } catch (error) {

      setError(error.message || 'Could not update the report.')

    } finally {

      setBusyReport(null)

    }

  }



  return (

    <section className="admin-reports">

      {error && <p className="admin-reports-error" role="alert">{error}</p>}

      {!reports.length && <p className="admin-reports-empty">No reports yet.</p>}

      {reports.map(report => (

        <article className="admin-report-card" key={report.report_id}>

          <div className="admin-report-top">

            <h3>{report.title}</h3>

            <span className={`admin-report-status ${report.status}`}>

              {report.status.replaceAll('_', ' ')}

            </span>

          </div>

          <p className="admin-report-reason">{report.reason}</p>

          <p className="admin-report-meta" role="status">

            Report #{report.report_id} · Article #{report.article_id}

            {report.created_at && ` · ${formatDate(report.created_at)}`}

          </p>

          {report.status === 'pending' && (

            <div className="admin-report-actions">

              <button className="admin-dismiss-button" type="button" disabled={busyReport !== null} onClick={() => resolve(report, 'dismiss')}>Dismiss</button>

              <button className="admin-hide-button" type="button" disabled={busyReport !== null} onClick={() => resolve(report, 'hide')}>Hide article</button>

            </div>

          )}

        </article>

      ))}

    </section>

  )

}



function ReportArticleForm({ articleId, token, onLogin }) {

  const [isOpen, setIsOpen] = useState(false)

  const [reason, setReason] = useState('')

  const [status, setStatus] = useState('idle')

  const [error, setError] = useState('')



  async function submitReport(event) {

    event.preventDefault()

    const trimmedReason = reason.trim()

    if (!trimmedReason || status === 'sending') return



    setStatus('sending')

    setError('')



    try {

      const response = await fetch(

        `${API_URL}/articles/${articleId}/reports`,

        {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json',

            Authorization: `Bearer ${token}`

          },

          body: JSON.stringify({ reason: trimmedReason })

        }

      )



      if (response.status === 401) {

        setError('Your session expired. Sign in again to submit a report.')

        setStatus('expired')

        return

      }



      if (!response.ok) {

        setError('Could not submit the report. Please try again.')

        setStatus('idle')

        return

      }



      setStatus('submitted')

    } catch {

      setError('Could not reach the server. Check that FastAPI is running.')

      setStatus('idle')

    }

  }



  return (

    <div className="report-article">

      {status === 'submitted' ? (

        <p className="report-article-done" role="status">Report submitted for review.</p>

      ) : !token || status === 'expired' ? (

        <>

          {error && <p className="report-article-error" role="alert">{error}</p>}

          <button className="report-article-link" type="button" onClick={onLogin}>Sign in to report</button>

        </>

      ) : !isOpen ? (

        <button className="report-article-link" type="button" onClick={() => setIsOpen(true)}>

          ⚑ Report article

        </button>

      ) : (

        <form className="report-article-form" onSubmit={submitReport}>

          <label>

            Why are you reporting this article?

            <textarea

              value={reason}

              onChange={event => setReason(event.target.value)}

              maxLength={500}

              rows={3}

              required

              disabled={status === 'sending'}

            />

          </label>

          {error && <p className="report-article-error" role="alert">{error}</p>}

          <div className="report-article-buttons">

            <button

              type="button"

              className="report-article-cancel"

              onClick={() => setIsOpen(false)}

              disabled={status === 'sending'}

            >

              Cancel

            </button>

            <button

              type="submit"

              className="report-article-submit"

              disabled={status === 'sending' || !reason.trim()}

            >

              {status === 'sending' ? 'Submitting…' : 'Submit report'}

            </button>

          </div>

        </form>

      )}

    </div>

  )

}



function App() {

  // Page navigation

  // Pages: home, map, analytics, about, login, register, profile

  const [currentPage, setCurrentPage] = useState("home");



  // Loading screen shown when moving between pages

  // (not when the website is first opened)

  // When the browser page is reloaded, show a short (half a second)

  // loading screen. Opening the website for the first time shows none.

  const [isPageLoading, setIsPageLoading] = useState(() => {

    const navigation = performance.getEntriesByType?.("navigation")?.[0];

    return navigation?.type === "reload";

  });



  // Full loading screen between sections, short one (0.5 s) after

  // entering credentials (login, sign up, log out) and on reload.

  const [quickLoader, setQuickLoader] = useState(true);



  // Analytics keeps the loading screen until its data has loaded.

  const [analyticsLoading, setAnalyticsLoading] = useState(false);



  const finishPageLoading = useCallback(() => {

    setIsPageLoading(false);

  }, []);



  // Logged-in user (frontend demo until the database connection is added)

  const [user, setUser] = useState(null);



  // Login token (from FastAPI) and the admin report list (Aqsa).

  // The Admin Reports page only appears when /admin/reports

  // accepts the signed-in account, i.e. the account is an admin.

  const token = user?.access_token

  const [adminReview, setAdminReview] = useState(null)

  const adminReports = token && adminReview?.token === token ? adminReview.reports : null



  useEffect(() => {

    if (!token) {

      setAdminReview(null)

      return

    }



    const controller = new AbortController()

    async function loadAdminReports() {

      try {

        const response = await fetch(`${API_URL}/admin/reports`, {

          headers: { Authorization: 'Bearer ' + token },

          cache: 'no-store',

          signal: controller.signal

        })

        if (!response.ok) return

        const reports = await response.json()

        if (!controller.signal.aborted && Array.isArray(reports)) {

          setAdminReview({ token, reports })

        }

      } catch (error) {

        if (!controller.signal.aborted) console.error('Could not check admin reports:', error)

      }

    }

    loadAdminReports()

    return () => controller.abort()

  }, [token])



  // News drawer

  const [newsPanelOpen, setNewsPanelOpen] = useState(true);

  const [showAllHeadlines, setShowAllHeadlines] = useState(false);



  // All stored articles (map markers are derived from this list,

  // so markers and headlines always share the same fields,

  // including published_datetime for the date filter).

  const [headlines, setHeadlines] = useState([]);



  // REFRESH: NEW ARTICLES WAITING

  // The site checks every minute how many articles are saved.

  // When the pipeline has saved new ones, the Refresh button shows

  // how many are waiting. After Refresh, the new articles get a

  // "NEW" badge in Latest News.

  const [savedArticleCount, setSavedArticleCount] = useState(null);

  const [newArticleIds, setNewArticleIds] = useState(new Set());

  const loadedArticleIds = useRef(null);



  // Loading and messages

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");

  const [loadError, setLoadError] = useState("");



  // Search and filters

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [selectedLocation, setSelectedLocation] = useState("All");

  const [selectedDate, setSelectedDate] = useState("All");



  // News near me

  // The user's location is only kept in the browser while the page

  // is open. It is never sent to the backend or stored.

  const [userLocation, setUserLocation] = useState(null);

  const [nearbyRadius, setNearbyRadius] = useState("All");

  const [locationMessage, setLocationMessage] = useState("");

  const [isLocating, setIsLocating] = useState(false);



  // Map

  const [selectedArticle, setSelectedArticle] = useState(null);



  // AI summaries for the map popup, saved by article id so the

  // same article is only summarised once while the page is open.

  const [summaries, setSummaries] = useState({});

  const [summaryLoadingId, setSummaryLoadingId] = useState(null);



  const [mapType, setMapType] = useState("roadmap");

  // Load Google Maps once for the whole app. LoadScript was removed

  // and added again every time the user left the map page, which

  // could leave the map stuck loading.

  const { isLoaded: mapsReady, loadError: mapsLoadError } =

    useJsApiLoader({

      id: "newscape-google-maps",

      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,

      language: "en",

      region: "AE",

    });

  const mapRef = useRef(null);



  // Move the camera in ONE step (center + zoom together).

  // Previously center and zoom were applied separately: at zoom 7

  // the UAE restriction box snapped the new center back to the

  // middle of the box (in the sea) before the zoom was applied.

  const focusMap = useCallback((center, zoom) => {

    const map = mapRef.current;

    if (!map || !center) return;



    if (typeof map.moveCamera === "function") {

      map.moveCamera({ center, zoom });

    } else {

      map.setZoom(zoom);

      map.panTo(center);

    }

  }, []);



  // Created once, after Google Maps has loaded. Re-creating this

  // object on every render made the map re-apply its options.

  const mapOptions = useMemo(() => {

    const controlPosition = window.google?.maps?.ControlPosition;



    return {

      zoomControl: true,

      zoomControlOptions: {

        position: controlPosition?.LEFT_BOTTOM,

      },

      streetViewControl: false,

      mapTypeControl: false,

      fullscreenControl: true,

      fullscreenControlOptions: {

        position: controlPosition?.LEFT_TOP,

      },

      restriction: {

        latLngBounds: {

          north: 27,

          south: 22,

          east: 57,

          west: 51,

        },

        strictBounds: false,

      },

    };

  }, [mapsReady]);



  // Fetch map articles and all headlines separately

  const fetchArticles = async (refresh = false) => {

    if (refresh) {

      setIsRefreshing(true);

    } else {

      setIsLoading(true);

    }



    setLoadError("");



    try {

      const headlinesResponse = await fetch(

        `${API_URL}/headlines`,

        { cache: "no-store" }

      );



      if (!headlinesResponse.ok) {

        throw new Error("Unable to retrieve news articles");

      }



      const headlinesData = await headlinesResponse.json();



      if (!Array.isArray(headlinesData)) {

        throw new Error("Invalid article data");

      }



      // Newest first by publish date (not by id: TiDB does not

      // always give new rows a bigger id than older rows).

      const sortedHeadlines = [...headlinesData].sort(

        (a, b) =>

          new Date(b.published_datetime || 0) -

          new Date(a.published_datetime || 0)

      );



      // Mark the articles that were not there before this Refresh.

      if (refresh && loadedArticleIds.current) {

        setNewArticleIds(

          new Set(

            sortedHeadlines

              .map((article) => article.id)

              .filter((id) => !loadedArticleIds.current.has(id))

          )

        );

      }



      loadedArticleIds.current = new Set(

        sortedHeadlines.map((article) => article.id)

      );



      setHeadlines(sortedHeadlines);

      setSavedArticleCount(sortedHeadlines.length);

      setSelectedArticle(null);



      setStatusMessage("");

    } catch (error) {

      console.error("Error loading articles:", error);



      setLoadError(

        "Unable to load news. Please check the FastAPI endpoints."

      );



      setStatusMessage("");

    } finally {

      setIsLoading(false);

      setIsRefreshing(false);

    }

  };



  useEffect(() => {

    fetchArticles();

  }, []);



  // Check every minute whether new articles have been saved.

  // Only a number is requested, so this is very light.

  useEffect(() => {

    const checkForNewArticles = () => {

      fetch(`${API_URL}/news-status`, { cache: "no-store" })

        .then((response) => (response.ok ? response.json() : null))

        .then((data) => {

          if (data && typeof data.total_articles === "number") {

            setSavedArticleCount(data.total_articles);

          }

        })

        .catch(() => {});

    };



    const timer = setInterval(checkForNewArticles, 60000);

    return () => clearInterval(timer);

  }, []);





  // Automatically update news images from the backend cache.

  useEffect(() => {

    const updateNewsImages = async () => {

      try {

        const response = await fetch(

          `${API_URL}/headlines`,

          { cache: "no-store" }

        );



        if (!response.ok) return;



        const latestNews = await response.json();

        if (!Array.isArray(latestNews)) return;



        const imagesById = new Map(

          latestNews.map((article) => [

            article.id,

            article.image_url || null

          ])

        );



        setHeadlines((currentNews) => {

          let changed = false;



          const updatedNews = currentNews.map((article) => {

            if (!imagesById.has(article.id)) return article;



            const imageUrl = imagesById.get(article.id);



            if ((article.image_url || null) === imageUrl) {

              return article;

            }



            changed = true;

            return { ...article, image_url: imageUrl };

          });



          return changed ? updatedNews : currentNews;

        });

      } catch (error) {

        console.error("Unable to refresh news images:", error);

      }

    };



    const timer = setInterval(updateNewsImages, 60000);



    return () => clearInterval(timer);

  }, []);





  // Number of saved articles that are not shown yet.

  const waitingArticleCount =

    savedArticleCount !== null

      ? Math.max(0, savedArticleCount - headlines.length)

      : 0;



  // ARTICLE SUMMARY

  // When a map marker is opened, ask the backend for a short

  // AI summary of the full article (Groq).

  useEffect(() => {

    if (!selectedArticle) return;



    const articleId = selectedArticle.id;



    if (summaries[articleId]) return;



    setSummaryLoadingId(articleId);



    fetch(`${API_URL}/summary`, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        title: selectedArticle.title || "",

        content: selectedArticle.content || "",

        url: selectedArticle.url || "",

      }),

    })

      .then((response) => {

        if (!response.ok) {

          throw new Error("Unable to summarise article");

        }

        return response.json();

      })

      .then((data) => {

        setSummaries((previous) => ({

          ...previous,

          [articleId]: data.summary || "",

        }));

      })

      .catch((error) => {

        console.error("Error loading summary:", error);



        // Fall back to the stored description.

        setSummaries((previous) => ({

          ...previous,

          [articleId]: "",

        }));

      })

      .finally(() => {

        setSummaryLoadingId((current) =>

          current === articleId ? null : current

        );

      });

  }, [selectedArticle]);



  // Date availability across all stored articles

  const hasDates = headlines.some(

    (article) =>

      article.published_datetime || article.publishedAt

  );



  // Deduplicate headlines by normalized title.

  // Preserve the first article returned by the backend.

  const seenHeadlines = new Set();



  const uniqueHeadlines = headlines.filter((article) => {

    const normalizedTitle = normalizeHeadline(

      article.title

    );



    if (

      !normalizedTitle ||

      seenHeadlines.has(normalizedTitle)

    ) {

      return false;

    }



    seenHeadlines.add(normalizedTitle);

    return true;

  });



  // NEWS NEAR ME FILTER

  // Adds distance_km to located articles. When a radius is chosen,

  // only articles within that distance are kept, nearest first.

  function filterByUserLocation(articles) {

    if (!userLocation) return articles;



    const withDistance = articles.map((article) => {

      if (!hasUsableCoordinates(article)) return article;



      return {

        ...article,

        distance_km: distanceKm(

          userLocation.lat,

          userLocation.lng,

          Number(article.latitude),

          Number(article.longitude)

        ),

      };

    });



    if (nearbyRadius === "All") return withDistance;



    return withDistance

      .filter(

        (article) =>

          article.distance_km !== undefined &&

          article.distance_km <= Number(nearbyRadius)

      )

      .sort((a, b) => a.distance_km - b.distance_km);

  }



  // Headlines include non-geotaggable news.

  const filteredHeadlines = uniqueHeadlines.filter(

    (article) =>

      matchesFilters(

        article,

        searchQuery,

        selectedCategory,

        selectedLocation,

        selectedDate

      )

  );



  // Add the distance from the user to every located article.

  const headlinesWithDistance = filterByUserLocation(

    filteredHeadlines

  );



  // Map markers: the same filtered list, but only articles with

  // real UAE coordinates (-1/-1 and -2/-2 are excluded here).

  const filteredArticles = headlinesWithDistance.filter(

    hasUsableCoordinates

  );



  // Pins at the same spot are spread out so each one can be clicked.

  const mapPins = spreadOverlappingPins(filteredArticles);



  // Reset filters

  const resetFilters = () => {

    setSearchQuery("");

    setSelectedCategory("All");

    setSelectedLocation("All");

    setSelectedDate("All");

    setNearbyRadius("All");

    setSelectedArticle(null);

    focusMap(uaeCenter, 7);

  };



  // Ask the browser for the user's location.

  const findMyLocation = () => {

    if (!navigator.geolocation) {

      setLocationMessage(

        "Your browser does not support location. Use the city filter instead."

      );

      return;

    }



    setIsLocating(true);

    setLocationMessage("");



    navigator.geolocation.getCurrentPosition(

      (position) => {

        const location = {

          lat: position.coords.latitude,

          lng: position.coords.longitude,

        };



        setIsLocating(false);



        if (!isInsideUae(location)) {

          setUserLocation(null);

          setNearbyRadius("All");

          setLocationMessage(

            "You appear to be outside the UAE, so nearby news is not available."

          );

          return;

        }



        setUserLocation(location);



        // Start with news within 10 km.

        if (nearbyRadius === "All") {

          setNearbyRadius("10");

        }



        setSelectedLocation("All");

        setSelectedArticle(null);

        focusMap(location, 12);

      },

      (error) => {

        setIsLocating(false);



        if (error.code === error.PERMISSION_DENIED) {

          setLocationMessage(

            "Location permission was denied. Use the city filter instead."

          );

        } else {

          setLocationMessage(

            "Your location could not be found. Please try again."

          );

        }

      },

      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }

    );

  };



  // Turn off nearby news and remove the user's location.

  const clearMyLocation = () => {

    setUserLocation(null);

    setNearbyRadius("All");

    setLocationMessage("");

    focusMap(uaeCenter, 7);

  };



  // Change selected city

  const handleLocationChange = (event) => {

    const location = event.target.value;



    setSelectedLocation(location);

    setSelectedArticle(null);

    focusMap(

      emirates[location] || uaeCenter,

      location === "All" ? 7 : 10

    );

  };



  // Every headline opens the original article in a new tab.

  // Geotagged articles also move the map to their pin, so the

  // location is shown when the user comes back to NewScape.

  const openArticle = (article) => {

    if (hasUsableCoordinates(article)) {

      focusMap(

        {

          lat: Number(article.latitude),

          lng: Number(article.longitude),

        },

        11

      );

    }



    if (hasArticleLink(article)) {

      window.open(

        article.url,

        "_blank",

        "noopener,noreferrer"

      );

    } else {

      setStatusMessage(

        "The original link for this article is not available."

      );

    }

  };



  // Switch pages (the loading screen covers the change)

  const goToPage = (page) => {

    // No loading screen when going to the Home page.

    if (page !== currentPage && page !== "home") {

      const accountPages = ["login", "register", "profile"];



      setQuickLoader(

        accountPages.includes(currentPage) &&

          accountPages.includes(page)

      );



      // Analytics: the loading screen starts now and stays until

      // the analytics data has loaded.

      if (page === "analytics") {

        setAnalyticsLoading(true);

      }



      setIsPageLoading(true);

    }



    setCurrentPage(page);

    setSelectedArticle(null);

    window.scrollTo(0, 0);

  };



  // Every page is shown together with the loading screen on top.

  return (

    <>

      {renderPage()}



      {isPageLoading && (

        <PageLoader

          onFinish={finishPageLoading}

          quick={quickLoader}

          waiting={currentPage === "analytics" && analyticsLoading}

        />

      )}

    </>

  );



  function renderPage() {

  // Home and About are full-screen pages with their own navigation.

  if (currentPage === "home") {

    return <HomePage setPage={goToPage} />;

  }



  if (currentPage === "about") {

    return (

      <AboutPage

        setPage={goToPage}

        user={user}

        isAdmin={Boolean(adminReports)}

      />

    );

  }



  // ADMIN REPORTS (Aqsa) — only for admin accounts.

  if (currentPage === "admin") {

    return (

      <div className="insights-page insights-admin">

        <InsightsNav

          setPage={goToPage}

          active="admin"

          user={user}

          isAdmin={Boolean(adminReports)}

        />



        <main className="insights-admin-content">

          <span className="insights-label">ADMIN</span>

          <h1>Article Reports</h1>

          <p className="insights-admin-intro">

            Review articles reported by users. Dismiss a report to keep

            the article, or hide the article from the map and news list.

          </p>



          {adminReports ? (

            <AdminReports

              key={token}

              token={token}

              reports={adminReports}

              onResolved={(report, status) => {

                setAdminReview(current => current?.token === token ? {

                  ...current,

                  reports: current.reports.map(item =>

                    item.report_id === report.report_id ? { ...item, status } : item

                  )

                } : current)

                if (status === 'article_hidden') fetchArticles(true)

              }}

            />

          ) : (

            <p className="admin-reports-empty">

              Admin access required. Log in with an admin account.

            </p>

          )}

        </main>

      </div>

    );

  }



  // Analytics uses the same design as the About page.

  if (currentPage === "analytics") {

    return (

      <div className="insights-page insights-analytics">

        <InsightsNav

          setPage={goToPage}

          active="analytics"

          user={user}

          isAdmin={Boolean(adminReports)}

        />



        <main className="insights-analytics-content">

          <AnalyticsDashboard onLoadingChange={setAnalyticsLoading} />

        </main>

      </div>

    );

  }



  // Register, Login, Profile and Logout use the same design too.

  if (

    currentPage === "login" ||

    currentPage === "register" ||

    currentPage === "profile"

  ) {

    return (

      <div className="insights-page insights-auth">

        <InsightsNav

          setPage={goToPage}

          active="account"

          user={user}

          isAdmin={Boolean(adminReports)}

        />



        <main className="insights-auth-content">

          <div className="insights-auth-intro">

            <span className="insights-label">

              {currentPage === "register"

                ? "JOIN NEWSCAPE"

                : currentPage === "profile"

                ? "YOUR ACCOUNT"

                : "WELCOME BACK"}

            </span>



            <h1>

              {currentPage === "register"

                ? "Follow the news that matters to you."

                : currentPage === "profile"

                ? "Your NewScape profile."

                : "Pick up where you left off."}

            </h1>



            <p>

              Signed-in users can report articles that are wrong or

              inappropriate so an admin can review them.

            </p>

          </div>



          <UserPages

            page={currentPage}

            setPage={goToPage}

            user={user}

            setUser={setUser}

          />

        </main>

      </div>

    );

  }



  return (

    <div className="app insights-map">

      {/* NAVIGATION BAR — same header as the About and Analytics pages */}

      <InsightsNav

        setPage={goToPage}

        active="map"

        user={user}

        isAdmin={Boolean(adminReports)}

      />



      {currentPage === "map" ? (

        <main

          id="home"

          className="home-page newscape-map-page"

        >

          {/* GOOGLE MAP */}

          <div className="newscape-map-background">

            {mapsReady ? (

              <GoogleMap

                mapContainerStyle={mapContainerStyle}

                center={uaeCenter}

                zoom={7}

                mapTypeId={mapType}

                onLoad={(map) => {

                  mapRef.current = map;

                  // Re-apply the current emirate after returning

                  // from the Analytics page.

                  focusMap(

                    emirates[selectedLocation] || uaeCenter,

                    selectedLocation === "All" ? 7 : 10

                  );

                }}

                onUnmount={() => {

                  mapRef.current = null;

                }}

                options={mapOptions}

              >

                {/* COLORED NEWS PINS */}

                {mapPins.map((article) => (

                  <Marker

                    key={article.id}

                    position={{

                      lat: article.map_lat,

                      lng: article.map_lng,

                    }}

                    icon={createPinIcon(

                      article.category

                    )}

                    onClick={() =>

                      setSelectedArticle(article)

                    }

                  />

                ))}



                {/* USER LOCATION (NEWS NEAR ME) */}

                {userLocation && (

                  <Marker

                    position={userLocation}

                    title="Your location"

                    zIndex={1000}

                    icon={{

                      path: window.google.maps.SymbolPath.CIRCLE,

                      scale: 9,

                      fillColor: "#2563eb",

                      fillOpacity: 1,

                      strokeColor: "#ffffff",

                      strokeWeight: 3,

                    }}

                  />

                )}



                {userLocation && nearbyRadius !== "All" && (

                  <CircleF

                    key={nearbyRadius}

                    center={userLocation}

                    radius={Number(nearbyRadius) * 1000}

                    options={{

                      fillColor: "#2563eb",

                      fillOpacity: 0.08,

                      strokeColor: "#2563eb",

                      strokeOpacity: 0.6,

                      strokeWeight: 2,

                      clickable: false,

                    }}

                  />

                )}



                {/* NEWS POPUP */}

                {selectedArticle &&

                  hasUsableCoordinates(selectedArticle) && (

                    <InfoWindow

                      position={{

                        lat:

                          selectedArticle.map_lat ??

                          Number(selectedArticle.latitude),

                        lng:

                          selectedArticle.map_lng ??

                          Number(selectedArticle.longitude),

                      }}

                      options={{ headerDisabled: true }}

                      onCloseClick={() =>

                        setSelectedArticle(null)

                      }

                    >

                      <div className="news-popup">

                        {/* CLOSE BUTTON */}

                        <button

                          type="button"

                          className="popup-close-button"

                          onClick={() =>

                            setSelectedArticle(null)

                          }

                          aria-label="Close article"

                        >

                          <svg

                            width="10"

                            height="10"

                            viewBox="0 0 12 12"

                            aria-hidden="true"

                          >

                            <path

                              d="M1 1L11 11M11 1L1 11"

                              stroke="currentColor"

                              strokeWidth="1.8"

                              strokeLinecap="round"

                            />

                          </svg>

                        </button>



                        <h3>

                          {selectedArticle.title}

                        </h3>



                        <span className="popup-category">

                          {selectedArticle.category}

                        </span>



                        <p>

                          📍{" "}

                          {selectedArticle.location ||

                            "UAE"}

                        </p>



                        {userLocation && (

                          <p className="news-distance">

                            🧭{" "}

                            {formatDistance(

                              distanceKm(

                                userLocation.lat,

                                userLocation.lng,

                                Number(selectedArticle.latitude),

                                Number(selectedArticle.longitude)

                              )

                            )}

                          </p>

                        )}



                        {/* AI SUMMARY */}

                        <div className="popup-summary">

                          <span className="popup-summary-label">

                            ✦ AI summary

                          </span>



                          {summaryLoadingId === selectedArticle.id ? (

                            <p className="popup-summary-loading">

                              Summarising the article...

                            </p>

                          ) : (

                            <p>

                              {summaries[selectedArticle.id] ||

                                selectedArticle.content ||

                                "No article details available."}

                            </p>

                          )}

                        </div>



                        {hasArticleLink(selectedArticle) && (

                            <a

                              href={selectedArticle.url}

                              target="_blank"

                              rel="noopener noreferrer"

                            >

                              Read Full Article →

                            </a>

                          )}



                        {/* REPORT ARTICLE (Aqsa) */}

                        <ReportArticleForm

                          key={selectedArticle.id}

                          articleId={selectedArticle.id}

                          token={user?.access_token}

                          onLogin={() => goToPage("login")}

                        />

                      </div>

                    </InfoWindow>

                  )}

              </GoogleMap>

            ) : (

              <p className="status-text" role="status">

                {mapsLoadError

                  ? "Google Maps could not be loaded. Check the Google Maps API key."

                  : "Loading map..."}

              </p>

            )}

          </div>



          {/* SEARCH AND FILTERS */}

          <div className="newscape-map-toolbar">

            {/* Row 1: search, reset and refresh */}

            <div className="toolbar-top">

              <div className="search-bar">

                <span

                  className="search-icon"

                  aria-hidden="true"

                >

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



              <button

                type="button"

                className="reset-button"

                onClick={resetFilters}

              >

                Reset

              </button>



              <button

                type="button"

                className={`refresh-button ${

                  waitingArticleCount > 0 ? "has-new" : ""

                }`}

                onClick={() =>

                  fetchArticles(true)

                }

                disabled={

                  isRefreshing || isLoading

                }

                title={

                  waitingArticleCount > 0

                    ? `${waitingArticleCount} new articles have been saved`

                    : "Reload the saved news"

                }

              >

                {isRefreshing

                  ? "Refreshing..."

                  : waitingArticleCount > 0

                  ? `↻ Refresh · ${waitingArticleCount} new`

                  : "↻ Refresh"}

              </button>

            </div>



            {/* Row 2: filters */}

            <div className="filters">

              {/* CATEGORY */}

              <div className="filter-group">

                <span aria-hidden="true">▤</span>



                <select

                  value={selectedCategory}

                  aria-label="Filter by category"

                  onChange={(event) => {

                    setSelectedCategory(

                      event.target.value

                    );

                    setSelectedArticle(null);

                  }}

                >

                  <option value="All">

                    All Categories

                  </option>



                  {categories.map((category) => (

                    <option

                      key={category}

                      value={category}

                    >

                      {category}

                    </option>

                  ))}

                </select>

              </div>



              {/* CITY */}

              <div className="filter-group">

                <span aria-hidden="true">♧</span>



                <select

                  value={selectedLocation}

                  onChange={handleLocationChange}

                  aria-label="Filter by city"

                >

                  <option value="All">

                    All Cities

                  </option>



                  {Object.keys(emirates)

                    .filter(

                      (location) =>

                        location !== "All"

                    )

                    .map((location) => (

                      <option

                        key={location}

                        value={location}

                      >

                        {location.replace(

                          ", UAE",

                          ""

                        )}

                      </option>

                    ))}

                </select>

              </div>



              {/* DATE */}

              <div className="filter-group">

                <span aria-hidden="true">▦</span>



                <select

                  value={selectedDate}

                  onChange={(event) =>

                    setSelectedDate(

                      event.target.value

                    )

                  }

                  disabled={!hasDates}

                  aria-label="Filter by date"

                >

                  <option value="All">

                    All Dates

                  </option>



                  <option value="today">

                    Today

                  </option>



                  <option value="7">

                    Last 7 Days

                  </option>



                  <option value="30">

                    Last 30 Days

                  </option>

                </select>

              </div>



              {/* NEWS NEAR ME: the distance filter only appears

                  after the user's location is turned on */}

              {userLocation && (

                <div className="filter-group">

                  <span aria-hidden="true">🧭</span>



                  <select

                    value={nearbyRadius}

                    onChange={(event) =>

                      setNearbyRadius(event.target.value)

                    }

                    aria-label="Show news near my location"

                    title="Distance from your location"

                  >

                    <option value="All">All Distances</option>

                    <option value="5">Within 5 km</option>

                    <option value="10">Within 10 km</option>

                    <option value="25">Within 25 km</option>

                    <option value="50">Within 50 km</option>

                  </select>

                </div>

              )}



              <button

                type="button"

                className={`near-me-button ${

                  userLocation ? "active" : ""

                }`}

                onClick={

                  userLocation ? clearMyLocation : findMyLocation

                }

                disabled={isLocating}

              >

                {isLocating

                  ? "Locating..."

                  : userLocation

                  ? "✕ My location"

                  : "📍 Near me"}

              </button>

            </div>



            {locationMessage && (

              <p

                className="status-text"

                role="status"

              >

                {locationMessage}

              </p>

            )}



            {isLoading && (

              <p

                className="status-text"

                role="status"

              >

                Loading news...

              </p>

            )}



            {statusMessage && (

              <p

                className="status-text"

                role="status"

              >

                {statusMessage}

              </p>

            )}



            {loadError && (

              <p

                className="error-text"

                role="alert"

              >

                {loadError}

              </p>

            )}

          </div>



          {/* COLLAPSIBLE NEWS DRAWER */}

          <aside

            className={`latest-news-panel newscape-floating-news ${

              newsPanelOpen

                ? "news-panel-open"

                : "news-panel-closed"

            }`}

            aria-hidden={!newsPanelOpen}

            inert={!newsPanelOpen}

          >

            <div className="latest-news-header">

              <h3>

                {showAllHeadlines ? "All Headlines" : "Latest News"}

              </h3>



              <button

                type="button"

                onClick={() =>

                  setShowAllHeadlines((previous) => !previous)

                }

              >

                {showAllHeadlines ? "Back to Latest" : "View All"}

              </button>

            </div>





            <div className="latest-news-list">

              {headlinesWithDistance.length === 0 &&

                !isLoading &&

                !loadError && (

                  <p className="no-news">

                    {userLocation && nearbyRadius !== "All"

                      ? `No articles found within ${nearbyRadius} km of your location.`

                      : "No articles found for the selected filters."}

                  </p>

                )}





{(showAllHeadlines

  ? headlinesWithDistance

  : headlinesWithDistance.slice(0, 5)

).map((article) => {

  const canShowOnMap = hasUsableCoordinates(article);

  const categoryColor =

    categoryColors[article.category] || categoryColors.Other;



  return (

    <div className="news-card" key={article.id}>

      <div className="news-card-media">
      <div
        className="news-thumbnail"
        style={{
          backgroundImage: article.image_url
            ? `url("${article.image_url}")`
            : undefined,
        }}
      >
        {!article.image_url && <span>📰</span>}
      </div>

      <ReportArticleForm
        key={article.id}
        articleId={article.id}
        token={user?.access_token}
        onLogin={() => goToPage("login")}
      />
    </div>

    <div className="news-card-content">

        <button

          type="button"

          className="news-headline-button"

          onClick={() => openArticle(article)}

        >

          {article.title}

        </button>



        <div className="news-badges">

          <span

            className="category-badge"

            style={{

              color: categoryColor,

              backgroundColor: `${categoryColor}16`,

              borderColor: `${categoryColor}55`,

            }}

          >

            {article.category || "Other"}

          </span>



          {newArticleIds.has(article.id) && (

            <span className="new-badge">NEW</span>

          )}

        </div>



        <div className="news-card-meta">

          <p className="news-location-line">

            {canShowOnMap ? (

              <>

                <svg

                  viewBox="0 0 24 24"

                  fill="none"

                  stroke="currentColor"

                  strokeWidth="2"

                  aria-hidden="true"

                >

                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />

                  <circle cx="12" cy="10" r="2.5" />

                </svg>

                <span>{article.location || "UAE"}</span>

              </>

            ) : (

              <>

                <NoLocationIcon />

                <span>Location not identified</span>

              </>

            )}

          </p>



          {(article.published_datetime ||

            article.publishedAt) && (

            <p className="news-date-line">

              <svg

                viewBox="0 0 24 24"

                fill="none"

                stroke="currentColor"

                strokeWidth="2"

                aria-hidden="true"

              >

                <rect x="3" y="5" width="18" height="16" rx="2" />

                <path d="M7 3v4M17 3v4M3 10h18" />

              </svg>

              <span>

                {formatDate(

                  article.published_datetime ||

                    article.publishedAt

                )}

              </span>

            </p>

          )}



          {article.distance_km !== undefined && (

            <p className="news-distance">

              {formatDistance(article.distance_km)} away

            </p>

          )}

        </div>



        {canShowOnMap && (
        <button

          type="button"

          className="news-show-map-button"

          onClick={() => {

            focusMap(

              {

                lat: Number(article.latitude),

                lng: Number(article.longitude),

              },

              11

            );

            setSelectedArticle(article);

          }}

        >

          <svg

            viewBox="0 0 24 24"

            fill="none"

            stroke="currentColor"

            strokeWidth="2"

            aria-hidden="true"

          >

            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />

            <circle cx="12" cy="10" r="2.5" />

          </svg>

          Show on Map

        </button>
        )}



  

      </div>

    </div>

  );

})}



            </div>



            <div className="news-count">

              Showing{" "}

              {headlinesWithDistance.length} articles

            </div>

          </aside>



          {/* NEWS DRAWER TOGGLE */}

          <button

            type="button"

            className={`news-drawer-toggle ${

              newsPanelOpen

                ? "drawer-open"

                : "drawer-closed"

            }`}

            onClick={() =>

              setNewsPanelOpen(

                (open) => !open

              )

            }

            aria-label={

              newsPanelOpen

                ? "Hide latest news"

                : "Show latest news"

            }

            aria-expanded={newsPanelOpen}

          >

            <span>

              {newsPanelOpen ? "›" : "‹"}

            </span>



            {!newsPanelOpen && (

              <span>Latest News</span>

            )}

          </button>



          {/* MAP / SATELLITE BUTTONS */}

          <div



            className={`map-type-control newscape-floating-map-type ${

              newsPanelOpen ? "news-visible" : "news-hidden"

            }`}

          >

            <button

              type="button"

              className={

                mapType === "roadmap"

                  ? "selected"

                  : ""

              }

              onClick={() =>

                setMapType("roadmap")

              }

            >

              Map

            </button>



            <button

              type="button"

              className={

                mapType === "hybrid"

                  ? "selected"

                  : ""

              }

              onClick={() =>

                setMapType("hybrid")

              }

            >

              Satellite

            </button>

          </div>



          {/* CATEGORY LEGEND */}

          <div className="map-legend newscape-floating-legend">

            {categories.map((category) => (

              <div

                className="legend-item"

                key={category}

              >

                <span

                  className="legend-dot"

                  style={{

                    backgroundColor:

                      categoryColors[category],

                  }}

                />



                <span>{category}</span>

              </div>

            ))}

          </div>

        </main>

      ) : currentPage === "analytics" ? (

        <main

          id="analytics"

          className="newscape-analytics-page"

        >

          <AnalyticsDashboard onLoadingChange={setAnalyticsLoading} />

        </main>

      ) : (

        /* Register, Login, Profile and Logout */

        <UserPages

          page={currentPage}

          setPage={goToPage}

          user={user}

          setUser={setUser}

        />

      )}

    </div>

  );

  }

}



export default App;
