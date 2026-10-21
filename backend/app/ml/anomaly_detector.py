import numpy as np
from typing import Dict, Any, Tuple
from sklearn.ensemble import IsolationForest

class ServiceAnomalyDetector:
    """
    Detects severe divergences and paradoxical patterns in public service reporting.
    Identifies communities that defy normal complaint-to-distress curves.
    """
    def __init__(self):
        self.iso_forest = IsolationForest(
            n_estimators=100, 
            contamination=0.15, 
            random_state=42
        )
        self.is_fitted = False
        self._fit_detector()

    def _fit_detector(self):
        """Fit isolation forest on synthetic civic behavior distributions."""
        np.random.seed(42)
        n_samples = 1000

        # Features: [Distress Score, Official Complaints, Digital Penetration, PHC Distance, Water Contamination]
        normal_data = []
        for _ in range(n_samples):
            distress = np.random.uniform(10.0, 90.0)
            # In normal communities, higher distress tends to generate more complaints
            expected_complaints = (distress / 100.0) * np.random.uniform(20.0, 60.0)
            dig_lit = np.random.uniform(20.0, 90.0)
            phc = np.random.uniform(1.0, 15.0)
            water = np.random.uniform(10.0, 90.0)
            normal_data.append([distress, expected_complaints, dig_lit, phc, water])

        # Synthesize typical anomalous clusters (the silent needles in haystack)
        anomaly_samples = []
        for _ in range(150):
            high_distress = np.random.uniform(75.0, 98.0)
            near_zero_complaints = np.random.uniform(0.0, 3.0) # Suppression anomaly
            low_dig_lit = np.random.uniform(5.0, 25.0)
            far_phc = np.random.uniform(12.0, 25.0)
            bad_water = np.random.uniform(75.0, 98.0)
            anomaly_samples.append([high_distress, near_zero_complaints, low_dig_lit, far_phc, bad_water])

        X = np.vstack([normal_data, anomaly_samples])
        self.iso_forest.fit(X)
        self.is_fitted = True

    def detect_anomaly(
        self, 
        risk_score: float, 
        actual_complaints: int, 
        expected_complaints: float, 
        data: Dict[str, Any]
    ) -> Tuple[bool, float, str]:
        """
        Evaluates whether a community exhibits an anomaly in civic service or reporting behavior.
        Returns: (is_anomaly, anomaly_score_0_to_1, anomaly_type)
        """
        if not self.is_fitted:
            self._fit_detector()

        dig_lit = float(data.get("digital_literacy_rate", 35.0))
        phc = float(data.get("distance_to_nearest_phc_km", 6.0))
        water = float(data.get("water_contamination_index", 50.0))

        feat_vec = np.array([[risk_score, float(actual_complaints), dig_lit, phc, water]])
        
        # Scikit-learn: -1 for outlier, 1 for inlier
        raw_pred = self.iso_forest.predict(feat_vec)[0]
        # decision_function: lower means more abnormal
        dec_score = self.iso_forest.decision_function(feat_vec)[0]
        
        # Normalize anomaly score (0 = perfectly normal, 1 = extreme outlier)
        norm_anomaly_score = round(max(0.0, min(1.0, 0.5 - (dec_score * 1.5))), 3)

        # Domain-specific categorizer
        is_outlier = (raw_pred == -1) or (norm_anomaly_score > 0.62)
        anomaly_type = "Normal Reporting Distribution"

        if risk_score >= 65.0 and actual_complaints <= 5:
            is_outlier = True
            norm_anomaly_score = max(norm_anomaly_score, 0.88)
            anomaly_type = "Severe Civic Silence (Critical Distress, Zero Escalation)"
        elif actual_complaints > 45 and risk_score < 30.0:
            is_outlier = True
            norm_anomaly_score = max(norm_anomaly_score, 0.72)
            anomaly_type = "Hyper-Complaining Baseline (Low Distress, Oversaturated Tickets)"
        elif water > 80.0 and actual_complaints == 0:
            is_outlier = True
            norm_anomaly_score = max(norm_anomaly_score, 0.93)
            anomaly_type = "Hazardous Water Outlier (Toxic Index with Complete Civic Blindspot)"
        elif is_outlier:
            anomaly_type = "Multivariate Infrastructure Disconnect"

        return is_outlier, norm_anomaly_score, anomaly_type

# Global singleton
service_anomaly_detector = ServiceAnomalyDetector()
