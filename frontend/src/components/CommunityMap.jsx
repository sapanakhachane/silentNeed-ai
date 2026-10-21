import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Activity, Droplets, Zap, ShieldAlert, ChevronRight, Layers, 
  HeartPulse, Building, MapPin, Eye, Compass
} from 'lucide-react';
import { fetchCommunityOSM } from '../services/api';

// Component to dynamically re-center when selected community changes
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Generate stylish SVG Leaflet Icons for Communities
function createCustomPin(tier, silentNeedIndex, isAnomaly) {
  let color = '#10b981'; // Low
  let bgRgba = 'rgba(16, 185, 129, 0.2)';

  if (tier === 'Critical' || silentNeedIndex >= 70) {
    color = '#ef4444';
    bgRgba = 'rgba(239, 68, 68, 0.25)';
  } else if (tier === 'High' || silentNeedIndex >= 50) {
    color = '#f97316';
    bgRgba = 'rgba(249, 115, 22, 0.25)';
  } else if (tier === 'Moderate' || silentNeedIndex >= 30) {
    color = '#facc15';
    bgRgba = 'rgba(250, 204, 21, 0.25)';
  }

  const pulseClass = (tier === 'Critical' || isAnomaly) ? 'animate-ping-slow' : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${bgRgba};" class="${pulseClass}"></div>
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #0f172a; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
          <span style="font-weight: 800; font-size: 11px; color: ${color}; font-family: monospace;">
            ${Math.round(silentNeedIndex)}
          </span>
        </div>
        ${isAnomaly ? `
          <div style="position: absolute; top: 0px; right: 0px; width: 14px; height: 14px; border-radius: 50%; background: #e11d48; border: 2px solid #0f172a; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 8px; color: #fff; font-weight: bold;">!</span>
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -20]
  });
}

// Generate OpenStreetMap Amenity POI Icons (Water Tap, Clinic, Public Building)
function createOsmPoiIcon(type) {
  let symbol = '💧';
  let borderColor = '#0284c7';

  if (type === 'clinic' || type === 'hospital') {
    symbol = '🏥';
    borderColor = '#10b981';
  } else if (type === 'public_building' || type === 'townhall') {
    symbol = '🏛️';
    borderColor = '#f59e0b';
  } else if (type === 'waste_disposal' || type === 'waste_basket') {
    symbol = '🗑️';
    borderColor = '#8b5cf6';
  }

  return L.divIcon({
    className: 'osm-poi-marker',
    html: `
      <div style="width: 24px; height: 24px; border-radius: 50%; background: #0f172a; border: 2px solid ${borderColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.5); font-size: 11px;">
        ${symbol}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

export default function CommunityMap({ 
  communities = [], 
  selectedCommunity, 
  onSelectCommunity, 
  activeFilter = "all" 
}) {
  const defaultCenter = [28.625, 77.20]; // Reference coords
  const mapCenter = useMemo(() => {
    if (selectedCommunity && selectedCommunity.latitude && selectedCommunity.longitude) {
      return [selectedCommunity.latitude, selectedCommunity.longitude];
    }
    return defaultCenter;
  }, [selectedCommunity]);

  // OpenStreetMap Tile Layer Options
  const [osmLayer, setOsmLayer] = useState('osm-standard'); // 'osm-standard', 'osm-hot', 'osm-voyager'
  const [showOsmPois, setShowOsmPois] = useState(true);
  const [osmPois, setOsmPois] = useState([]);

  // Fetch live OpenStreetMap POIs when selected community changes
  useEffect(() => {
    if (selectedCommunity?.id) {
      fetchCommunityOSM(selectedCommunity.id)
        .then(data => {
          if (data?.osm_infrastructure_audit?.mapped_pois) {
            setOsmPois(data.osm_infrastructure_audit.mapped_pois);
          }
        })
        .catch(err => console.error("Error loading OSM POIs:", err));
    }
  }, [selectedCommunity?.id]);

  // Filtered markers based on user view toggle
  const displayedCommunities = useMemo(() => {
    if (activeFilter === "critical") {
      return communities.filter(c => c.latest_prediction?.risk_tier === "Critical");
    }
    if (activeFilter === "anomalies") {
      return communities.filter(c => c.latest_prediction?.is_anomaly);
    }
    if (activeFilter === "silent_severe") {
      return communities.filter(c => (c.latest_prediction?.silent_need_index || 0) >= 65);
    }
    return communities;
  }, [communities, activeFilter]);

  // OSM Tile URL Selector
  const currentTileConfig = useMemo(() => {
    switch (osmLayer) {
      case 'osm-hot':
        return {
          url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>'
        };
      case 'osm-standard':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
    }
  }, [osmLayer]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/80">
      
      {/* Top Floating Bar: OpenStreetMap Layer & POI Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-xl text-xs">
        <span className="flex items-center gap-1.5 font-bold text-white">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          OpenStreetMap (OSM)
        </span>
        <span className="text-slate-600">|</span>

        {/* OSM Layer Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setOsmLayer('osm-standard')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
              osmLayer === 'osm-standard' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            OSM Standard
          </button>
          <button
            onClick={() => setOsmLayer('osm-hot')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
              osmLayer === 'osm-hot' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Humanitarian OpenStreetMap Team (Disaster & Informal Settlements)"
          >
            OSM Humanitarian (HOT)
          </button>
        </div>

        <span className="text-slate-600">|</span>

        {/* Toggle OSM Amenity POIs */}
        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showOsmPois}
            onChange={(e) => setShowOsmPois(e.target.checked)}
            className="rounded accent-cyan-500 cursor-pointer"
          />
          <span>Show OSM Public Amenities</span>
        </label>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1.5 pointer-events-auto">
        <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>OpenStreetMap Radar</span>
          <span className="text-[9px] text-cyan-400 font-mono">Live</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-500/30"></span>
          <span className="text-slate-300 text-[11px]">Critical Invisible Need (70 - 100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-slate-300 text-[11px]">High Disparity Zone (50 - 69)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
          <span className="text-slate-300 text-[11px]">Moderate Gap (30 - 49)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 text-[11px]">Equitable / Low Distress (&lt; 30)</span>
        </div>

        {/* POI Key */}
        <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>💧 OSM Water</span>
          <span>🏥 OSM Clinic</span>
          <span>🏛️ OSM Civic</span>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapViewUpdater center={mapCenter} zoom={selectedCommunity ? 13 : 11} />
        
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          key={osmLayer}
          attribution={currentTileConfig.attribution}
          url={currentTileConfig.url}
          maxZoom={19}
        />

        {/* 1. Community Distress Pins */}
        {displayedCommunities.map((comm) => {
          const pred = comm.latest_prediction || {};
          const tier = pred.risk_tier || 'Moderate';
          const sni = pred.silent_need_index || 0;
          const isAnomaly = pred.is_anomaly || false;
          const gapRatio = pred.complaint_gap_ratio || 1.0;
          const actualComplaints = pred.actual_complaints_90d ?? comm.latest_indicator?.official_complaints_registered_90d ?? 0;
          const expectedComplaints = pred.expected_complaints_90d || 0;

          const customIcon = createCustomPin(tier, sni, isAnomaly);

          return (
            <React.Fragment key={comm.id}>
              {/* Radius aura highlighting zone impact */}
              <CircleMarker
                center={[comm.latitude, comm.longitude]}
                radius={sni > 70 ? 28 : 18}
                pathOptions={{
                  color: tier === 'Critical' ? '#ef4444' : tier === 'High' ? '#f97316' : '#10b981',
                  fillColor: tier === 'Critical' ? '#ef4444' : tier === 'High' ? '#f97316' : '#10b981',
                  fillOpacity: 0.12,
                  weight: 1,
                  dashArray: sni > 70 ? '3, 6' : undefined
                }}
              />

              <Marker
                position={[comm.latitude, comm.longitude]}
                icon={customIcon}
                eventHandlers={{
                  click: () => onSelectCommunity(comm)
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[240px] text-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-white">{comm.name}</h4>
                        <span className="text-[11px] text-slate-400">{comm.zone_type} &bull; {comm.ward_number}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tier === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        tier === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {tier}
                      </span>
                    </div>

                    {/* Complaint Paradox Box */}
                    <div className="bg-slate-800/80 rounded-lg p-2.5 mb-2.5 border border-slate-700/60 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Silent Need Index:</span>
                        <span className="font-bold text-cyan-400 text-sm">{sni.toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Registered Complaints:</span>
                        <span className="font-bold text-amber-300">{actualComplaints} in 90d</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Expected Complaints:</span>
                        <span className="font-semibold text-slate-200">{Math.round(expectedComplaints)}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-700/50 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Reporting Deficit:</span>
                        <span className="font-mono font-bold text-red-400">{gapRatio.toFixed(1)}x Gap</span>
                      </div>
                    </div>

                    {isAnomaly && (
                      <div className="flex items-start gap-1.5 bg-rose-950/40 border border-rose-800/50 rounded-md p-1.5 mb-2 text-[11px] text-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-400" />
                        <span>Anomaly: {pred.anomaly_type || 'Severe Disconnect'}</span>
                      </div>
                    )}

                    <button
                      onClick={() => onSelectCommunity(comm)}
                      className="w-full flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-1.5 rounded-lg text-xs transition shadow-sm cursor-pointer"
                    >
                      Inspect OSM & AI Diagnostics
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* 2. OpenStreetMap Physical Amenities (POIs) Layer */}
        {showOsmPois && osmPois.map((poi, idx) => (
          <Marker
            key={`poi-${idx}`}
            position={[poi.lat, poi.lon]}
            icon={createOsmPoiIcon(poi.type)}
          >
            <Popup>
              <div className="p-1 text-slate-100 text-xs space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>{poi.name}</span>
                </div>
                <div className="text-[11px] text-cyan-400 uppercase tracking-wider font-mono">
                  OpenStreetMap {poi.type?.replace('_', ' ')}
                </div>
                <div className="text-[10px] text-slate-400">
                  Coordinates: {poi.lat.toFixed(4)}, {poi.lon.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
