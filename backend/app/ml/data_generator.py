import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.schema import (
    Community, ServiceIndicator, NeedPrediction, InterventionRecord, CommunityFeedback
)
from app.ml.risk_model import risk_estimator
from app.ml.complaint_gap import complaint_gap_analyzer
from app.ml.anomaly_detector import service_anomaly_detector
from app.ml.explainability import explainable_ai

SEED_COMMUNITIES = [
    {
        "name": "Bhim Nagar Transit Settlement",
        "code": "COMM-BN-01",
        "ward_number": "Ward 42-B",
        "district": "Metro East",
        "state": "State North",
        "zone_type": "Informal Railside Slum",
        "latitude": 28.6448,
        "longitude": 77.2167,
        "population": 14200,
        "households": 2850,
        "median_income_monthly": 8200.0,
        "digital_literacy_rate": 22.5,
        "internet_penetration_rate": 26.0,
        "distance_to_gov_office_km": 11.4,
        "indicator": {
            "water_access_hours_per_day": 0.8,
            "water_contamination_index": 84.5,
            "water_source_type": "Irregular Private Tanker",
            "road_condition_index": 22.0,
            "pothole_density_per_km": 18.2,
            "public_transit_access_score": 19.0,
            "garbage_collection_per_week": 0.3,
            "waste_overflow_rate": 89.0,
            "open_drainage_percentage": 92.0,
            "power_outage_hours_per_week": 42.0,
            "voltage_fluctuation_severity": 78.0,
            "street_light_operational_pct": 12.0,
            "distance_to_nearest_phc_km": 8.7,
            "doctor_availability_score": 15.0,
            "infant_immunization_rate": 48.0,
            "flood_vulnerability_index": 88.0,
            "drainage_blockage_percentage": 94.0,
            "waterlogging_days_per_year": 52.0,
            "ration_shop_queue_hours": 4.5,
            "csc_service_center_dist_km": 7.2,
            "official_complaints_registered_90d": 2  # MASSIVE PARADOX: 2 complaints vs 14k people in crisis!
        }
    },
    {
        "name": "Kalyanpur Industrial Fringe",
        "code": "COMM-KP-02",
        "ward_number": "Ward 18",
        "district": "Metro North",
        "state": "State North",
        "zone_type": "Peri-Urban Factory Belt",
        "latitude": 28.6920,
        "longitude": 77.1450,
        "population": 9800,
        "households": 1950,
        "median_income_monthly": 9400.0,
        "digital_literacy_rate": 28.0,
        "internet_penetration_rate": 31.0,
        "distance_to_gov_office_km": 9.5,
        "indicator": {
            "water_access_hours_per_day": 1.2,
            "water_contamination_index": 92.0, # High toxic industrial runoff!
            "water_source_type": "Contaminated Ground Borewell",
            "road_condition_index": 34.0,
            "pothole_density_per_km": 14.0,
            "public_transit_access_score": 28.0,
            "garbage_collection_per_week": 0.8,
            "waste_overflow_rate": 79.0,
            "open_drainage_percentage": 75.0,
            "power_outage_hours_per_week": 34.0,
            "voltage_fluctuation_severity": 68.0,
            "street_light_operational_pct": 24.0,
            "distance_to_nearest_phc_km": 6.8,
            "doctor_availability_score": 22.0,
            "infant_immunization_rate": 58.0,
            "flood_vulnerability_index": 62.0,
            "drainage_blockage_percentage": 70.0,
            "waterlogging_days_per_year": 28.0,
            "ration_shop_queue_hours": 3.8,
            "csc_service_center_dist_km": 5.4,
            "official_complaints_registered_90d": 3  # Near zero complaints
        }
    },
    {
        "name": "Narmada Riverbed Colony",
        "code": "COMM-NR-03",
        "ward_number": "Ward 55",
        "district": "Metro South",
        "state": "State North",
        "zone_type": "Riverine Floodplain",
        "latitude": 28.5820,
        "longitude": 77.3010,
        "population": 7200,
        "households": 1400,
        "median_income_monthly": 7600.0,
        "digital_literacy_rate": 18.0,
        "internet_penetration_rate": 22.0,
        "distance_to_gov_office_km": 13.0,
        "indicator": {
            "water_access_hours_per_day": 1.5,
            "water_contamination_index": 76.0,
            "water_source_type": "River Infiltration Well",
            "road_condition_index": 18.0,
            "pothole_density_per_km": 21.0,
            "public_transit_access_score": 14.0,
            "garbage_collection_per_week": 0.2,
            "waste_overflow_rate": 92.0,
            "open_drainage_percentage": 95.0,
            "power_outage_hours_per_week": 48.0,
            "voltage_fluctuation_severity": 82.0,
            "street_light_operational_pct": 8.0,
            "distance_to_nearest_phc_km": 11.2,
            "doctor_availability_score": 12.0,
            "infant_immunization_rate": 42.0,
            "flood_vulnerability_index": 96.0, # Chronic flood zone
            "drainage_blockage_percentage": 98.0,
            "waterlogging_days_per_year": 64.0,
            "ration_shop_queue_hours": 5.2,
            "csc_service_center_dist_km": 9.1,
            "official_complaints_registered_90d": 1  # 1 complaint
        }
    },
    {
        "name": "Sundar Gram Brickfield Hamlets",
        "code": "COMM-SG-04",
        "ward_number": "Panchayat Block 3",
        "district": "Metro Outer Rural",
        "state": "State North",
        "zone_type": "Rural Migrant Cluster",
        "latitude": 28.7450,
        "longitude": 77.0850,
        "population": 5400,
        "households": 980,
        "median_income_monthly": 6800.0,
        "digital_literacy_rate": 15.0,
        "internet_penetration_rate": 19.0,
        "distance_to_gov_office_km": 16.5,
        "indicator": {
            "water_access_hours_per_day": 0.5,
            "water_contamination_index": 82.0,
            "water_source_type": "Unprotected Handpump",
            "road_condition_index": 14.0,
            "pothole_density_per_km": 24.0,
            "public_transit_access_score": 9.0,
            "garbage_collection_per_week": 0.0, # No municipal service
            "waste_overflow_rate": 95.0,
            "open_drainage_percentage": 98.0,
            "power_outage_hours_per_week": 58.0,
            "voltage_fluctuation_severity": 86.0,
            "street_light_operational_pct": 0.0,
            "distance_to_nearest_phc_km": 14.5,
            "doctor_availability_score": 8.0,
            "infant_immunization_rate": 35.0,
            "flood_vulnerability_index": 72.0,
            "drainage_blockage_percentage": 88.0,
            "waterlogging_days_per_year": 38.0,
            "ration_shop_queue_hours": 6.0,
            "csc_service_center_dist_km": 12.0,
            "official_complaints_registered_90d": 0  # Absolute zero complaints!
        }
    },
    {
        "name": "Azad Basti Quarry Settlement",
        "code": "COMM-AB-05",
        "ward_number": "Ward 61",
        "district": "Metro Hills",
        "state": "State North",
        "zone_type": "Hillside Quarry Settlement",
        "latitude": 28.5120,
        "longitude": 77.1950,
        "population": 8500,
        "households": 1650,
        "median_income_monthly": 8800.0,
        "digital_literacy_rate": 26.0,
        "internet_penetration_rate": 29.0,
        "distance_to_gov_office_km": 8.2,
        "indicator": {
            "water_access_hours_per_day": 1.0,
            "water_contamination_index": 79.0,
            "water_source_type": "Deep Tubewell with High Mineral Salinity",
            "road_condition_index": 26.0,
            "pothole_density_per_km": 17.5,
            "public_transit_access_score": 21.0,
            "garbage_collection_per_week": 0.5,
            "waste_overflow_rate": 84.0,
            "open_drainage_percentage": 86.0,
            "power_outage_hours_per_week": 36.0,
            "voltage_fluctuation_severity": 72.0,
            "street_light_operational_pct": 18.0,
            "distance_to_nearest_phc_km": 7.5,
            "doctor_availability_score": 20.0,
            "infant_immunization_rate": 51.0,
            "flood_vulnerability_index": 55.0,
            "drainage_blockage_percentage": 68.0,
            "waterlogging_days_per_year": 22.0,
            "ration_shop_queue_hours": 4.1,
            "csc_service_center_dist_km": 6.3,
            "official_complaints_registered_90d": 4
        }
    },
    {
        "name": "Nehru Enclave Resettlement Colony",
        "code": "COMM-NE-06",
        "ward_number": "Ward 09",
        "district": "Metro West",
        "state": "State North",
        "zone_type": "Planned Resettlement Site",
        "latitude": 28.6210,
        "longitude": 77.0650,
        "population": 12500,
        "households": 2400,
        "median_income_monthly": 13500.0,
        "digital_literacy_rate": 45.0,
        "internet_penetration_rate": 48.0,
        "distance_to_gov_office_km": 6.0,
        "indicator": {
            "water_access_hours_per_day": 3.5,
            "water_contamination_index": 48.0,
            "water_source_type": "Piped Supply (Intermittent)",
            "road_condition_index": 52.0,
            "pothole_density_per_km": 8.0,
            "public_transit_access_score": 45.0,
            "garbage_collection_per_week": 2.5,
            "waste_overflow_rate": 55.0,
            "open_drainage_percentage": 48.0,
            "power_outage_hours_per_week": 18.0,
            "voltage_fluctuation_severity": 42.0,
            "street_light_operational_pct": 54.0,
            "distance_to_nearest_phc_km": 3.8,
            "doctor_availability_score": 48.0,
            "infant_immunization_rate": 72.0,
            "flood_vulnerability_index": 48.0,
            "drainage_blockage_percentage": 52.0,
            "waterlogging_days_per_year": 16.0,
            "ration_shop_queue_hours": 2.2,
            "csc_service_center_dist_km": 3.5,
            "official_complaints_registered_90d": 18 # Moderate complaints
        }
    },
    {
        "name": "Mayur Vihar Heights (Baseline Comparison)",
        "code": "COMM-MV-07",
        "ward_number": "Ward 02",
        "district": "Metro Central",
        "state": "State North",
        "zone_type": "Affluent Urban Center",
        "latitude": 28.6050,
        "longitude": 77.2950,
        "population": 11000,
        "households": 2300,
        "median_income_monthly": 42000.0,
        "digital_literacy_rate": 88.0,
        "internet_penetration_rate": 92.0,
        "distance_to_gov_office_km": 2.2,
        "indicator": {
            "water_access_hours_per_day": 18.0,
            "water_contamination_index": 12.0,
            "water_source_type": "Municipal Treated Piped Supply",
            "road_condition_index": 88.0,
            "pothole_density_per_km": 1.2,
            "public_transit_access_score": 86.0,
            "garbage_collection_per_week": 6.5,
            "waste_overflow_rate": 12.0,
            "open_drainage_percentage": 8.0,
            "power_outage_hours_per_week": 3.0,
            "voltage_fluctuation_severity": 14.0,
            "street_light_operational_pct": 94.0,
            "distance_to_nearest_phc_km": 1.2,
            "doctor_availability_score": 88.0,
            "infant_immunization_rate": 94.0,
            "flood_vulnerability_index": 15.0,
            "drainage_blockage_percentage": 14.0,
            "waterlogging_days_per_year": 2.0,
            "ration_shop_queue_hours": 0.5,
            "csc_service_center_dist_km": 1.0,
            "official_complaints_registered_90d": 62 # Vocal affluent area: low distress, tons of complaints!
        }
    },
    {
        "name": "Chirag Dilli Heritage Walled Cluster",
        "code": "COMM-CD-08",
        "ward_number": "Ward 31",
        "district": "Metro South",
        "state": "State North",
        "zone_type": "Dense Historic Urban Village",
        "latitude": 28.5390,
        "longitude": 77.2280,
        "population": 8900,
        "households": 1780,
        "median_income_monthly": 15200.0,
        "digital_literacy_rate": 52.0,
        "internet_penetration_rate": 58.0,
        "distance_to_gov_office_km": 4.5,
        "indicator": {
            "water_access_hours_per_day": 3.0,
            "water_contamination_index": 58.0,
            "water_source_type": "Aged Cast Iron Pipeline",
            "road_condition_index": 44.0,
            "pothole_density_per_km": 9.5,
            "public_transit_access_score": 62.0,
            "garbage_collection_per_week": 2.0,
            "waste_overflow_rate": 64.0,
            "open_drainage_percentage": 62.0,
            "power_outage_hours_per_week": 22.0,
            "voltage_fluctuation_severity": 54.0,
            "street_light_operational_pct": 42.0,
            "distance_to_nearest_phc_km": 3.2,
            "doctor_availability_score": 52.0,
            "infant_immunization_rate": 68.0,
            "flood_vulnerability_index": 52.0,
            "drainage_blockage_percentage": 74.0,
            "waterlogging_days_per_year": 20.0,
            "ration_shop_queue_hours": 2.8,
            "csc_service_center_dist_km": 2.8,
            "official_complaints_registered_90d": 14
        }
    }
]

