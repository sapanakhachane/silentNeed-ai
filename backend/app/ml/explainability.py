from typing import Dict, Any, List

class ExplainableAIModule:
    """
    Transparent Explainable AI (XAI) engine for SilentNeed AI.
    Explains WHY an area is flagged as potentially underserved or invisible:
    - Feature contribution rankings
    - Suppression mechanism insights
    - Clear, auditable natural language executive briefing
    - Targeted emergency/policy recommendations
    """

    def generate_explanation(
        self,
        community_name: str,
        risk_score: float,
        risk_tier: str,
        silent_need_index: float,
        expected_complaints: float,
        actual_complaints: int,
        gap_ratio: float,
        sectors: Dict[str, float],
        is_anomaly: bool,
        anomaly_type: str,
        data: Dict[str, Any],
        fallback_used: bool
    ) -> Dict[str, Any]:
        """
        Synthesizes human-readable explanations and feature contribution breakdown.
        """
        # 1. Feature contribution ranking
        sector_benchmarks = {
            "water_risk": ("Drinking Water Quality & Access", 25.0),
            "health_risk": ("Healthcare Accessibility & PHC Proximity", 20.0),
            "sanitation_risk": ("Sanitation & Solid Waste Management", 25.0),
            "flooding_risk": ("Drainage Flow & Flood Inundation", 20.0),
            "power_risk": ("Electrical Grid Stability & Outages", 20.0),
            "infra_risk": ("Road Network & Transit Access", 25.0),
            "admin_access_risk": ("Civic Centers & Administrative Friction", 25.0)
        }

        contributions: List[Dict[str, Any]] = []
        for key, (label, benchmark) in sector_benchmarks.items():
            val = sectors.get(key, 0.0)
            delta = val - benchmark
            if delta > 0:
                direction = "increases_risk"
                impact_pct = f"+{round(delta * 0.42, 1)}%"
            else:
                direction = "lowers_risk"
                impact_pct = f"{round(delta * 0.25, 1)}%"

            contributions.append({
                "factor": label,
                "score": round(val, 1),
                "benchmark": benchmark,
                "impact": impact_pct,
                "direction": direction,
                "raw_key": key
            })

        # Sort highest distress first
        contributions.sort(key=lambda x: x["score"], reverse=True)

        # 2. Identify top primary drivers
        top_driver = contributions[0]
        second_driver = contributions[1] if len(contributions) > 1 else None

        # 3. Suppression drivers
        dig_lit = float(data.get("digital_literacy_rate", 35.0))
        gov_dist = float(data.get("distance_to_gov_office_km", 8.0))
        net_pen = float(data.get("internet_penetration_rate", 30.0))

        suppression_reasons = []
        if dig_lit < 40.0:
            suppression_reasons.append(f"severe digital literacy deficit ({dig_lit:.1f}%)")
        if gov_dist > 6.0:
            suppression_reasons.append(f"geographic distance to civic grievance offices ({gov_dist:.1f} km away)")
        if net_pen < 35.0:
            suppression_reasons.append(f"low smartphone/internet connectivity ({net_pen:.1f}%)")
        if not suppression_reasons:
            suppression_reasons.append("bureaucratic fatalism or lack of designated local grievance kiosks")

        suppression_str = ", ".join(suppression_reasons)

        # 4. Generate Narrative
        narrative_parts = []
        narrative_parts.append(
            f"**Community Diagnostic for {community_name}:** "
            f"Evaluated at **{risk_tier.upper()} RISK** (Distress Score: {risk_score:.1f}/100) "
            f"with a **Silent Need Index of {silent_need_index:.1f}/100**."
        )

        narrative_parts.append(
            f"**The Complaint Paradox:** Official registries reflect only **{actual_complaints} registered complaints** "
            f"in the past 90 days, despite algorithmic expectation of **{expected_complaints:.0f} complaints** "
            f"(a {gap_ratio:.1f}x reporting deficit). This reporting vacuum is exacerbated by {suppression_str}."
        )

        narrative_parts.append(
            f"**Primary Distress Drivers:** The most acute vulnerability is **{top_driver['factor']}** "
            f"(severity: {top_driver['score']:.1f}/100)"
        )
        if second_driver and second_driver["score"] > 45.0:
            narrative_parts.append(
                f", followed by **{second_driver['factor']}** (severity: {second_driver['score']:.1f}/100)."
            )
        else:
            narrative_parts.append(".")

        if is_anomaly:
            narrative_parts.append(
                f" **Anomaly Flagged:** Scikit-learn Anomaly Detector classified this zone as '{anomaly_type}'."
            )

        if fallback_used:
            narrative_parts.append(
                " *Notice: Transparent rule-based calibration was engaged to audit and stabilize the prediction.*"
            )

        full_narrative = " ".join(narrative_parts)

        # 5. Targeted Actionable Recommendation
        rec = self._formulate_recommendation(top_driver["raw_key"], top_driver["score"], gap_ratio)

        return {
            "top_contributing_factors": contributions[:5],
            "explanation_narrative": full_narrative,
            "recommended_action": rec,
            "top_driver_name": top_driver["factor"],
            "top_driver_score": top_driver["score"]
        }

    def _formulate_recommendation(self, top_key: str, score: float, gap_ratio: float) -> str:
        recommendations = {
            "water_risk": "Deploy mobile drinking water purification trucks and sample community borewells. Dispatch civic ombudsman to verify piped line leakages.",
            "health_risk": "Commission bi-weekly mobile health clinic vans and organize an on-site child immunization & maternal care camp.",
            "sanitation_risk": "Increase municipal garbage collection to 3x/week and clear open solid waste dumpsites adjacent to residential settlements.",
            "flooding_risk": "Execute urgent mechanical desilting of major stormwater culverts and reinforce low-lying bunds prior to monsoon rains.",
            "power_risk": "Replace blown distribution transformers and repair non-functioning solar/grid streetlights along main pedestrian corridors.",
            "infra_risk": "Patch critical arterial access roads and coordinate with public transit authority for mini-feeder bus routes.",
            "admin_access_risk": "Set up a weekly mobile Common Service Centre (CSC) camp and offline paper/toll-free grievance drop box."
        }
        base_rec = recommendations.get(top_key, "Conduct inter-departmental field verification audit.")
        if gap_ratio > 3.0:
            base_rec += " Simultaneously, establish a neighborhood citizen assistance kiosk to bridge the 3x+ complaint reporting gap."
        return base_rec

# Global singleton
explainable_ai = ExplainableAIModule()
