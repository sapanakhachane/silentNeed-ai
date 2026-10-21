from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Community, ServiceIndicator
from app.services.weather import get_open_meteo_weather, calculate_weather_service_impact

router = APIRouter(prefix="/weather", tags=["Open-Meteo Weather Integration"])

@router.get("/community/{community_id}")
async def get_community_weather_impact(community_id: int, db: Session = Depends(get_db)):
    """
    Fetches real-time Open-Meteo meteorological readings for the community's coordinates
    and evaluates dynamic weather-induced infrastructure vulnerabilities.
    """
    comm = db.query(Community).filter(Community.id == community_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    latest_ind = (
        db.query(ServiceIndicator)
        .filter(ServiceIndicator.community_id == comm.id)
        .order_by(ServiceIndicator.recorded_date.desc())
        .first()
    )

    # Fetch live Open-Meteo weather
    weather = await get_open_meteo_weather(comm.latitude, comm.longitude)

    # Indicators dict
    ind_dict = {}
    if latest_ind:
        ind_dict = {
            "drainage_blockage_percentage": latest_ind.drainage_blockage_percentage,
            "flood_vulnerability_index": latest_ind.flood_vulnerability_index,
            "water_access_hours_per_day": latest_ind.water_access_hours_per_day,
            "water_contamination_index": latest_ind.water_contamination_index,
            "power_outage_hours_per_week": latest_ind.power_outage_hours_per_week
        }

    impact = calculate_weather_service_impact(weather, ind_dict)

    return {
        "community_id": comm.id,
        "community_name": comm.name,
        "coordinates": {"latitude": comm.latitude, "longitude": comm.longitude},
        "weather": weather,
        "meteorological_impact": impact
    }

@router.get("/city-summary")
async def get_city_weather_summary(db: Session = Depends(get_db)):
    """
    Correlates Open-Meteo weather across all monitored settlements to detect city-wide weather crises.
    """
    communities = db.query(Community).all()
    if not communities:
        return {"monitored_zones": 0, "active_weather_alerts": []}

    # Reference coordinates (centroid or first community)
    ref_lat = communities[0].latitude
    ref_lon = communities[0].longitude

    city_weather = await get_open_meteo_weather(ref_lat, ref_lon)
    
    total_alerts = []
    vulnerable_communities = []

    for comm in communities:
        latest_ind = (
            db.query(ServiceIndicator)
            .filter(ServiceIndicator.community_id == comm.id)
            .order_by(ServiceIndicator.recorded_date.desc())
            .first()
        )
        if latest_ind:
            ind_dict = {
                "drainage_blockage_percentage": latest_ind.drainage_blockage_percentage,
                "flood_vulnerability_index": latest_ind.flood_vulnerability_index,
                "water_access_hours_per_day": latest_ind.water_access_hours_per_day,
                "water_contamination_index": latest_ind.water_contamination_index,
                "power_outage_hours_per_week": latest_ind.power_outage_hours_per_week
            }
            impact = calculate_weather_service_impact(city_weather, ind_dict)
            if impact["active_hazard_alerts"]:
                vulnerable_communities.append({
                    "community_id": comm.id,
                    "name": comm.name,
                    "zone_type": comm.zone_type,
                    "weather_risk_modifier": impact["weather_risk_modifier"],
                    "alerts": impact["active_hazard_alerts"]
                })
                total_alerts.extend(impact["active_hazard_alerts"])

    return {
        "open_meteo_current": city_weather.get("current"),
        "open_meteo_daily_forecast": city_weather.get("daily_forecast"),
        "total_communities_at_weather_risk": len(vulnerable_communities),
        "vulnerable_communities": vulnerable_communities,
        "total_active_alerts_count": len(total_alerts)
    }
