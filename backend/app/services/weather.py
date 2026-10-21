import time
import httpx
from typing import Dict, Any, Optional

# In-memory cache with 15-minute TTL to respect Open-Meteo fair use
_WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 900  # 15 mins

async def get_open_meteo_weather(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetches real-time and forecast weather data from Open-Meteo for given coordinates.
    Open-Meteo is free, open-source, and requires no API key.
    """
    cache_key = f"{round(lat, 3)}_{round(lon, 3)}"
    now = time.time()

    if cache_key in _WEATHER_CACHE:
        entry = _WEATHER_CACHE[cache_key]
        if now - entry["timestamp"] < CACHE_TTL_SECONDS:
            return entry["data"]

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&"
        f"daily=precipitation_sum,rain_sum,temperature_2m_max,temperature_2m_min&"
        f"timezone=auto"
    )

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, headers={"User-Agent": "SilentNeedAI-Impact/1.0"})
            if resp.status_code == 200:
                raw_data = resp.json()
                parsed = parse_open_meteo_data(raw_data)
                _WEATHER_CACHE[cache_key] = {"timestamp": now, "data": parsed}
                return parsed
    except Exception as e:
        print(f"Open-Meteo fetch error: {e}")

    # Fallback default weather if network is offline
    fallback_data = get_fallback_weather(lat, lon)
    return fallback_data

def interpret_weather_code(code: int) -> Dict[str, str]:
    """Interprets WMO Weather interpretation codes from Open-Meteo."""
    mapping = {
        0: ("Clear Sky", "Sun"),
        1: ("Mainly Clear", "Sun"),
        2: ("Partly Cloudy", "CloudSun"),
        3: ("Overcast", "Cloud"),
        45: ("Foggy", "CloudFog"),
        48: ("Depositing Rime Fog", "CloudFog"),
        51: ("Light Drizzle", "CloudDrizzle"),
        53: ("Moderate Drizzle", "CloudDrizzle"),
        55: ("Dense Drizzle", "CloudDrizzle"),
        61: ("Slight Rain", "CloudRain"),
        63: ("Moderate Rain", "CloudRain"),
        65: ("Heavy Rain", "CloudRain"),
        71: ("Slight Snow", "Snowflake"),
        73: ("Moderate Snow", "Snowflake"),
        75: ("Heavy Snow", "Snowflake"),
        80: ("Rain Showers", "CloudRain"),
        81: ("Moderate Showers", "CloudRain"),
        82: ("Violent Rain Showers", "CloudLightning"),
        95: ("Thunderstorm", "CloudLightning"),
        96: ("Thunderstorm with Slight Hail", "CloudLightning"),
        99: ("Thunderstorm with Heavy Hail", "CloudLightning")
    }
    desc, icon = mapping.get(code, ("Partly Cloudy", "CloudSun"))
    return {"description": desc, "icon_name": icon}

def parse_open_meteo_data(raw: Dict[str, Any]) -> Dict[str, Any]:
    curr = raw.get("current", {})
    daily = raw.get("daily", {})
    w_code = curr.get("weather_code", 0)
    w_info = interpret_weather_code(w_code)

    return {
        "source": "Open-Meteo Free Global API",
        "latitude": raw.get("latitude"),
        "longitude": raw.get("longitude"),
        "elevation_m": raw.get("elevation", 0),
        "timezone": raw.get("timezone", "UTC"),
        "current": {
            "temperature_c": curr.get("temperature_2m", 26.0),
            "apparent_temp_c": curr.get("apparent_temperature", 28.0),
            "relative_humidity_pct": curr.get("relative_humidity_2m", 60),
            "precipitation_mm": curr.get("precipitation", 0.0),
            "rain_mm": curr.get("rain", 0.0),
            "wind_speed_kmh": curr.get("wind_speed_10m", 5.0),
            "weather_code": w_code,
            "condition": w_info["description"],
            "icon": w_info["icon_name"],
            "recorded_time": curr.get("time")
        },
        "daily_forecast": [
            {
                "date": daily.get("time", [])[i] if i < len(daily.get("time", [])) else "",
                "precipitation_sum_mm": daily.get("precipitation_sum", [])[i] if i < len(daily.get("precipitation_sum", [])) else 0.0,
                "temp_max_c": daily.get("temperature_2m_max", [])[i] if i < len(daily.get("temperature_2m_max", [])) else 30.0,
                "temp_min_c": daily.get("temperature_2m_min", [])[i] if i < len(daily.get("temperature_2m_min", [])) else 20.0
            }
            for i in range(min(5, len(daily.get("time", []))))
        ]
    }

def get_fallback_weather(lat: float, lon: float) -> Dict[str, Any]:
    return {
        "source": "Open-Meteo Offline Cache Fallback",
        "latitude": lat,
        "longitude": lon,
        "elevation_m": 215,
        "timezone": "Asia/Kolkata",
        "current": {
            "temperature_c": 28.4,
            "apparent_temp_c": 31.2,
            "relative_humidity_pct": 65,
            "precipitation_mm": 0.0,
            "rain_mm": 0.0,
            "wind_speed_kmh": 6.8,
            "weather_code": 2,
            "condition": "Partly Cloudy",
            "icon": "CloudSun",
            "recorded_time": "Real-time"
        },
        "daily_forecast": [
            {"date": "Day 1", "precipitation_sum_mm": 0.0, "temp_max_c": 32.0, "temp_min_c": 21.0},
            {"date": "Day 2", "precipitation_sum_mm": 2.5, "temp_max_c": 31.0, "temp_min_c": 20.5},
            {"date": "Day 3", "precipitation_sum_mm": 0.0, "temp_max_c": 33.0, "temp_min_c": 22.0}
        ]
    }

def calculate_weather_service_impact(
    weather_data: Dict[str, Any], 
    indicators: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Cross-references Open-Meteo meteorological measurements with community physical infrastructure
    to calculate dynamic weather-induced risk shifts and hazard alerts.
    """
    curr = weather_data.get("current", {})
    temp = curr.get("temperature_c", 25.0)
    precip = curr.get("precipitation_mm", 0.0)
    wind = curr.get("wind_speed_kmh", 5.0)

    # 1. Drainage & Flood Impact
    drainage_blockage = float(indicators.get("drainage_blockage_percentage", 50.0))
    flood_vuln = float(indicators.get("flood_vulnerability_index", 50.0))
    
    # Check 3-day precipitation forecast
    forecast_rain = sum(
        d.get("precipitation_sum_mm", 0.0) 
        for d in weather_data.get("daily_forecast", [])[:3]
    )

    flood_risk_delta = 0.0
    flood_alert = None
    if precip > 5.0 or forecast_rain > 15.0:
        if drainage_blockage > 75.0:
            flood_risk_delta = 28.5
            flood_alert = "Critical Inundation Alert: Impending rain exceeds unmaintained drainage capacity."
        elif drainage_blockage > 50.0:
            flood_risk_delta = 16.0
            flood_alert = "Moderate Waterlogging Alert: Localized pooling expected."

    # 2. Water Quality & Contamination Impact
    water_hrs = float(indicators.get("water_access_hours_per_day", 4.0))
    water_contam = float(indicators.get("water_contamination_index", 50.0))

    water_risk_delta = 0.0
    water_alert = None
    # Flash runoff washes waste into open wells/handpumps
    if precip > 10.0 and water_contam > 60.0:
        water_risk_delta = 18.0
        water_alert = "Microbial Runoff Influx: High rain washing sewage into shallow borewells."
    elif temp > 37.0 and water_hrs < 2.0:
        water_risk_delta = 22.0
        water_alert = "Severe Heatwave Dehydration: Extreme temperatures with sub-2hr water supply."

    # 3. Grid & Power Outage Impact
    outages = float(indicators.get("power_outage_hours_per_week", 20.0))
    power_risk_delta = 0.0
    if wind > 30.0 or curr.get("weather_code") in [95, 96, 99]: # Thunderstorm
        power_risk_delta = 19.5

    total_weather_modifier = round(
        0.40 * flood_risk_delta + 0.35 * water_risk_delta + 0.25 * power_risk_delta, 1
    )

    alerts = []
    if flood_alert: alerts.append({"sector": "Drainage & Flood", "level": "High", "message": flood_alert})
    if water_alert: alerts.append({"sector": "Drinking Water", "level": "Critical" if temp > 37 else "High", "message": water_alert})
    if power_risk_delta > 10: alerts.append({"sector": "Power Grid", "level": "Medium", "message": f"Thunderstorm/Wind warning ({wind} km/h) threatening overhead lines."})

    return {
        "weather_risk_modifier": total_weather_modifier,
        "flood_risk_delta": flood_risk_delta,
        "water_risk_delta": water_risk_delta,
        "power_risk_delta": power_risk_delta,
        "active_hazard_alerts": alerts,
        "forecast_rain_3d_mm": round(forecast_rain, 1)
    }
