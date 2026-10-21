from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Community
from app.services.osm_service import get_osm_reverse_geocode, audit_osm_infrastructure

router = APIRouter(prefix="/osm", tags=["OpenStreetMap (OSM) Integration"])

@router.get("/community/{community_id}")
async def get_community_osm_data(community_id: int, db: Session = Depends(get_db)):
    """
    Fetches real-time OpenStreetMap (OSM) administrative reverse geocoding
    and infrastructure amenity density audit for a community.
    """
    comm = db.query(Community).filter(Community.id == community_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    # 1. Reverse geocode via Nominatim
    geo_details = await get_osm_reverse_geocode(comm.latitude, comm.longitude)

    # 2. Audit public amenities via Overpass
    audit_res = await audit_osm_infrastructure(comm.latitude, comm.longitude, radius_m=1500)

    return {
        "community_id": comm.id,
        "community_name": comm.name,
        "coordinates": {"latitude": comm.latitude, "longitude": comm.longitude},
        "osm_geographic_profile": geo_details,
        "osm_infrastructure_audit": audit_res
    }

@router.get("/city-infrastructure-audit")
async def get_city_osm_audit(db: Session = Depends(get_db)):
    """
    Aggregated OpenStreetMap public amenity density analysis across all monitored settlements.
    """
    communities = db.query(Community).all()
    results = []
    
    total_deserts = 0
    total_water_points = 0
    total_clinics = 0

    for comm in communities:
        audit = await audit_osm_infrastructure(comm.latitude, comm.longitude, radius_m=1500)
        counts = audit["amenity_counts"]
        total_water_points += counts["drinking_water"]
        total_clinics += counts["healthcare"]

        if audit["osm_infrastructure_desert_score"] >= 65:
            total_deserts += 1

        results.append({
            "community_id": comm.id,
            "name": comm.name,
            "zone_type": comm.zone_type,
            "latitude": comm.latitude,
            "longitude": comm.longitude,
            "desert_score": audit["osm_infrastructure_desert_score"],
            "desert_label": audit["desert_label"],
            "amenities": counts,
            "pois": audit["mapped_pois"]
        })

    return {
        "total_communities_scanned": len(communities),
        "osm_infrastructure_deserts_count": total_deserts,
        "total_osm_water_points_mapped": total_water_points,
        "total_osm_clinics_mapped": total_clinics,
        "communities": results
    }
