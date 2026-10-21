import math
from typing import Dict, Any, Tuple

class ComplaintGapAnalyzer:
    """
    Analyzes the Complaint-Need Paradox:
    Fewer official complaints does NOT mean fewer problems.
    Calculates Expected Complaints vs Actual Complaints, civic suppression factors,
    and computes the Silent Need Index (SNI).
    """

    def calculate_expected_complaints(self, population: int, risk_score: float, data: Dict[str, Any]) -> float:
        """
        Calculates baseline expected complaints in an equitable system.
        Formula:
        Base = (Population / 1000) * (Risk_Score / 100)^1.4 * 12.0
        Plus acute hazard amplifiers (water contamination > 70, flooding > 70).
        """
        pop = max(500, population)
        risk_norm = max(0.0, min(1.0, risk_score / 100.0))
        
        # Power law relationship between infrastructure distress and civic disruption
        base_expected = (pop / 1000.0) * (risk_norm ** 1.35) * 16.0
        
        # Acute hazard multipliers
        water_contam = float(data.get("water_contamination_index", 50.0))
        if water_contam > 70:
            base_expected += (pop / 2000.0) * ((water_contam - 70) / 30.0) * 12.0
            
        flooding = float(data.get("flood_vulnerability_index", 50.0))
        if flooding > 70:
            base_expected += (pop / 2000.0) * ((flooding - 70) / 30.0) * 10.0

        return round(max(1.0, base_expected), 1)

    def calculate_suppression_factor(self, data: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        """
        Calculates civic suppression coefficient (0.0 = no friction, 1.0 = total exclusion).
        Contributing factors:
        - Digital illiteracy (40%)
        - Physical distance to municipal office (30%)
        - Low internet access (20%)
        - Economic marginalization (10%)
        """
        dig_lit = float(data.get("digital_literacy_rate", 35.0))
        dig_friction = max(0.0, (100.0 - dig_lit) / 100.0)

        gov_dist = float(data.get("distance_to_gov_office_km", 8.0))
        dist_friction = min(1.0, gov_dist / 15.0)

        net_pen = float(data.get("internet_penetration_rate", 30.0))
        net_friction = max(0.0, (100.0 - net_pen) / 100.0)

        income = float(data.get("median_income_monthly", 9000.0))
        econ_friction = max(0.0, min(1.0, (25000.0 - income) / 25000.0))

        total_suppression = (
            0.40 * dig_friction +
            0.30 * dist_friction +
            0.20 * net_friction +
            0.10 * econ_friction
        )

        breakdown = {
            "digital_exclusion_pct": round(dig_friction * 100, 1),
            "geographic_isolation_pct": round(dist_friction * 100, 1),
            "connectivity_barrier_pct": round(net_friction * 100, 1),
            "socioeconomic_friction_pct": round(econ_friction * 100, 1)
        }

        return round(min(0.98, max(0.05, total_suppression)), 3), breakdown

    def evaluate_gap(
        self, 
        population: int, 
        risk_score: float, 
        actual_complaints: int, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Runs comprehensive complaint-gap evaluation.
        Produces:
        - expected_complaints_90d
        - complaint_gap_ratio
        - silent_need_index (0 - 100)
        - suppression metrics
        """
        expected = self.calculate_expected_complaints(population, risk_score, data)
        actual = max(0, actual_complaints)
        
        # Ratio of what should have been reported vs what was captured
        gap_ratio = round(expected / max(1.0, float(actual)), 2)
        
        suppression_factor, breakdown = self.calculate_suppression_factor(data)

        # Silent Need Index (SNI):
        # High when Risk Score is high AND complaints are suppressed
        # Formula: SNI = Risk * (0.50 + 0.50 * Suppression_Factor) * log2(1 + Gap_Ratio) scaled
        gap_multiplier = math.log2(1.0 + min(15.0, gap_ratio)) / math.log2(16.0) # 0 to 1
        raw_sni = (risk_score * 0.45) + (risk_score * gap_multiplier * 0.35) + (suppression_factor * 100.0 * 0.20)
        silent_need_index = round(min(100.0, max(0.0, raw_sni)), 1)

        # Categorize silence level
        if silent_need_index >= 75:
            severity_label = "Severe Silent Need (Critically Overlooked Community)"
        elif silent_need_index >= 50:
            severity_label = "Moderate Silent Need (Grievance Underreporting Detected)"
        elif silent_need_index >= 30:
            severity_label = "Balanced Need (Complaints Proportionate to Distress)"
        else:
            severity_label = "Visible or Low Distress Need"

        return {
            "expected_complaints_90d": expected,
            "actual_complaints_90d": actual,
            "complaint_gap_ratio": gap_ratio,
            "silent_need_index": silent_need_index,
            "suppression_factor": suppression_factor,
            "suppression_breakdown": breakdown,
            "severity_label": severity_label
        }

# Global singleton
complaint_gap_analyzer = ComplaintGapAnalyzer()
