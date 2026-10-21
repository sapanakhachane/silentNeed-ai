import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

class PublicServiceRiskModel:
    """
    ML and Rule-Based Hybrid Estimator for Public Service Distress.
    Predicts community-level distress (0 to 100) across 7 critical sectors:
    1. Drinking Water
    2. Road & Transportation Infrastructure
    3. Sanitation & Waste Management
    4. Power & Electricity Grid
    5. Healthcare Accessibility
    6. Drainage & Flood Vulnerability
    7. Administrative & Civic Service Access
    """
    def __init__(self):
        self.rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.gb_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.is_trained = False
        self.feature_names = [
            "water_access_hours_per_day",
            "water_contamination_index",
            "road_condition_index",
            "pothole_density_per_km",
            "public_transit_access_score",
            "garbage_collection_per_week",
            "waste_overflow_rate",
            "open_drainage_percentage",
            "power_outage_hours_per_week",
            "voltage_fluctuation_severity",
            "street_light_operational_pct",
            "distance_to_nearest_phc_km",
            "doctor_availability_score",
            "infant_immunization_rate",
            "flood_vulnerability_index",
            "drainage_blockage_percentage",
            "waterlogging_days_per_year",
            "ration_shop_queue_hours",
            "csc_service_center_dist_km",
            "median_income_monthly",
            "digital_literacy_rate",
            "internet_penetration_rate",
            "distance_to_gov_office_km"
        ]
        self._bootstrap_model()

    def _calculate_sector_distress(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Calculates normalized distress scores (0 to 100) per sector."""
        # 1. Water Distress (Inverted access hours + contamination)
        hrs = max(0.1, min(24.0, float(data.get("water_access_hours_per_day", 4.0))))
        hrs_penalty = max(0.0, 100.0 - (hrs / 24.0 * 100.0))
        contam = float(data.get("water_contamination_index", 50.0))
        water_risk = round(0.55 * contam + 0.45 * hrs_penalty, 2)

        # 2. Road Infrastructure Distress (Inverted road condition + pothole + low transit)
        road_cond = float(data.get("road_condition_index", 50.0))
        road_inv = max(0.0, 100.0 - road_cond)
        potholes = min(100.0, float(data.get("pothole_density_per_km", 5.0)) * 5.0)
        transit_inv = max(0.0, 100.0 - float(data.get("public_transit_access_score", 50.0)))
        infra_risk = round(0.45 * road_inv + 0.35 * potholes + 0.20 * transit_inv, 2)

        # 3. Sanitation Distress (Low collection + waste overflow + open drains)
        coll = float(data.get("garbage_collection_per_week", 2.0))
        coll_penalty = max(0.0, 100.0 - (coll / 7.0 * 100.0))
        overflow = float(data.get("waste_overflow_rate", 50.0))
        drains = float(data.get("open_drainage_percentage", 50.0))
        sanitation_risk = round(0.35 * coll_penalty + 0.35 * overflow + 0.30 * drains, 2)

        # 4. Electricity Distress (Outage hours + voltage fluctuations + dark streets)
        outages = min(100.0, float(data.get("power_outage_hours_per_week", 10.0)) * 1.5)
        voltage = float(data.get("voltage_fluctuation_severity", 40.0))
        lights_inv = max(0.0, 100.0 - float(data.get("street_light_operational_pct", 60.0)))
        power_risk = round(0.45 * outages + 0.30 * voltage + 0.25 * lights_inv, 2)

        # 5. Healthcare Isolation Distress (PHC distance + low doctor availability + low immunization)
        phc_dist = min(100.0, float(data.get("distance_to_nearest_phc_km", 5.0)) * 6.5)
        doc_inv = max(0.0, 100.0 - float(data.get("doctor_availability_score", 50.0)))
        imm_inv = max(0.0, 100.0 - float(data.get("infant_immunization_rate", 70.0)))
        health_risk = round(0.40 * phc_dist + 0.35 * doc_inv + 0.25 * imm_inv, 2)

        # 6. Drainage & Flooding Distress (Vulnerability + blockage + waterlogged days)
        flood_vuln = float(data.get("flood_vulnerability_index", 50.0))
        blockage = float(data.get("drainage_blockage_percentage", 50.0))
        waterlog = min(100.0, float(data.get("waterlogging_days_per_year", 10.0)) * 1.8)
        flooding_risk = round(0.40 * flood_vuln + 0.35 * blockage + 0.25 * waterlog, 2)

        # 7. Administrative & Civic Service Access Distress
        queue = min(100.0, float(data.get("ration_shop_queue_hours", 2.0)) * 18.0)
        csc_dist = min(100.0, float(data.get("csc_service_center_dist_km", 3.0)) * 10.0)
        gov_dist = min(100.0, float(data.get("distance_to_gov_office_km", 5.0)) * 7.0)
        admin_access_risk = round(0.35 * queue + 0.35 * csc_dist + 0.30 * gov_dist, 2)

        return {
            "water_risk": min(100.0, max(0.0, water_risk)),
            "infra_risk": min(100.0, max(0.0, infra_risk)),
            "sanitation_risk": min(100.0, max(0.0, sanitation_risk)),
            "power_risk": min(100.0, max(0.0, power_risk)),
            "health_risk": min(100.0, max(0.0, health_risk)),
            "flooding_risk": min(100.0, max(0.0, flooding_risk)),
            "admin_access_risk": min(100.0, max(0.0, admin_access_risk))
        }

    def calculate_rule_based_risk(self, data: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        """
        Transparent rule-based scoring engine used as primary benchmark and fallback.
        Weights reflect public health and humanitarian necessity:
        Water (22%), Health (18%), Sanitation (18%), Drainage/Flooding (15%), 
        Power (12%), Road Infra (10%), Administrative Access (5%).
        """
        sectors = self._calculate_sector_distress(data)
        
        weighted_score = (
            sectors["water_risk"] * 0.22 +
            sectors["health_risk"] * 0.18 +
            sectors["sanitation_risk"] * 0.18 +
            sectors["flooding_risk"] * 0.15 +
            sectors["power_risk"] * 0.12 +
            sectors["infra_risk"] * 0.10 +
            sectors["admin_access_risk"] * 0.05
        )
        return round(min(100.0, max(0.0, weighted_score)), 2), sectors

    def _bootstrap_model(self):
        """Train baseline ML models on synthetic multi-indicator distributions."""
        np.random.seed(42)
        n_samples = 1200
        
        synthetic_records = []
        target_risks = []

        for _ in range(n_samples):
            row = {
                "water_access_hours_per_day": np.random.uniform(0.5, 24.0),
                "water_contamination_index": np.random.uniform(5.0, 95.0),
                "road_condition_index": np.random.uniform(10.0, 95.0),
                "pothole_density_per_km": np.random.uniform(0.5, 25.0),
                "public_transit_access_score": np.random.uniform(10.0, 95.0),
                "garbage_collection_per_week": np.random.uniform(0.1, 7.0),
                "waste_overflow_rate": np.random.uniform(5.0, 95.0),
                "open_drainage_percentage": np.random.uniform(5.0, 95.0),
                "power_outage_hours_per_week": np.random.uniform(1.0, 65.0),
                "voltage_fluctuation_severity": np.random.uniform(5.0, 90.0),
                "street_light_operational_pct": np.random.uniform(5.0, 95.0),
                "distance_to_nearest_phc_km": np.random.uniform(0.5, 20.0),
                "doctor_availability_score": np.random.uniform(5.0, 95.0),
                "infant_immunization_rate": np.random.uniform(30.0, 98.0),
                "flood_vulnerability_index": np.random.uniform(5.0, 95.0),
                "drainage_blockage_percentage": np.random.uniform(5.0, 95.0),
                "waterlogging_days_per_year": np.random.uniform(0.0, 60.0),
                "ration_shop_queue_hours": np.random.uniform(0.2, 8.0),
                "csc_service_center_dist_km": np.random.uniform(0.5, 15.0),
                "median_income_monthly": np.random.uniform(5000, 45000),
                "digital_literacy_rate": np.random.uniform(10.0, 90.0),
                "internet_penetration_rate": np.random.uniform(10.0, 95.0),
                "distance_to_gov_office_km": np.random.uniform(1.0, 25.0),
            }
            # True risk has non-linear compounding interactions (e.g. flooding + contaminated water = epidemic risk)
            rule_score, _ = self.calculate_rule_based_risk(row)
            compound_effect = 0.0
            if row["flood_vulnerability_index"] > 70 and row["water_contamination_index"] > 65:
                compound_effect += 8.5
            if row["distance_to_nearest_phc_km"] > 10 and row["road_condition_index"] < 30:
                compound_effect += 7.0
            
            final_target = min(100.0, max(0.0, rule_score + compound_effect + np.random.normal(0, 1.5)))
            
            synthetic_records.append([row[k] for k in self.feature_names])
            target_risks.append(final_target)

        X = np.array(synthetic_records)
        y = np.array(target_risks)
        
        self.rf_model.fit(X, y)
        self.gb_model.fit(X, y)
        self.is_trained = True

    def predict_risk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs ML ensemble risk estimation with rule-based verification & fallback.
        Returns final risk score, sector breakdown, tier, and whether fallback was engaged.
        """
        rule_score, sectors = self.calculate_rule_based_risk(data)
        
        fallback_used = False
        confidence = 0.94

        try:
            if not self.is_trained:
                self._bootstrap_model()

            feature_vec = np.array([[float(data.get(k, 50.0)) for k in self.feature_names]])
            rf_pred = float(self.rf_model.predict(feature_vec)[0])
            gb_pred = float(self.gb_model.predict(feature_vec)[0])
            
            # Ensemble average
            ml_score = round(0.6 * rf_pred + 0.4 * gb_pred, 2)
            
            # Sanity guardrail: if ML deviates > 25 points from explainable rule score, blend toward rule
            if abs(ml_score - rule_score) > 25:
                final_score = round(0.4 * ml_score + 0.6 * rule_score, 2)
                fallback_used = True
                confidence = 0.81
            else:
                final_score = round(0.7 * ml_score + 0.3 * rule_score, 2)
        except Exception:
            ml_score = rule_score
            final_score = rule_score
            fallback_used = True
            confidence = 0.75

        final_score = min(100.0, max(0.0, final_score))

        # Risk tiering
        if final_score >= 75.0:
            risk_tier = "Critical"
        elif final_score >= 55.0:
            risk_tier = "High"
        elif final_score >= 35.0:
            risk_tier = "Moderate"
        else:
            risk_tier = "Low"

        return {
            "ml_risk_score": ml_score,
            "rule_risk_score": rule_score,
            "final_risk_score": final_score,
            "risk_tier": risk_tier,
            "sectors": sectors,
            "confidence_level": confidence,
            "fallback_used": fallback_used
        }

# Global singleton
risk_estimator = PublicServiceRiskModel()