def seed_database_if_empty(db: Session):
    """Populates initial realistic communities, indicators, predictions, and interventions."""
    existing_count = db.query(Community).count()
    if existing_count > 0:
        return

    print("Seeding SilentNeed AI benchmark communities...")

    for comm_data in SEED_COMMUNITIES:
        ind_data = comm_data["indicator"]
        
        community = Community(
            name=comm_data["name"],
            code=comm_data["code"],
            ward_number=comm_data["ward_number"],
            district=comm_data["district"],
            state=comm_data["state"],
            zone_type=comm_data["zone_type"],
            latitude=comm_data["latitude"],
            longitude=comm_data["longitude"],
            population=comm_data["population"],
            households=comm_data["households"],
            median_income_monthly=comm_data["median_income_monthly"],
            digital_literacy_rate=comm_data["digital_literacy_rate"],
            internet_penetration_rate=comm_data["internet_penetration_rate"],
            distance_to_gov_office_km=comm_data["distance_to_gov_office_km"]
        )
        db.add(community)
        db.flush() # assign ID

        indicator = ServiceIndicator(
            community_id=community.id,
            water_access_hours_per_day=ind_data["water_access_hours_per_day"],
            water_contamination_index=ind_data["water_contamination_index"],
            water_source_type=ind_data["water_source_type"],
            road_condition_index=ind_data["road_condition_index"],
            pothole_density_per_km=ind_data["pothole_density_per_km"],
            public_transit_access_score=ind_data["public_transit_access_score"],
            garbage_collection_per_week=ind_data["garbage_collection_per_week"],
            waste_overflow_rate=ind_data["waste_overflow_rate"],
            open_drainage_percentage=ind_data["open_drainage_percentage"],
            power_outage_hours_per_week=ind_data["power_outage_hours_per_week"],
            voltage_fluctuation_severity=ind_data["voltage_fluctuation_severity"],
            street_light_operational_pct=ind_data["street_light_operational_pct"],
            distance_to_nearest_phc_km=ind_data["distance_to_nearest_phc_km"],
            doctor_availability_score=ind_data["doctor_availability_score"],
            infant_immunization_rate=ind_data["infant_immunization_rate"],
            flood_vulnerability_index=ind_data["flood_vulnerability_index"],
            drainage_blockage_percentage=ind_data["drainage_blockage_percentage"],
            waterlogging_days_per_year=ind_data["waterlogging_days_per_year"],
            ration_shop_queue_hours=ind_data["ration_shop_queue_hours"],
            csc_service_center_dist_km=ind_data["csc_service_center_dist_km"],
            official_complaints_registered_90d=ind_data["official_complaints_registered_90d"]
        )
        db.add(indicator)
        db.flush()

        # Combine community metadata + indicator for ML features
        full_feature_dict = {
            **comm_data,
            **ind_data
        }

        # 1. ML Risk Score
        risk_res = risk_estimator.predict_risk(full_feature_dict)
        final_risk = risk_res["final_risk_score"]
        sectors = risk_res["sectors"]

        # 2. Complaint Gap
        gap_res = complaint_gap_analyzer.evaluate_gap(
            community.population,
            final_risk,
            ind_data["official_complaints_registered_90d"],
            full_feature_dict
        )

        # 3. Anomaly Detection
        is_anom, anom_score, anom_type = service_anomaly_detector.detect_anomaly(
            final_risk,
            ind_data["official_complaints_registered_90d"],
            gap_res["expected_complaints_90d"],
            full_feature_dict
        )

        # 4. Explainable AI
        xai_res = explainable_ai.generate_explanation(
            community.name,
            final_risk,
            risk_res["risk_tier"],
            gap_res["silent_need_index"],
            gap_res["expected_complaints_90d"],
            ind_data["official_complaints_registered_90d"],
            gap_res["complaint_gap_ratio"],
            sectors,
            is_anom,
            anom_type,
            full_feature_dict,
            risk_res["fallback_used"]
        )

        prediction = NeedPrediction(
            community_id=community.id,
            ml_risk_score=risk_res["ml_risk_score"],
            rule_risk_score=risk_res["rule_risk_score"],
            final_risk_score=final_risk,
            risk_tier=risk_res["risk_tier"],
            expected_complaints_90d=gap_res["expected_complaints_90d"],
            actual_complaints_90d=ind_data["official_complaints_registered_90d"],
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

        # Add initial prioritized intervention record for critical / high communities
        if final_risk > 50.0:
            intervention = InterventionRecord(
                community_id=community.id,
                title=f"Emergency {xai_res['top_driver_name']} Stabilization",
                sector=xai_res["top_driver_name"],
                priority="Critical" if final_risk > 75 else "High",
                estimated_budget=random.choice([180000.0, 320000.0, 450000.0]),
                lead_department="Municipal Infrastructure & Health Taskforce",
                status="Identified",
                target_completion_days=25,
                impact_projection=f"Targeting a 40-60% reduction in {xai_res['top_driver_name']} distress index.",
                notes=xai_res["recommended_action"]
            )
            db.add(intervention)

        # Ground verification feedback
        feedback = CommunityFeedback(
            community_id=community.id,
            source_type="NGO Ground Truth Audit",
            issue_category=xai_res["top_driver_name"],
            severity="Severe" if final_risk > 60 else "Moderate",
            field_notes=f"Field survey confirmed acute underreporting. Residents cited lack of digital access and skepticism of municipal portals.",
            verified=True
        )
        db.add(feedback)

    db.commit()
    print("Database seeded with benchmark communities, indicators, predictions, and interventions.")
