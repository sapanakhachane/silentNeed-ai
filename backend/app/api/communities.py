from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Community, ServiceIndicator, NeedPrediction, InterventionRecord
from app.schemas.pydantic_models import (
    CommunityResponse, CommunityCreate, CommunityDetailResponse, 
    ServiceIndicatorCreate, ServiceIndicatorResponse, NeedPredictionResponse
)
from app.ml.risk_model import risk_estimator
from app.ml.complaint_gap import complaint_gap_analyzer
from app.ml.anomaly_detector import service_anomaly_detector
from app.ml.explainability import explainable_ai

router = APIRouter(prefix="/communities", tags=["Communities"])

@router.get("", response_model=List[CommunityDetailResponse])
def get_communities(
    risk_tier: Optional[str] = Query(None, description="Filter by risk tier: Critical, High, Moderate, Low"),
    min_silent_need: Optional[float] = Query(None, description="Minimum Silent Need Index"),
    search: Optional[str] = Query(None, description="Search by name, district, or code"),
    anomaly_only: Optional[bool] = Query(False, description="Filter only anomalous communities"),
    db: Session = Depends(get_db)
):
    query = db.query(Community)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Community.name.ilike(search_filter)) |
            (Community.district.ilike(search_filter)) |
            (Community.code.ilike(search_filter))
        )

    communities = query.all()
    results = []

    for comm in communities:
        latest_ind = (
            db.query(ServiceIndicator)
            .filter(ServiceIndicator.community_id == comm.id)
            .order_by(ServiceIndicator.recorded_date.desc())
            .first()
        )
        latest_pred = (
            db.query(NeedPrediction)
            .filter(NeedPrediction.community_id == comm.id)
            .order_by(NeedPrediction.evaluation_date.desc())
            .first()
        )

        # Filters
        if risk_tier and (not latest_pred or latest_pred.risk_tier.lower() != risk_tier.lower()):
            continue
        if min_silent_need is not None and (not latest_pred or latest_pred.silent_need_index < min_silent_need):
            continue
        if anomaly_only and (not latest_pred or not latest_pred.is_anomaly):
            continue

        results.append({
            "id": comm.id,
            "name": comm.name,
            "code": comm.code,
            "ward_number": comm.ward_number,
            "district": comm.district,
            "state": comm.state,
            "zone_type": comm.zone_type,
            "latitude": comm.latitude,
            "longitude": comm.longitude,
            "population": comm.population,
            "households": comm.households,
            "median_income_monthly": comm.median_income_monthly,
            "digital_literacy_rate": comm.digital_literacy_rate,
            "internet_penetration_rate": comm.internet_penetration_rate,
            "distance_to_gov_office_km": comm.distance_to_gov_office_km,
            "primary_language": comm.primary_language,
            "created_at": comm.created_at,
            "latest_indicator": latest_ind,
            "latest_prediction": latest_pred
        })

    # Sort so most critical silent need communities appear first
    results.sort(
        key=lambda x: (
            x["latest_prediction"].silent_need_index if x["latest_prediction"] else 0.0
        ),
        reverse=True
    )

    return results


