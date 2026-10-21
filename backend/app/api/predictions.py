from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Community, ServiceIndicator, NeedPrediction
from app.schemas.pydantic_models import NeedPredictionResponse
from app.ml.risk_model import risk_estimator
from app.ml.complaint_gap import complaint_gap_analyzer
from app.ml.anomaly_detector import service_anomaly_detector
from app.ml.explainability import explainable_ai

router = APIRouter(prefix="/predictions", tags=["Predictions & ML"])

@router.post("/evaluate-raw")
def evaluate_raw_payload(payload: Dict[str, Any] = Body(...)):
    """
    On-the-fly ML risk scoring, gap analysis, and explainability on arbitrary input data.
    Does not require saving to database; ideal for what-if previews and external audits.
    """
    comm_name = payload.get("name", "Custom Community Simulation")
    population = int(payload.get("population", 5000))
    complaints = int(payload.get("official_complaints_registered_90d", 3))

    risk_res = risk_estimator.predict_risk(payload)
    final_risk = risk_res["final_risk_score"]
    sectors = risk_res["sectors"]

    gap_res = complaint_gap_analyzer.evaluate_gap(
        population,
        final_risk,
        complaints,
        payload
    )

    is_anom, anom_score, anom_type = service_anomaly_detector.detect_anomaly(
        final_risk,
        complaints,
        gap_res["expected_complaints_90d"],
        payload
    )

    xai_res = explainable_ai.generate_explanation(
        comm_name,
        final_risk,
        risk_res["risk_tier"],
        gap_res["silent_need_index"],
        gap_res["expected_complaints_90d"],
        complaints,
        gap_res["complaint_gap_ratio"],
        sectors,
        is_anom,
        anom_type,
        payload,
        risk_res["fallback_used"]
    )

    return {
        "risk_assessment": risk_res,
        "complaint_gap": gap_res,
        "anomaly_analysis": {
            "is_anomaly": is_anom,
            "anomaly_score": anom_score,
            "anomaly_type": anom_type
        },
        "explainable_ai": xai_res
    }

@router.get("/anomalies")
def get_flagged_anomalies(db: Session = Depends(get_db)):
    """
    Returns all communities flagged by the Scikit-learn Anomaly Detection module.
    """
    preds = (
        db.query(NeedPrediction)
        .filter(NeedPrediction.is_anomaly == True)
        .all()
    )

    results = []
    for p in preds:
        comm = db.query(Community).filter(Community.id == p.community_id).first()
        if comm:
            results.append({
                "community_id": comm.id,
                "name": comm.name,
                "code": comm.code,
                "district": comm.district,
                "risk_tier": p.risk_tier,
                "final_risk_score": p.final_risk_score,
                "silent_need_index": p.silent_need_index,
                "anomaly_type": p.anomaly_type,
                "anomaly_score": p.anomaly_score,
                "actual_complaints": p.actual_complaints_90d,
                "expected_complaints": p.expected_complaints_90d,
                "top_driver": p.top_contributing_factors[0]["factor"] if p.top_contributing_factors else "General Infrastructure"
            })

    results.sort(key=lambda x: x["anomaly_score"], reverse=True)
    return results

@router.get("/complaint-gap-matrix")
def get_complaint_gap_matrix(db: Session = Depends(get_db)):
    """
    Returns data points for scatter plot: Actual Complaints vs Real Risk Score,
    visualizing the 'Silent Quadrant' (high distress, low complaints).
    """
    preds = db.query(NeedPrediction).all()
    points = []
    
    for p in preds:
        comm = db.query(Community).filter(Community.id == p.community_id).first()
        if comm:
            points.append({
                "community_id": comm.id,
                "name": comm.name,
                "zone_type": comm.zone_type,
                "actual_complaints": p.actual_complaints_90d,
                "expected_complaints": p.expected_complaints_90d,
                "final_risk_score": p.final_risk_score,
                "silent_need_index": p.silent_need_index,
                "quadrant": (
                    "Silent Crisis (Invisible Need)" if (p.final_risk_score >= 50 and p.actual_complaints_90d <= 10)
                    else "Vocal Saturated Need" if (p.final_risk_score >= 50 and p.actual_complaints_90d > 10)
                    else "Vocal Low Distress" if (p.final_risk_score < 50 and p.actual_complaints_90d > 20)
                    else "Equitable Low Risk"
                )
            })

    return points
