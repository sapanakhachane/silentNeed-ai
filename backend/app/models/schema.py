from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    code = Column(String(50), unique=True, index=True)
    ward_number = Column(String(50), nullable=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    zone_type = Column(String(50), default="Urban Slum / Informal") # e.g., Urban Slum, Peri-Urban, Rural Hamlet, Tribal Belt
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population = Column(Integer, default=5000)
    households = Column(Integer, default=1100)
    median_income_monthly = Column(Float, default=9500.0) # Local currency unit
    digital_literacy_rate = Column(Float, default=32.0) # Percentage 0-100
    internet_penetration_rate = Column(Float, default=28.0) # Percentage 0-100
    distance_to_gov_office_km = Column(Float, default=8.5)
    primary_language = Column(String(50), default="Local Dialect")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    indicators = relationship("ServiceIndicator", back_populates="community", cascade="all, delete-orphan")
    predictions = relationship("NeedPrediction", back_populates="community", cascade="all, delete-orphan")
    interventions = relationship("InterventionRecord", back_populates="community", cascade="all, delete-orphan")
    feedbacks = relationship("CommunityFeedback", back_populates="community", cascade="all, delete-orphan")


class ServiceIndicator(Base):
    __tablename__ = "service_indicators"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, index=True)
    recorded_date = Column(DateTime, default=datetime.utcnow)

    # 1. Drinking Water Indicators
    water_access_hours_per_day = Column(Float, default=1.5) # e.g. 0.5 to 24 hrs
    water_contamination_index = Column(Float, default=72.0) # 0-100 (high = hazardous)
    water_source_type = Column(String(80), default="Shared Public Standpost") # Piped, Tanker, Standpost, Contaminated Well

    # 2. Road & Infrastructure Indicators
    road_condition_index = Column(Float, default=28.0) # 0-100 (0=unpaved/impassable, 100=pristine)
    pothole_density_per_km = Column(Float, default=14.5)
    public_transit_access_score = Column(Float, default=22.0) # 0-100

    # 3. Sanitation & Garbage Indicators
    garbage_collection_per_week = Column(Float, default=0.5) # days per week
    waste_overflow_rate = Column(Float, default=82.0) # 0-100
    open_drainage_percentage = Column(Float, default=78.0) # 0-100

    # 4. Electricity & Power Indicators
    power_outage_hours_per_week = Column(Float, default=38.0)
    voltage_fluctuation_severity = Column(Float, default=65.0) # 0-100
    street_light_operational_pct = Column(Float, default=15.0) # 0-100

    # 5. Healthcare Facilities Indicators
    distance_to_nearest_phc_km = Column(Float, default=9.2)
    doctor_availability_score = Column(Float, default=18.0) # 0-100
    infant_immunization_rate = Column(Float, default=52.0) # 0-100

    # 6. Drainage & Flooding Indicators
    flood_vulnerability_index = Column(Float, default=85.0) # 0-100
    drainage_blockage_percentage = Column(Float, default=88.0) # 0-100
    waterlogging_days_per_year = Column(Float, default=45.0)

    # 7. Administrative & Civic Access
    ration_shop_queue_hours = Column(Float, default=4.2)
    csc_service_center_dist_km = Column(Float, default=6.5)

    # The Complaint Paradox Core Field:
    official_complaints_registered_90d = Column(Integer, default=4) # Few or near zero!

    community = relationship("Community", back_populates="indicators")


class NeedPrediction(Base):
    __tablename__ = "need_predictions"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, index=True)
    evaluation_date = Column(DateTime, default=datetime.utcnow)

    # Overall Risk Scores
    ml_risk_score = Column(Float, nullable=False) # 0-100 from ML Model
    rule_risk_score = Column(Float, nullable=False) # 0-100 from Transparent Rule Engine
    final_risk_score = Column(Float, nullable=False) # Blended / confidence-weighted
    risk_tier = Column(String(50), nullable=False) # Low, Moderate, High, Critical

    # Complaint-Gap Analysis
    expected_complaints_90d = Column(Float, nullable=False)
    actual_complaints_90d = Column(Integer, nullable=False)
    complaint_gap_ratio = Column(Float, nullable=False) # Expected / (Actual + 1)
    silent_need_index = Column(Float, nullable=False) # 0-100 (Identifies Invisible Problems)

    # Sector Breakdown Scores (0-100 distress)
    water_risk = Column(Float, default=0.0)
    infra_risk = Column(Float, default=0.0)
    sanitation_risk = Column(Float, default=0.0)
    power_risk = Column(Float, default=0.0)
    health_risk = Column(Float, default=0.0)
    flooding_risk = Column(Float, default=0.0)
    admin_access_risk = Column(Float, default=0.0)

    # Anomaly Detection Output
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    anomaly_type = Column(String(100), default="None")

    # Explainable AI (XAI)
    top_contributing_factors = Column(JSON, default=list) # e.g. [{"factor": "Water Contamination", "impact": "+24.5%"}, ...]
    explanation_narrative = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    confidence_level = Column(Float, default=0.91)
    fallback_used = Column(Boolean, default=False)

    community = relationship("Community", back_populates="predictions")


class InterventionRecord(Base):
    __tablename__ = "intervention_records"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    sector = Column(String(80), nullable=False) # Drinking Water, Roads, Sanitation, etc.
    priority = Column(String(50), default="High") # Critical, High, Medium, Low
    estimated_budget = Column(Float, default=250000.0) # Currency unit
    lead_department = Column(String(120), nullable=False)
    status = Column(String(50), default="Identified") # Identified, Dispatched, In Progress, Verified Completed
    target_completion_days = Column(Integer, default=30)
    impact_projection = Column(String(200), nullable=True) # e.g., "Expected 68% drop in waterborne contamination"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    community = relationship("Community", back_populates="interventions")


class CommunityFeedback(Base):
    __tablename__ = "community_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, index=True)
    source_type = Column(String(80), default="NGO Ground Survey") # NGO Ground Survey, Satellite Anomaly, Citizen Kiosk, Field Officer
    issue_category = Column(String(80), nullable=False)
    severity = Column(String(50), default="High")
    field_notes = Column(Text, nullable=False)
    evidence_url = Column(String(250), nullable=True)
    verified = Column(Boolean, default=True)
    reported_at = Column(DateTime, default=datetime.utcnow)

    community = relationship("Community", back_populates="feedbacks")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(50), default="citizen")  # "authority", "ngo", "citizen"
    organization = Column(String(150), nullable=True)
    ward_assigned = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

