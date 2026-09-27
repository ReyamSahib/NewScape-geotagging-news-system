"""
AI processing service for the NewScape Senior Project.

This module handles:
1. AI-based event location inference
2. UAE geocoding using Geoapify
3. AI-based news category classification

The AI components use separate Groq API keys and the
openai/gpt-oss-120b model.
"""

import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from groq import Groq



# API SETUP

# Locate the .env file stored in the root folder of the project.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = PROJECT_ROOT / ".env"

# Load API keys from .env instead of Google Colab userdata.
load_dotenv(ENV_PATH)

# Your API keys
location_api_key = os.getenv("LocationInferenceAPI")
category_api_key = os.getenv("CategoryClassificationAPI")
geoapify_api_key = os.getenv("GeocodingAPI2")

# Separate Groq clients
groq_client = Groq(api_key=location_api_key)
groq_category_client = Groq(api_key=category_api_key)



# GEOAPIFY GEOCODING

def geocode_location(location, emirate, country):
    search_text = f"{location}, {emirate}, {country}"

    url = "https://api.geoapify.com/v1/geocode/search"

    params = {
        "text": search_text,
        "apiKey": geoapify_api_key,
        "limit": 1,
        "filter": "countrycode:ae"
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    data = response.json()

    if not data["features"]:
        return None

    result = data["features"][0]["properties"]

    return {
        "latitude": result["lat"],
        "longitude": result["lon"],
        "formatted_address": result.get("formatted")
    }



# LOCATION INFERENCE

def detect_event_location_groq(title, article_text):

    prompt = f"""
You are the location inference component of a UAE news geotagging system.

Analyze the article and identify the geographic location where the MAIN EVENT
described in the article occurred.

You must return:
1. location_type
2. location
3. country
4. emirate
5. confidence


STEP 1 — EVENT LOCATION

Identify the location of the MAIN REPORTED EVENT.

Do NOT select a location simply because it appears in the article.

Ignore locations that only describe:
- a person's nationality
- a person's residence
- a person's destination or origin
- a company's headquarters
- the news publisher
- a responding authority
- background information
- another event mentioned in passing


STEP 2 — CLASSIFICATION

Classify the event location as exactly one of:

EXPLICIT
The article directly states where the main event occurred.

INFERRED
The article does not directly state the event location, but the location
can be reliably determined from strong contextual evidence.

NOT_GEOTAGGABLE
The event location cannot be reliably determined from the article.

Do not guess.

If evidence is insufficient, choose NOT_GEOTAGGABLE.


STEP 3 — LOCATION DETAIL

Return the MOST SPECIFIC location that is reliably supported.

Priority:

specific venue / building / landmark
→ road / district / area
→ city
→ emirate

Example:

If the article says an event occurred at "Dubai World Trade Centre",
return:

location = "Dubai World Trade Centre, Dubai"

Do NOT return only "Dubai".


STEP 4 — COUNTRY

Return the country containing the identified event location.

Use:

"United Arab Emirates"

for UAE locations.

If the location cannot be determined, use:

"Unknown"


LOCATION FORMATTING RULES:

- Do not repeat the same geographic name.
- If the city and emirate have the same name, return the name only once.

Examples:

Fujairah → "Fujairah"
Dubai → "Dubai"
Abu Dhabi → "Abu Dhabi"

Do NOT return:

"Fujairah, Fujairah"
"Dubai, Dubai"
"Abu Dhabi, Abu Dhabi"

- If a specific place is identified, include the place followed by its city/emirate.

Examples:

"Museum of the Future, Dubai"
"Expo Centre Sharjah, Sharjah"
"Hazza bin Zayed Stadium, Al Ain"


STEP 5 — EMIRATE

For locations inside the United Arab Emirates, return the emirate
containing the identified event location.

The emirate must be exactly one of:

- Abu Dhabi
- Dubai
- Sharjah
- Ajman
- Umm Al Quwain
- Ras Al Khaimah
- Fujairah

Use the emirate containing the event location, even when the specific
location uses a different city name.

Examples:

Hazza bin Zayed Stadium, Al Ain
→ emirate = "Abu Dhabi"

Museum of the Future, Dubai
→ emirate = "Dubai"

Expo Centre Sharjah, Sharjah
→ emirate = "Sharjah"

For an event outside the UAE:
emirate = "Outside UAE"

For NOT_GEOTAGGABLE:
emirate = "Unknown"


STEP 6 — CONFIDENCE

Return exactly one:

high
medium
low

Confidence refers to confidence in the EVENT LOCATION identification,
not confidence in the article itself.


FINAL CHECK

Before responding, verify:

1. Did I identify the MAIN EVENT location?
2. Is the location directly stated or genuinely inferred?
3. Did I choose the most specific supported location?
4. Does the country match the location?
5. Does the emirate match the identified UAE location?


OUTPUT

Return ONLY valid JSON.

Use exactly this structure:

{{
    "location_type": "EXPLICIT",
    "location": "Dubai World Trade Centre, Dubai",
    "emirate": "Dubai",
    "country": "United Arab Emirates",
    "confidence": "high"
}}


For a non-geotaggable article:

{{
    "location_type": "NOT_GEOTAGGABLE",
    "location": "Unknown",
    "country": "Unknown",
    "emirate": "Unknown",
    "confidence": "low"
}}

Do not include explanations outside the JSON.


ARTICLE

Title:
{title}

Article:
{article_text}
"""


    # GROQ LOCATION INFERENCE


    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": """
You are a precise geographic information extraction system.
Accuracy is more important than producing an answer.
Do not guess locations when the evidence is insufficient.
"""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={"type": "json_object"},
        temperature=0,
        reasoning_effort="high"
    )

    result = json.loads(response.choices[0].message.content)



    # APPLY PROJECT LOCATION RULES


    country = result.get("country", "").strip().lower()

    uae_names = {
        "united arab emirates",
        "uae",
        "u.a.e."
    }



    # CASE 1: LOCATION CANNOT BE IDENTIFIED


    if result["location_type"] == "NOT_GEOTAGGABLE":

        result["location"] = "Unknown"
        result["emirate"] = "Unknown"
        result["country"] = "Unknown"
        result["coordinates"] = [-1.0, -1.0]



    # CASE 2: LOCATION IS OUTSIDE UAE


    elif country not in uae_names:

        result["emirate"] = "Outside UAE"
        result["coordinates"] = [-2.0, -2.0]



    # CASE 3: UAE LOCATION → GEOAPIFY


    else:

        geocode_result = geocode_location(
            result["location"],
            result["emirate"],
            result["country"]
        )

        # Geoapify successfully found the location
        if geocode_result is not None:

            result["coordinates"] = [
                geocode_result["latitude"],
                geocode_result["longitude"]
            ]

        # UAE location identified, but Geoapify
        # could not determine the coordinates
        else:

            result["coordinates"] = [-3.0, -3.0]



    # FINAL RESULT

    return result



# CATEGORY CLASSIFICATION

def classify_article_groq(title, article_text):

    prompt = f"""
You are the category classification component of a news geotagging system.

Analyze the article and classify its MAIN SUBJECT into exactly ONE of the
following categories:

- Sports
- Finance
- Business
- Technology
- Entertainment
- Education
- Weather
- Traffic & Transport
- Other


CATEGORY DEFINITIONS

SPORTS:
Articles mainly about sporting events, competitions, matches, teams,
athletes, tournaments, sporting organizations, or sporting results.

FINANCE:
Articles mainly about banking, financial markets, investments, stocks,
interest rates, financial institutions, currencies, or financial performance.

BUSINESS:
Articles mainly about companies, industries, corporate activity,
business deals, commercial developments, company expansions,
partnerships, acquisitions, or general business activity.

TECHNOLOGY:
Articles mainly about artificial intelligence, software, hardware,
cybersecurity, digital platforms, computing, technological products,
or technological developments.

ENTERTAINMENT:
Articles mainly about films, television, music, celebrities,
performances, media productions, or the entertainment industry.

EDUCATION:
Articles mainly about schools, universities, students, academic programs,
educational initiatives, or developments in the education sector.

WEATHER:
Articles mainly about weather conditions, forecasts, storms, rainfall,
temperature, or other weather-related events.

TRAFFIC & TRANSPORT:
Articles mainly about road traffic, transport systems, public transportation,
road closures, accidents affecting traffic, or mobility-related developments.

OTHER:
Articles whose main subject does not reasonably fit any of the
categories above.

Political news must be classified as Other.


CLASSIFICATION RULES

1. Classify according to the MAIN SUBJECT of the article.

2. Do not classify an article based only on individual keywords.

3. If multiple topics appear, choose the category that best represents
   the main story.

4. Choose exactly ONE category.

5. Do not create new categories.

6. If the article does not reasonably fit any of the predefined categories,
   classify it as Other.

7. If the main subject is politics, government policy, elections,
   political leaders, diplomacy, or political affairs, classify it as Other.


CONFIDENCE

Return exactly one confidence level:

high
medium
low

Confidence represents how certain you are that the selected category
represents the main subject of the article.


OUTPUT

Return ONLY valid JSON using exactly this structure:

{{

    "category": "Business",
    "confidence": "high"

}}

Do not include explanations outside the JSON.


ARTICLE

Title:
{title}

Article:
{article_text}
"""


    # GROQ CATEGORY CLASSIFICATION


    response = groq_category_client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": """
You are a precise news category classification system.
Classify articles according to their main subject.
Follow the predefined category list exactly.
"""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={"type": "json_object"},
        temperature=0,
        reasoning_effort="high"
    )

    result = json.loads(response.choices[0].message.content)



    # FINAL RESULT


    return result



# CATEGORY DATABASE MAPPING

# Category IDs match the Category table in NewsStoreSenior.
category_mapping = {
    "Sports": 1,
    "Finance": 2,
    "Business": 3,
    "Technology": 4,
    "Entertainment": 5,
    "Education": 6,
    "Weather": 7,
    "Traffic & Transport": 8,
    "Other": 9
}


# LOCAL SETUP TEST

if __name__ == "__main__":
    print("AI service loaded successfully.")
    print("Location API key loaded:", bool(location_api_key))
    print("Category API key loaded:", bool(category_api_key))
    print("Geoapify API key loaded:", bool(geoapify_api_key))