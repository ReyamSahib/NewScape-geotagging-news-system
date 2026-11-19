import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const COLORS = [
  "#2563eb",
  "#0d9488",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#16a34a",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#64748b",
  "#84cc16",
];

const GEO_COLORS = {
  explicit: "#2563eb",
  inferred: "#0d9488",
  not_geotaggable: "#f59e0b",
};

const GEO_LABELS = {
  explicit: "Explicit Location",
  inferred: "Inferred Location",
  not_geotaggable: "Not Geotaggable",
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function CumulativeChart({ data }) {
  const validData = data.filter((item) => item.date);

  if (validData.length === 0) {
    return (
      <p className="analytics-empty">
        No publication dates available yet.
      </p>
    );
  }

  const width = 760;
  const height = 270;
  const padding = {
    top: 20,
    right: 25,
    bottom: 45,
    left: 55,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(
    1,
    ...validData.map((item) => Number(item.cumulative_count))
  );

  const points = validData.map((item, index) => {
    const x =
      padding.left +
      (validData.length === 1
        ? chartWidth / 2
        : (index / (validData.length - 1)) * chartWidth);

    const y =
      padding.top +
      chartHeight -
      (Number(item.cumulative_count) / maxCount) * chartHeight;

    return { x, y, ...item };
  });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${padding.top + chartHeight}
    L ${points[0].x} ${padding.top + chartHeight}
    Z
  `;

  const first = validData[0];
  const last = validData[validData.length - 1];

  return (
    <div className="analytics-chart-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Cumulative published article count over time"
        className="analytics-line-chart"
      >
        <defs>
          <linearGradient
            id="newscape-chart-gradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#2563eb"
              stopOpacity="0.2"
            />
            <stop
              offset="100%"
              stopColor="#2563eb"
              stopOpacity="0.01"
            />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y =
            padding.top +
            chartHeight -
            fraction * chartHeight;

          return (
            <g key={fraction}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#e7edf5"
                strokeDasharray="4 5"
              />

              <text
                x={padding.left - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
              >
                {Math.round(maxCount * fraction)}
              </text>
            </g>
          );
        })}

        <path
          d={areaPath}
          fill="url(#newscape-chart-gradient)"
        />

        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth="2"
          >
            <title>
              {`${point.date}: ${point.cumulative_count} articles`}
            </title>
          </circle>
        ))}

        <text
          x={padding.left}
          y={height - 12}
          fontSize="12"
          fill="#64748b"
          textAnchor="start"
        >
          {formatDate(first.date)}
        </text>

        <text
          x={width - padding.right}
          y={height - 12}
          fontSize="12"
          fill="#64748b"
          textAnchor="end"
        >
          {formatDate(last.date)}
        </text>
      </svg>

      <div className="analytics-chart-footer">
        <span>Based on article publication dates</span>
        <strong>
          {formatNumber(last.cumulative_count)} articles
        </strong>
      </div>
    </div>
  );
}


const CATEGORY_COLORS = {
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

function AnimatedCategoryLeaderboard({ data }) {
  const [progress, setProgress] = useState(0);

  const categories = [...data]
    .map((item) => ({
      category: item.category,
      count: Number(item.count) || 0,
    }))
    .sort((a, b) => b.count - a.count);

  useEffect(() => {
    let frame;
    let startTime;

    const duration = 3600;

    function animate(timestamp) {
      if (startTime === undefined) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const next = Math.min(elapsed / duration, 1);

      setProgress(next);

      if (next < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, []);

  if (categories.length === 0) {
    return (
      <p className="analytics-empty">
        No category data available.
      </p>
    );
  }

  const maxCount = Math.max(
    1,
    ...categories.map((item) => item.count)
  );

  // Starting positions are deliberately reversed to create
  // the visual crossing effect. They are not historical ranks.
  const initialOrder = [...categories].reverse();

  const ease = (value) =>
    value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;

  const movement = ease(Math.min(progress / 0.85, 1));
  const barGrowth = ease(Math.min(progress / 0.95, 1));

  const rowHeight = 66;

  return (
    <div
      className="analytics-race"
      style={{ height: categories.length * rowHeight }}
    >
      {categories.map((item, finalIndex) => {
        const initialIndex = initialOrder.findIndex(
          (entry) => entry.category === item.category
        );

        const currentPosition =
          initialIndex +
          (finalIndex - initialIndex) * movement;

        const width =
          (item.count / maxCount) * 100 * barGrowth;

        const color =
          CATEGORY_COLORS[item.category] || "#64748b";

        return (
          <div
            key={item.category}
            className="analytics-race-row"
            style={{
              transform: `translateY(${
                currentPosition * rowHeight
              }px)`,
              "--race-color": color,
            }}
          >
            <span className="analytics-race-rank">
              {String(finalIndex + 1).padStart(2, "0")}
            </span>

            <div className="analytics-race-content">
              <div className="analytics-race-heading">
                <span className="analytics-race-name">
                  <span
                    className="analytics-race-dot"
                    style={{ backgroundColor: color }}
                  />
                  {item.category}
                </span>

                <strong>
                  {item.count.toLocaleString()}
                </strong>
              </div>

              <div className="analytics-race-track">
                <div
                  className="analytics-race-fill"
                  style={{
                    width: `${width}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


// onLoadingChange tells App when the analytics data has loaded,
// so the loading screen stays until the page is ready.
export default function AnalyticsDashboard({ onLoadingChange }) {
  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [geotagging, setGeotagging] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Source comparison and most popular news (Hind's popularity service).
  // Loaded separately so the rest of the dashboard still works
  // if these endpoints are not available.
  const [sourceData, setSourceData] = useState([]);
  const [popularNews, setPopularNews] = useState([]);
  const [extrasLoading, setExtrasLoading] = useState(true);
  const [extrasError, setExtrasError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`${API}/analytics/sources`).then((response) => {
        if (!response.ok) throw new Error("sources");
        return response.json();
      }),
      fetch(`${API}/analytics/popular`).then((response) => {
        if (!response.ok) throw new Error("popular");
        return response.json();
      }),
    ])
      .then(([sources, popular]) => {
        if (cancelled) return;
        setSourceData(Array.isArray(sources) ? sources : []);
        setPopularNews(Array.isArray(popular) ? popular : []);
      })
      .catch((err) => {
        console.error("Source / popularity error:", err);
        if (!cancelled) {
          setExtrasError("Unable to load source and popularity data.");
        }
      })
      .finally(() => {
        if (!cancelled) setExtrasLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const endpoints = [
          "/analytics/summary",
          "/analytics/leaderboard",
          "/analytics/geotagging",
          "/analytics/timeline",
        ];

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(`${API}${endpoint}`)
          )
        );

        if (responses.some((response) => !response.ok)) {
          throw new Error(
            "Could not load analytics. Please check the FastAPI endpoints."
          );
        }

        const [
          summaryData,
          leaderboardData,
          geotaggingData,
          timelineData,
        ] = await Promise.all(
          responses.map((response) => response.json())
        );

        if (!cancelled) {
          setSummary(summaryData);
          setLeaderboard(
            Array.isArray(leaderboardData)
              ? leaderboardData
              : []
          );
          setGeotagging(
            Array.isArray(geotaggingData)
              ? geotaggingData
              : []
          );
          setTimeline(
            Array.isArray(timelineData)
              ? timelineData
              : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const total = summary?.total_articles ?? 0;
  const geotagged = summary?.map_articles ?? 0;
  const unlocated = summary?.non_geotaggable_articles ?? 0;

  const rate =
    total > 0
      ? ((geotagged / total) * 100).toFixed(1)
      : "0.0";

  const maxCategoryCount = Math.max(
    1,
    ...leaderboard.map((item) => Number(item.count))
  );

  const geoTotal = geotagging.reduce(
    (sum, item) => sum + Number(item.count || 0),
    0
  );

  // Sources: only sources that have stored articles, most first.
  const sortedSources = sourceData
    .map((source) => ({
      source: source.source,
      count: Number(source.article_count || 0),
    }))
    .filter((source) => source.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalSourceArticles = sortedSources.reduce(
    (sum, source) => sum + source.count,
    0
  );

  const maxSourceCount = Math.max(
    1,
    ...sortedSources.map((source) => source.count)
  );

  // Popular news: stories reported by at least two different
  // sources, top 10.
  const topPopularNews = popularNews
    .filter((story) => Number(story.source_count || 0) >= 2)
    .sort(
      (a, b) =>
        Number(b.popularity_score || 0) -
        Number(a.popularity_score || 0)
    )
    .slice(0, 10);

  const maxPopularity = Math.max(
    1,
    ...topPopularNews.map((story) =>
      Number(story.popularity_score || 0)
    )
  );

  if (loading) {
    return (
      <section className="analytics-dashboard">
        <p>Loading analytics...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="analytics-dashboard">
        <p className="analytics-error">{error}</p>
      </section>
    );
  }

  return (
    <section className="analytics-dashboard">
      <div className="analytics-heading">
        <div>
          <h2>News Analytics</h2>
          <p>
            Explore news coverage and geotagging performance
          </p>
        </div>

        <span className="analytics-live-label">
          ● Live Database Statistics
        </span>
      </div>

      {/* EXISTING OVERVIEW CARDS */}
      <div className="analytics-stats">
        <div className="analytics-stat-card">
          <span>Total Articles</span>
          <h3>{formatNumber(total)}</h3>
          <p>Stored news articles</p>
        </div>

        <div className="analytics-stat-card">
          <span>Geotagged Articles</span>
          <h3>{formatNumber(geotagged)}</h3>
          <p>Articles available on the map</p>
        </div>

        <div className="analytics-stat-card">
          <span>Geotagging Rate</span>
          <h3>{rate}%</h3>
          <p>Percentage with usable locations</p>
        </div>

        <div className="analytics-stat-card">
          <span>Unlocated Articles</span>
          <h3>{formatNumber(unlocated)}</h3>
          <p>Articles without usable map locations</p>
        </div>
      </div>

      {/* CUMULATIVE TIMELINE — shown directly after the overview cards */}
      <div
        className="analytics-panel analytics-timeline-panel"
        style={{ marginBottom: 22 }}
      >
        <div className="analytics-panel-heading">
          <div>
            <h3>Cumulative News Growth</h3>
            <p>
              Total published articles accumulated over time
            </p>
          </div>
          <span className="analytics-panel-tag">
            Timeline
          </span>
        </div>

        <CumulativeChart data={timeline} />
      </div>
      {/* MAIN CHARTS */}
      <div className="analytics-grid">
        {/* CATEGORY LEADERBOARD */}
        
        <div className="analytics-panel analytics-race-panel">
        <div className="analytics-panel-heading">
            <div>
            <h3>Category Leaderboard</h3>
            <p>News categories ranked by article volume</p>
            </div>
            <span className="analytics-panel-tag">
            Rankings
            </span>
        </div>

        <AnimatedCategoryLeaderboard data={leaderboard} />

        <p className="analytics-race-caption">
            Animated ranking display · Based on current stored articles
        </p>
        </div>


        {/* GEOTAGGING DISTRIBUTION */}
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Geotagging Breakdown</h3>
              <p>How article locations were identified</p>
            </div>
          </div>

          {geoTotal === 0 ? (
            <p className="analytics-empty">
              No geotagging data available.
            </p>
          ) : (
            <>
              <div className="analytics-donut-wrapper">
                <div
                  className="analytics-donut"
                  style={{
                    background: `conic-gradient(${geotagging
                      .reduce(
                        (result, item, index, arr) => {
                          const previous = arr
                            .slice(0, index)
                            .reduce(
                              (sum, entry) =>
                                sum +
                                Number(entry.count || 0),
                              0
                            );

                          const start =
                            (previous / geoTotal) * 100;
                          const end =
                            ((previous +
                              Number(item.count || 0)) /
                              geoTotal) *
                            100;

                          result.push(
                            `${
                              GEO_COLORS[item.location_type] ||
                              COLORS[index % COLORS.length]
                            } ${start}% ${end}%`
                          );

                          return result;
                        },
                        []
                      )
                      .join(", ")})`,
                  }}
                >
                  <div className="analytics-donut-center">
                    <strong>
                      {formatNumber(geoTotal)}
                    </strong>
                    <span>Articles</span>
                  </div>
                </div>
              </div>

              <div className="analytics-geo-list">
                {geotagging.map((item, index) => {
                  const count = Number(item.count || 0);

                  const percentage =
                    geoTotal > 0
                      ? ((count / geoTotal) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <div
                      className="analytics-geo-row"
                      key={`${item.location_type}-${index}`}
                    >
                      <div className="analytics-geo-name">
                        <span
                          className="analytics-geo-dot"
                          style={{
                            backgroundColor:
                              GEO_COLORS[
                                item.location_type
                              ] ||
                              COLORS[index % COLORS.length],
                          }}
                        />
                        <span>
                          {GEO_LABELS[
                            item.location_type
                          ] || item.location_type}
                        </span>
                      </div>

                      <strong>
                        {formatNumber(count)}
                        <small> ({percentage}%)</small>
                      </strong>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SOURCES AND POPULAR NEWS */}
      <div className="analytics-grid analytics-grid-even">
        {/* NEWS SOURCE COMPARISON */}
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>News Source Comparison</h3>
              <p>How many articles each source contributes</p>
            </div>
            <span className="analytics-panel-tag">
              {sortedSources.length} sources
            </span>
          </div>

          {extrasLoading ? (
            <p className="analytics-empty">Loading source statistics...</p>
          ) : extrasError ? (
            <p className="analytics-empty">{extrasError}</p>
          ) : sortedSources.length === 0 ? (
            <p className="analytics-empty">No source data available yet.</p>
          ) : (
            <div className="analytics-bar-list">
              {sortedSources.map((source) => {
                const percentage =
                  totalSourceArticles > 0
                    ? ((source.count / totalSourceArticles) * 100).toFixed(1)
                    : "0.0";

                return (
                  <div className="analytics-bar-item" key={source.source}>
                    <div className="analytics-geo-row">
                      <span className="analytics-geo-name">
                        {source.source}
                      </span>
                      <strong>
                        {formatNumber(source.count)}
                        <small> ({percentage}%)</small>
                      </strong>
                    </div>

                    <div className="analytics-race-track">
                      <div
                        className="analytics-race-fill"
                        style={{
                          width: `${(source.count / maxSourceCount) * 100}%`,
                          backgroundColor: "#8FB2FF",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MOST POPULAR NEWS */}
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Most Popular News</h3>
              <p>Stories reported by the most different sources</p>
            </div>
            <span className="analytics-panel-tag">Top 10</span>
          </div>

          {extrasLoading ? (
            <p className="analytics-empty">Loading popularity rankings...</p>
          ) : extrasError ? (
            <p className="analytics-empty">{extrasError}</p>
          ) : topPopularNews.length === 0 ? (
            <p className="analytics-empty">
              No story has been reported by more than one source yet.
            </p>
          ) : (
            <div className="analytics-bar-list">
              {topPopularNews.map((story, index) => (
                <div
                  className="analytics-bar-item"
                  key={`${story.title}-${index}`}
                >
                  <div className="analytics-geo-row">
                    <span className="analytics-geo-name analytics-story-title">
                      {index + 1}. {story.title}
                    </span>
                    <strong>
                      {story.source_count}
                      <small> sources</small>
                    </strong>
                  </div>

                  <div className="analytics-race-track">
                    <div
                      className="analytics-race-fill"
                      style={{
                        width: `${
                          (Number(story.popularity_score || 0) /
                            maxPopularity) *
                          100
                        }%`,
                        backgroundColor: "#16a34a",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </section>
  );
}