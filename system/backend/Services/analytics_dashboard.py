
"""
NewScape Analytics Dashboard.

Displays real analytics from MySQL using Streamlit.
Uses the existing analytics_service.py functions.
"""

import streamlit as st
import pandas as pd
from pathlib import Path

from analytics_service import (
    get_summary_statistics,
    get_category_distribution,
    get_geotagging_distribution,
    get_publication_timeline
)

# PAGE SETTINGS
st.set_page_config(
    page_title="NewScape | Analytics",
    page_icon="📊",
    layout="wide"
)

# NEWSCAPE DASHBOARD STYLING
st.markdown("""
<style>
    .stApp {
        background-color: #F7F9FA;
        color: #10243A;
    }

    .block-container {
        padding-top: 2rem;
        max-width: 1250px;
    }

    h1, h2, h3 {
        color: #10243A !important;
    }

    div[data-testid="stMetric"] {
        background-color: white;
        border: 1px solid #E3E9ED;
        border-radius: 12px;
        padding: 20px;
    }

    div[data-testid="stMetricValue"] {
        color: #0BAF9E;
    }

    div[data-testid="stVerticalBlockBorderWrapper"] > div {
        border-radius: 12px;
    }

    div.stButton > button {
        border-radius: 8px;
        border: 1px solid #0BAF9E;
        color: #087E75;
    }
</style>
""", unsafe_allow_html=True)

## NEWSCAPE LOGO AND HEADER

# Locate the logo in the shared frontend assets folder.
logo_path = (
    Path(__file__).resolve().parents[2]
    / "frontend"
    / "assets"
    / "images"
    / "Newscape_Logo.jpg"
)

st.image(logo_path, width=340)

st.caption("News Geotagging on Maps and Analytics")

st.divider()

header_col, refresh_col = st.columns([4, 1])

with header_col:
    st.header("Analytics Dashboard")
    st.write("UAE news distribution and geotagging insights")

with refresh_col:
    st.write("")
    if st.button("↻ Refresh Analytics"):
        st.rerun()

# RETRIEVE REAL ANALYTICS FROM MYSQL
try:
    summary = get_summary_statistics()
    categories = get_category_distribution()
    geotagging = get_geotagging_distribution()
    timeline = get_publication_timeline()

except Exception as error:
    st.error("Unable to load analytics from the database.")
    st.exception(error)
    st.stop()

# SUMMARY STATISTICS
total_articles = summary["total_articles"]
map_articles = summary["map_articles"]
non_geotaggable = summary["non_geotaggable_articles"]

geotag_counts = dict(geotagging)
explicit_count = geotag_counts.get("explicit", 0)
inferred_count = geotag_counts.get("inferred", 0)

success_rate = (
    map_articles / total_articles * 100
    if total_articles > 0 else 0
)

st.subheader("Overview")

col1, col2, col3 = st.columns(3)
col1.metric("Total Articles", total_articles)
col2.metric("Geotagged Articles", map_articles)
col3.metric("Geotagging Rate", f"{success_rate:.1f}%")

col4, col5, col6 = st.columns(3)
col4.metric("Explicit Locations", explicit_count)
col5.metric("Inferred Locations", inferred_count)
col6.metric("Unknown Locations", non_geotaggable)

st.write("")

# CHART DATA
category_df = pd.DataFrame(
    categories,
    columns=["Category", "Articles"]
)

geotagging_df = pd.DataFrame(
    geotagging,
    columns=["Location Type", "Articles"]
)

timeline_df = pd.DataFrame(
    timeline,
    columns=["Date", "Articles"]
)

# CATEGORY AND GEOTAGGING CHARTS
left_chart, right_chart = st.columns(2)

with left_chart:
    with st.container(border=True):
        st.subheader("Category Distribution")
        st.bar_chart(
            category_df.set_index("Category"),
            color="#16B8AA"
        )

with right_chart:
    with st.container(border=True):
        st.subheader("Geotagging Breakdown")

        if not geotagging_df.empty:
            st.vega_lite_chart(
                geotagging_df,
                {
                    "mark": {"type": "arc", "innerRadius": 65},
                    "encoding": {
                        "theta": {
                            "field": "Articles",
                            "type": "quantitative"
                        },
                        "color": {
                            "field": "Location Type",
                            "type": "nominal",
                            "scale": {
                                "domain": [
                                    "explicit",
                                    "inferred",
                                    "not_geotaggable"
                                ],
                                "range": [
                                    "#10B981",
                                    "#F59E0B",
                                    "#94A3B8"
                                ]
                            }
                        },
                        "tooltip": [
                            {"field": "Location Type"},
                            {"field": "Articles"}
                        ]
                    }
                },
                width="stretch"
            )
        else:
            st.info("No geotagging data available.")

# PUBLICATION TIMELINE
with st.container(border=True):
    st.subheader("News Publication Timeline")

    if not timeline_df.empty:
        timeline_df["Date"] = pd.to_datetime(
            timeline_df["Date"]
        )

        st.line_chart(
            timeline_df.set_index("Date"),
            color="#16B8AA"
        )
    else:
        st.info("No publication data available.")

st.caption("NewScape Senior Project | Analytics Dashboard Prototype")
