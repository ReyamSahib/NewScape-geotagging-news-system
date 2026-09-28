# NewScape – Geotagging News System

NewScape is a map-based news platform designed to retrieve, analyze, geotag, and visualize news articles based on their geographic relevance.

The system combines automated news retrieval, AI-based location inference, geocoding, category classification, database storage, analytics, and an interactive map interface to help users explore news geographically.

This project was initially designed during the Junior Project phase and is currently being implemented and tested as part of the Senior Project.

---

## Project Goal

The goal of NewScape is to transform traditional news browsing into a geographic experience.

Instead of viewing news only as a list of articles, NewScape aims to identify where news events occur and display relevant articles through an interactive map. Users will be able to explore news by location, category, and other filters.

---

## System Workflow

The current backend pipeline follows this general process:

**NewsAPI → AI Processing → Geocoding → MySQL Database → Analytics → Map & Dashboard**

1. News articles are retrieved through NewsAPI.
2. AI analyzes the article to determine the event location.
3. Locations are classified as **Explicit, Inferred, or Non-geotaggable**.
4. Valid locations are geocoded into latitude and longitude coordinates.
5. AI assigns each article to a predefined news category.
6. Processed articles are stored in the MySQL database.
7. Stored data is used to generate analytics.
8. The final system will display geotagged articles through an interactive map and dashboard.

---

## AI-Based Location Inference

NewScape uses AI to determine the geographic location associated with a news event.

The location module distinguishes between:

- **Explicit** – the event location is directly stated in the article.
- **Inferred** – the event location can be determined from the article context.
- **Non-geotaggable** – no reliable event location can be identified.

Geoapify is then used to convert valid identified locations into geographic coordinates.

Articles determined to represent events outside the UAE are excluded from the current UAE-focused dataset.

---

## News Category Classification

The AI classification component automatically assigns retrieved articles to one of the system's predefined news categories:

- Sports
- Finance
- Business
- Technology
- Entertainment
- Education
- Weather
- Traffic & Transport
- Other

---

## Database

NewScape currently uses a MySQL database for persistent news storage.

The database contains the following main tables:

- `NewsItem`
- `Source`
- `Category`
- `MediaAttachment`
- `RegisteredUser`
- `IngestionState`

Processed articles are stored together with information such as their source, category, publication date, inferred location, location type, and geographic coordinates.

Duplicate articles are prevented from being stored multiple times.

---

## Analytics

The backend currently supports preliminary analytics based on the stored news data, including:

- News category distribution
- Geotagging type distribution
- Article publication timeline

These analytics will later be incorporated into the NewScape dashboard.

---

## Current Progress

### Implemented

- MySQL database and database relationships
- NewsAPI integration
- Automated news retrieval
- AI-based location inference
- Explicit / Inferred / Non-geotaggable classification
- Geoapify geocoding
- AI-based news category classification
- Database storage of processed articles
- Duplicate article handling
- Outside-UAE article filtering
- Backend component integration
- Preliminary analytics
- Testing using real retrieved news articles

### In Progress / Upcoming

- Expanded AI and backend testing
- Larger news dataset
- Interactive map implementation
- Frontend user interface
- News markers and article details
- News filtering
- Analytics dashboard and charts
- Full frontend/backend integration
- System testing and refinement

---

## Planned Final System

The completed NewScape system is intended to provide an interactive interface where users can:

- Explore news through a geographic map
- Select map markers to view related news articles
- Filter news by category, location, and time
- View article and source information
- Explore news trends through analytics and charts
- Access continuously retrieved and processed news data

The system will connect the news retrieval, AI processing, database, analytics, and visualization components into a complete news geotagging platform.

---

## Technologies

### Backend
- Python
- FastAPI

### Database
- MySQL

### AI & Data Processing
- Groq
- Geoapify
- NewsAPI

### Frontend
- React *(planned/in development)*

### Development & Collaboration
- Git
- GitHub
- Visual Studio Code

---

## Project Structure

```text
NewScape-geotagging-news-system/
│
├── Junior-Project/
│   └── Previous design and documentation
│
├── system/
│   └── backend/
│       ├── database/
│       ├── Models/
│       └── Services/
│
├── .gitignore
└── README.md
