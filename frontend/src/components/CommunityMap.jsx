import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Activity, Droplets, Zap, ShieldAlert, ChevronRight, Layers, 
  HeartPulse, Building, MapPin, Eye, Compass, Globe, Map as MapIcon
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
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #ffffff; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.35);">
          <span style="font-weight: 800; font-size: 11px; color: ${color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${Math.round(silentNeedIndex)}
          </span>
        </div>
        ${isAnomaly ? `
          <div style="position: absolute; top: 0px; right: 0px; width: 14px; height: 14px; border-radius: 50%; background: #ea4335; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
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

// Generate POI Icons
function createOsmPoiIcon(type) {
  let symbol = '💧';
  let borderColor = '#1a73e8';

  if (type === 'clinic' || type === 'hospital') {
    symbol = '🏥';
    borderColor = '#34a853';
  } else if (type === 'public_building' || type === 'townhall') {
    symbol = '🏛️';
    borderColor = '#fbbc04';
  } else if (type === 'waste_disposal' || type === 'waste_basket') {
    symbol = '🗑️';
    borderColor = '#ea4335';
  }

  return L.divIcon({
    className: 'osm-poi-marker',
    html: `
      <div style="width: 26px; height: 26px; border-radius: 50%; background: #ffffff; border: 2px solid ${borderColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25); font-size: 12px;">
        ${symbol}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
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

  // Google Maps Style Mode: 'google-roadmap', 'google-satellite', 'google-hybrid', 'google-terrain'
  const [mapMode, setMapMode] = useState('google-roadmap');
  const [showPois, setShowPois] = useState(true);
  const [osmPois, setOsmPois] = useState([]);

  // Fetch live infrastructure POIs when selected community changes
  useEffect(() => {
    if (selectedCommunity?.id) {
      fetchCommunityOSM(selectedCommunity.id)
        .then(data => {
          if (data?.osm_infrastructure_audit?.mapped_pois) {
            setOsmPois(data.osm_infrastructure_audit.mapped_pois);
          }
        })
        .catch(err => console.error("Error loading POIs:", err));
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

  // Google Maps Tile Configuration (lyrs: m=roadmap, s=satellite, y=hybrid, p=terrain)
  const currentTileConfig = useMemo(() => {
    switch (mapMode) {
      case 'google-satellite':
        return {
          url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        };
      case 'google-hybrid':
        return {
          url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        };
      case 'google-terrain':
        return {
          url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        };
      case 'google-roadmap':
      default:
        return {
          url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        };
    }
  }, [mapMode]);

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-white google-map-wrapper">
      
      {/* Google Maps Style Layer Switcher (Top-Left) */}
      <div className="absolute top-3 left-3 z-[400] flex items-center bg-white rounded-md shadow-md border border-gray-300 text-xs overflow-hidden font-sans font-medium">
        <button
          type="button"
          onClick={() => setMapMode('google-roadmap')}
          className={`px-3 py-1.5 transition cursor-pointer flex items-center gap-1.5 ${
            mapMode === 'google-roadmap' 
              ? 'bg-blue-600 text-white font-semibold' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          Map
        </button>
        <button
          type="button"
          onClick={() => setMapMode('google-hybrid')}
          className={`px-3 py-1.5 transition cursor-pointer flex items-center gap-1.5 border-l border-gray-200 ${
            mapMode === 'google-hybrid' || mapMode === 'google-satellite'
              ? 'bg-blue-600 text-white font-semibold' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Satellite
        </button>
        <button
          type="button"
          onClick={() => setMapMode('google-terrain')}
          className={`px-3 py-1.5 transition cursor-pointer flex items-center gap-1.5 border-l border-gray-200 ${
            mapMode === 'google-terrain' 
              ? 'bg-blue-600 text-white font-semibold' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Terrain
        </button>
      </div>

      {/* Public Amenities Overlay Toggle (Top-Left secondary) */}
      <div className="absolute top-3 left-64 z-[400] hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md border border-gray-300 text-xs text-gray-700">
        <label className="flex items-center gap-1.5 cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={showPois}
            onChange={(e) => setShowPois(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
          />
          <span>Show Infrastructure POIs</span>
        </label>
      </div>

      {/* Google Watermark (Bottom-Left) */}
      <div className="absolute bottom-2 left-2 z-[400] pointer-events-none select-none flex items-center gap-1 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded shadow-sm text-[12px] font-sans font-bold text-gray-700">
        <span style={{ color: '#4285F4' }}>G</span>
        <span style={{ color: '#EA4335' }}>o</span>
        <span style={{ color: '#FBBC05' }}>o</span>
        <span style={{ color: '#4285F4' }}>g</span>
        <span style={{ color: '#34A853' }}>l</span>
        <span style={{ color: '#EA4335' }}>e</span>
      </div>

      {/* Map Legend Overlay (Bottom-Right) */}
      <div className="absolute bottom-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-gray-300 shadow-lg text-xs space-y-1.5 pointer-events-auto font-sans text-gray-800">
        <div className="font-bold text-gray-900 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>SilentNeed Radar</span>
          <span className="text-[10px] text-blue-600 font-semibold">Google Map View</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-400/40"></span>
          <span className="text-gray-700 text-[11px] font-medium">Critical Invisible Need (70 - 100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-gray-700 text-[11px] font-medium">High Disparity Zone (50 - 69)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
          <span className="text-gray-700 text-[11px] font-medium">Moderate Gap (30 - 49)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-gray-700 text-[11px] font-medium">Equitable / Low Distress (&lt; 30)</span>
        </div>

        {/* POI Key */}
        <div className="pt-1.5 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-600">
          <span>💧 Water Tap</span>
          <span>🏥 Health Clinic</span>
          <span>🏛️ Civic Office</span>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapViewUpdater center={mapCenter} zoom={selectedCommunity ? 13 : 11} />
        
        {/* Google Maps Tile Layer */}
        <TileLayer
          key={mapMode}
          attribution={currentTileConfig.attribution}
          url={currentTileConfig.url}
          subdomains={currentTileConfig.subdomains}
          maxZoom={20}
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
                  color: tier === 'Critical' ? '#ea4335' : tier === 'High' ? '#f97316' : '#34a853',
                  fillColor: tier === 'Critical' ? '#ea4335' : tier === 'High' ? '#f97316' : '#34a853',
                  fillOpacity: 0.15,
                  weight: 1.5,
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
                <Popup className="google-style-popup">
                  <div className="p-1 min-w-[240px] text-gray-800 font-sans">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{comm.name}</h4>
                        <span className="text-[11px] text-gray-500">{comm.zone_type} &bull; {comm.ward_number}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tier === 'Critical' ? 'bg-red-100 text-red-700 border border-red-300' :
                        tier === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                        'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      }`}>
                        {tier}
                      </span>
                    </div>

                    {/* Complaint Paradox Box */}
                    <div className="bg-gray-50 rounded-lg p-2.5 mb-2.5 border border-gray-200 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Silent Need Index:</span>
                        <span className="font-bold text-blue-600 text-sm">{sni.toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Registered Complaints:</span>
                        <span className="font-bold text-amber-600">{actualComplaints} in 90d</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Expected Complaints:</span>
                        <span className="font-semibold text-gray-800">{Math.round(expectedComplaints)}</span>
                      </div>
                      <div className="pt-1 border-t border-gray-200 flex justify-between items-center text-[11px]">
                        <span className="text-gray-600">Reporting Deficit:</span>
                        <span className="font-mono font-bold text-red-600">{gapRatio.toFixed(1)}x Gap</span>
                      </div>
                    </div>

                    {isAnomaly && (
                      <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-md p-1.5 mb-2 text-[11px] text-red-700">
                        <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-600" />
                        <span>Anomaly: {pred.anomaly_type || 'Severe Disconnect'}</span>
                      </div>
                    )}

                    <button
                      onClick={() => onSelectCommunity(comm)}
                      className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 rounded-lg text-xs transition shadow-sm cursor-pointer"
                    >
                      Inspect Google Map & AI Diagnostics
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* 2. Physical Amenities (POIs) Layer */}
        {showPois && osmPois.map((poi, idx) => (
          <Marker
            key={`poi-${idx}`}
            position={[poi.lat, poi.lon]}
            icon={createOsmPoiIcon(poi.type)}
          >
            <Popup className="google-style-popup">
              <div className="p-1 text-gray-800 text-xs space-y-1 font-sans">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span>{poi.name}</span>
                </div>
                <div className="text-[11px] text-blue-600 uppercase tracking-wider font-mono">
                  {poi.type?.replace('_', ' ')}
                </div>
                <div className="text-[10px] text-gray-500">
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