@router.get("/{community_id}", response_model=CommunityDetailResponse)
def get_community_detail(community_id: int, db: Session = Depends(get_db)):
    comm = db.query(Community).filter(Community.id == community_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    latest_ind = (
        db.query(ServiceIndicator)
        .filter(ServiceIndicator.community_id == comm.id)
        .order_by(ServiceIndicator.recorded_date.desc())
        .first()
    )
    latest_pred = (
        db.query(NeedPrediction)
        .filter(NeedPrediction.community_id == comm.id)
        .order_by(NeedPrediction.evaluation_date.desc())
        .first()
    )

    return {
        "id": comm.id,
        "name": comm.name,
        "code": comm.code,
        "ward_number": comm.ward_number,
        "district": comm.district,
        "state": comm.state,
        "zone_type": comm.zone_type,
        "latitude": comm.latitude,
        "longitude": comm.longitude,
        "population": comm.population,
        "households": comm.households,
        "median_income_monthly": comm.median_income_monthly,
        "digital_literacy_rate": comm.digital_literacy_rate,
        "internet_penetration_rate": comm.internet_penetration_rate,
        "distance_to_gov_office_km": comm.distance_to_gov_office_km,
        "primary_language": comm.primary_language,
        "created_at": comm.created_at,
        "latest_indicator": latest_ind,
        "latest_prediction": latest_pred
    }


@router.post("", response_model=CommunityResponse)
def create_community(payload: CommunityCreate, db: Session = Depends(get_db)):
    existing = db.query(Community).filter(Community.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Community with this code already exists")

    new_comm = Community(**payload.model_dump())
    db.add(new_comm)
    db.commit()
    db.refresh(new_comm)
    return new_comm


@router.post("/{community_id}/indicators", response_model=NeedPredictionResponse)
def record_service_indicator(
    community_id: int, 
    payload: ServiceIndicatorCreate, 
    db: Session = Depends(get_db)
):
    comm = db.query(Community).filter(Community.id == community_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    ind_dict = payload.model_dump()
    ind_dict.pop("community_id", None)
    
    indicator = ServiceIndicator(community_id=comm.id, **ind_dict)
    db.add(indicator)
    db.flush()

    # Trigger ML and XAI pipeline
    full_features = {
        "name": comm.name,
        "population": comm.population,
        "households": comm.households,
        "median_income_monthly": comm.median_income_monthly,
        "digital_literacy_rate": comm.digital_literacy_rate,
        "internet_penetration_rate": comm.internet_penetration_rate,
        "distance_to_gov_office_km": comm.distance_to_gov_office_km,
        **ind_dict
    }

    risk_res = risk_estimator.predict_risk(full_features)
    final_risk = risk_res["final_risk_score"]
    sectors = risk_res["sectors"]

    gap_res = complaint_gap_analyzer.evaluate_gap(
        comm.population,
        final_risk,
        payload.official_complaints_registered_90d,
        full_features
    )

    is_anom, anom_score, anom_type = service_anomaly_detector.detect_anomaly(
        final_risk,
        payload.official_complaints_registered_90d,
        gap_res["expected_complaints_90d"],
        full_features
    )

    xai_res = explainable_ai.generate_explanation(
        comm.name,
        final_risk,
        risk_res["risk_tier"],
        gap_res["silent_need_index"],
        gap_res["expected_complaints_90d"],
        payload.official_complaints_registered_90d,
        gap_res["complaint_gap_ratio"],
        sectors,
        is_anom,
        anom_type,
        full_features,
        risk_res["fallback_used"]
    )

    prediction = NeedPrediction(
        community_id=comm.id,
        ml_risk_score=risk_res["ml_risk_score"],
        rule_risk_score=risk_res["rule_risk_score"],
        final_risk_score=final_risk,
        risk_tier=risk_res["risk_tier"],
        expected_complaints_90d=gap_res["expected_complaints_90d"],
        actual_complaints_90d=payload.official_complaints_registered_90d,
        complaint_gap_ratio=gap_res["complaint_gap_ratio"],
        silent_need_index=gap_res["silent_need_index"],
        water_risk=sectors["water_risk"],
        infra_risk=sectors["infra_risk"],
        sanitation_risk=sectors["sanitation_risk"],
        power_risk=sectors["power_risk"],
        health_risk=sectors["health_risk"],
        flooding_risk=sectors["flooding_risk"],
        admin_access_risk=sectors["admin_access_risk"],
        is_anomaly=is_anom,
        anomaly_score=anom_score,
        anomaly_type=anom_type,
        top_contributing_factors=xai_res["top_contributing_factors"],
        explanation_narrative=xai_res["explanation_narrative"],
        recommended_action=xai_res["recommended_action"],
        confidence_level=risk_res["confidence_level"],
        fallback_used=risk_res["fallback_used"]
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return prediction
