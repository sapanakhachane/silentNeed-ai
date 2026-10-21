from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Community, ServiceIndicator, NeedPrediction
from app.schemas.pydantic_models import SimulationRequest, SimulationResponse
from app.ml.risk_model import risk_estimator
from app.ml.complaint_gap import complaint_gap_analyzer

router = APIRouter(prefix="/simulation", tags=["Simulation & What-If"])

@router.post("/run", response_model=SimulationResponse)
def run_what_if_simulation(payload: SimulationRequest, db: Session = Depends(get_db)):
    comm = db.query(Community).filter(Community.id == payload.community_id).first()
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

    if not latest_ind or not latest_pred:
        raise HTTPException(status_code=400, detail="Community lacks initial indicator records")

    # Clone current features into simulated feature dictionary
    sim_data = {
        "name": comm.name,
        "population": comm.population,
        "households": comm.households,
        "median_income_monthly": comm.median_income_monthly,
        "digital_literacy_rate": comm.digital_literacy_rate,
        "internet_penetration_rate": comm.internet_penetration_rate,
        "distance_to_gov_office_km": comm.distance_to_gov_office_km,
        "water_access_hours_per_day": latest_ind.water_access_hours_per_day,
        "water_contamination_index": latest_ind.water_contamination_index,
        "road_condition_index": latest_ind.road_condition_index,
        "pothole_density_per_km": latest_ind.pothole_density_per_km,
        "public_transit_access_score": latest_ind.public_transit_access_score,
        "garbage_collection_per_week": latest_ind.garbage_collection_per_week,
        "waste_overflow_rate": latest_ind.waste_overflow_rate,
        "open_drainage_percentage": latest_ind.open_drainage_percentage,
        "power_outage_hours_per_week": latest_ind.power_outage_hours_per_week,
        "voltage_fluctuation_severity": latest_ind.voltage_fluctuation_severity,
        "street_light_operational_pct": latest_ind.street_light_operational_pct,
        "distance_to_nearest_phc_km": latest_ind.distance_to_nearest_phc_km,
        "doctor_availability_score": latest_ind.doctor_availability_score,
        "infant_immunization_rate": latest_ind.infant_immunization_rate,
        "flood_vulnerability_index": latest_ind.flood_vulnerability_index,
        "drainage_blockage_percentage": latest_ind.drainage_blockage_percentage,
        "waterlogging_days_per_year": latest_ind.waterlogging_days_per_year,
        "ration_shop_queue_hours": latest_ind.ration_shop_queue_hours,
        "csc_service_center_dist_km": latest_ind.csc_service_center_dist_km,
        "official_complaints_registered_90d": latest_ind.official_complaints_registered_90d
    }

    total_cost = 0.0

    # Apply Simulated Interventions
    if payload.water_access_hours_boost > 0:
        sim_data["water_access_hours_per_day"] = min(24.0, sim_data["water_access_hours_per_day"] + payload.water_access_hours_boost)
        total_cost += payload.water_access_hours_boost * 25000.0

    if payload.water_purification_plant_added:
        sim_data["water_contamination_index"] = max(10.0, sim_data["water_contamination_index"] * 0.25)
        total_cost += 150000.0

    if payload.road_repair_investment:
        sim_data["road_condition_index"] = min(90.0, sim_data["road_condition_index"] + 45.0)
        sim_data["pothole_density_per_km"] = max(1.0, sim_data["pothole_density_per_km"] * 0.2)
        total_cost += 280000.0

    if payload.garbage_frequency_boost > 0:
        sim_data["garbage_collection_per_week"] = min(7.0, sim_data["garbage_collection_per_week"] + payload.garbage_frequency_boost)
        sim_data["waste_overflow_rate"] = max(15.0, sim_data["waste_overflow_rate"] * 0.35)
        sim_data["open_drainage_percentage"] = max(20.0, sim_data["open_drainage_percentage"] * 0.5)
        total_cost += payload.garbage_frequency_boost * 40000.0

    if payload.mobile_clinic_deployed:
        sim_data["distance_to_nearest_phc_km"] = max(1.5, sim_data["distance_to_nearest_phc_km"] * 0.3)
        sim_data["doctor_availability_score"] = min(85.0, sim_data["doctor_availability_score"] + 50.0)
        sim_data["infant_immunization_rate"] = min(95.0, sim_data["infant_immunization_rate"] + 30.0)
        total_cost += 120000.0

    if payload.drainage_desilting_completed:
        sim_data["drainage_blockage_percentage"] = max(12.0, sim_data["drainage_blockage_percentage"] * 0.2)
        sim_data["flood_vulnerability_index"] = max(20.0, sim_data["flood_vulnerability_index"] * 0.4)
        sim_data["waterlogging_days_per_year"] = max(4.0, sim_data["waterlogging_days_per_year"] * 0.2)
        total_cost += 180000.0

    sim_complaints = latest_ind.official_complaints_registered_90d
    if payload.civic_grievance_kiosk_installed:
        # Installing a kiosk lowers distance to gov and boosts digital access
        sim_data["distance_to_gov_office_km"] = 1.0
        sim_data["csc_service_center_dist_km"] = 0.5
        sim_data["digital_literacy_rate"] = min(90.0, sim_data["digital_literacy_rate"] + 25.0)
        # Kiosk unlocks citizen voice, multiplying recorded complaints toward the actual true need!
        sim_complaints = max(sim_complaints, int(latest_pred.expected_complaints_90d * 0.85))
        total_cost += 60000.0

    # Re-evaluate with ML model
    new_risk_res = risk_estimator.predict_risk(sim_data)
    new_risk = new_risk_res["final_risk_score"]

    new_gap_res = complaint_gap_analyzer.evaluate_gap(
        comm.population,
        new_risk,
        sim_complaints,
        sim_data
    )

    baseline_risk = latest_pred.final_risk_score
    risk_diff = max(0.0, baseline_risk - new_risk)
    risk_reduction_pct = round((risk_diff / max(1.0, baseline_risk)) * 100.0, 1)

    baseline_sni = latest_pred.silent_need_index
    sni_diff = max(0.0, baseline_sni - new_gap_res["silent_need_index"])
    sni_reduction_pct = round((sni_diff / max(1.0, baseline_sni)) * 100.0, 1)

    # Social ROI score: (lives impacted * risk reduction) / (total_cost in thousands + 1)
    pop_thousands = comm.population / 1000.0
    cost_thousands = max(1.0, total_cost / 1000.0)
    roi_score = round((pop_thousands * risk_reduction_pct * 15.0) / cost_thousands, 2)

    # Sector improvements
    sector_improvements = {}
    for k in ["water_risk", "health_risk", "sanitation_risk", "flooding_risk", "infra_risk", "power_risk"]:
        old_val = getattr(latest_pred, k, 50.0)
        new_val = new_risk_res["sectors"].get(k, 50.0)
        sector_improvements[k] = round(max(0.0, old_val - new_val), 1)

    summary = (
        f"Simulated intervention in {comm.name} reduces public service distress by {risk_reduction_pct}% "
        f"and cuts Silent Need Index from {baseline_sni:.1f} down to {new_gap_res['silent_need_index']:.1f} "
        f"(-{sni_reduction_pct}%). Total estimated expenditure: ${total_cost:,.0f}."
    )

    return {
        "community_id": comm.id,
        "baseline_risk_score": baseline_risk,
        "simulated_risk_score": new_risk,
        "risk_reduction_pct": risk_reduction_pct,
        "baseline_silent_need_index": baseline_sni,
        "simulated_silent_need_index": new_gap_res["silent_need_index"],
        "silent_need_reduction_pct": sni_reduction_pct,
        "baseline_expected_complaints": latest_pred.expected_complaints_90d,
        "simulated_visible_complaints": sim_complaints,
        "sector_improvements": sector_improvements,
        "estimated_intervention_cost": total_cost,
        "roi_score": roi_score,
        "summary": summary
    }
