# SilentNeed AI — Detecting Invisible Community Problems

An AI/ML-powered public service platform designed to identify marginalized communities experiencing severe public-service deficits despite receiving near-zero official municipal complaints.

Traditional government triage pipelines disproportionately fund vocal, affluent areas with high digital literacy, falsely assuming that **"fewer complaints = fewer problems"**. **SilentNeed AI** resolves this blindspot by cross-referencing multi-sector physical indicators with digital exclusion metrics to expose **"Ghost Need Hotspots"**.

---

## 🌟 Key Capabilities & Architecture

### 1. Multi-Sector Distress Modeling (7 Critical Sectors)
Evaluates public service failure across:
* **Drinking Water:** Contamination index, access hours/day, toxic borehole presence.
* **Roads & Transit Infrastructure:** Pavement condition index, pothole density, transit connectivity.
* **Sanitation & Waste Management:** Weekly garbage collection frequency, solid waste overflow, open drain coverage.
* **Electricity & Grid Reliability:** Weekly outage duration, severe voltage fluctuations, non-working streetlights.
* **Healthcare Accessibility:** Distance to nearest Primary Health Centre (PHC), doctor availability, immunization rates.
* **Drainage & Flooding:** Drainage blockage percentages, waterlogging duration, riverine/urban flood vulnerability.
* **Civic Administrative Access:** Queuing time at ration depots, distance to Common Service Centres (CSC).

### 2. AI / ML Engine
* **Risk Estimation Ensemble:** Scikit-learn `RandomForestRegressor` and `GradientBoostingRegressor` predicting real Public Service Distress Scores (0-100).
* **Complaint-Gap Analyzer:** Mathematical model calculating Expected Complaints based on population and distress, computing the **Complaint Gap Ratio** and **Silent Need Index (SNI)**.
* **Anomaly Detection Module:** Scikit-learn `IsolationForest` classifying multi-dimensional disconnects (e.g. Critical Distress + Zero Escalation outliers).
* **Explainable AI (XAI) Engine:** Transparent feature attribution waterfalls, civic suppression friction analysis (digital illiteracy, remoteness), and automated natural language briefings.
* **Rule-Based Fallback Engine:** Auditable, transparent rule engine ensuring algorithmic accountability and compliance.
* **OpenStreetMap (OSM) Physical Amenity & Desert Engine:** Integrates the live OpenStreetMap Overpass API and Nominatim reverse geocoding to scan actual mapped public infrastructure within a 1.5km radius (drinking water taps, PHC clinics, waste disposal points, and civic centers), computing the **OSM Infrastructure Desert Index**.

### 3. Interactive Web Application
* **OpenStreetMap (OSM) Multi-Layer Radar:** Interactive Leaflet map with OpenStreetMap Standard tiles, Humanitarian OpenStreetMap (HOT) disaster/slum layer, and live OSM amenity POI overlays.
* **OSM Cartographic Intelligence Bar:** Real-time city-wide summary of OSM public amenities and detected infrastructure deserts.
* **Complaint-Gap Matrix (Recharts):** 2D scatter plot mapping Actual Complaints vs True Distress, isolating the **"Silent Crisis Zone"** quadrant.
* **Counterfactual Policy Simulation Sandbox:** "What-If" simulator modeling how clean water plants, mobile PHC vans, and civic grievance kiosks reduce distress and project social ROI.
* **Intervention Pipeline:** Real-time social impact resource tracker, department dispatching, and budget allocations.
* **Field Audit Registration:** On-the-fly survey submission with instant ML risk evaluation.

---

## 🛠 Technology Stack

* **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React, Recharts, React Leaflet, OpenStreetMap.
* **Backend:** Python 3.13, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2.
* **Cartographic & Geodata Engine:** OpenStreetMap (OSM) with Nominatim Reverse Geocoding & Overpass API.
* **Machine Learning & Data:** Scikit-learn, Pandas, NumPy.
* **Database:** PostgreSQL support via `DATABASE_URL` with zero-friction SQLite fallback.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* Python 3.10+
* Node.js v20+ / v22+

### 2. Run the Application
The FastAPI backend serves the complete application (both the REST API and the React Single Page App):

```bash
cd backend
python run.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.
API documentation is available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

### 3. Frontend Development (Hot Reloading)
To run the frontend dev server independently:
```bash
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)**.

---

## 🗄 PostgreSQL Configuration
To connect to a production PostgreSQL database, provide the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/silentneed_db"
python backend/run.py
```
If `DATABASE_URL` is omitted, the application automatically uses SQLite (`silentneed.db`).
