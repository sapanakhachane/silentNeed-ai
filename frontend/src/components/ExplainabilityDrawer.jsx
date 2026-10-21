import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, ShieldAlert, Cpu, CheckCircle2, ChevronRight, 
  Droplets, Zap, ShieldCheck, HeartPulse, Truck, FileText, ArrowRight, Sparkles,
  MapPin, Compass, Building, HelpCircle
} from 'lucide-react';
import { fetchCommunityOSM } from '../services/api';

export default function ExplainabilityDrawer({ 
  community, 
  onClose, 
  onOpenSimulation,
  onCreateIntervention 
}) {
  const [osmData, setOsmData] = useState(null);
  const [loadingOsm, setLoadingOsm] = useState(false);

  useEffect(() => {
    if (community?.id) {
      setLoadingOsm(true);
      fetchCommunityOSM(community.id)
        .then(data => setOsmData(data))
        .catch(err => console.error("Failed to load community OSM data:", err))
        .finally(() => setLoadingOsm(false));
    }
  }, [community?.id]);
  if (!community) return null;

  const pred = community.latest_prediction || {};
  const ind = community.latest_indicator || {};
  const tier = pred.risk_tier || 'Moderate';
  const finalRisk = pred.final_risk_score || 0;
  const sni = pred.silent_need_index || 0;
  const gapRatio = pred.complaint_gap_ratio || 1.0;
  const actualComplaints = pred.actual_complaints_90d ?? ind.official_complaints_registered_90d ?? 0;
  const expectedComplaints = pred.expected_complaints_90d || 0;
  const factors = pred.top_contributing_factors || [];

  return (
    <div className="fixed inset-y-0 right-0 z-[1000] w-full max-w-xl bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all duration-300">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">{community.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                tier === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                tier === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {tier} Risk
              </span>
            </div>
            <p className="text-xs text-slate-400">{community.zone_type} &bull; {community.district} &bull; Code: {community.code}</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Core Metric Badges */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Silent Need Index</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-cyan-400">{sni.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500">/100</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Invisible Crisis Meter</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">True Distress Risk</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-red-400">{finalRisk.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500">/100</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Multi-Sector Severity</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Complaint Gap</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-amber-300">{gapRatio.toFixed(1)}x</span>
            </div>
            <span className="text-[10px] text-amber-400/80 mt-1 block">Underreporting Ratio</span>
          </div>
        </div>

        {/* The Complaint Paradox Callout */}
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-900/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            The Civic Reporting Paradox Detected
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In the last 90 days, this settlement of <strong className="text-white">{community.population?.toLocaleString()} residents</strong> recorded 
            only <strong className="text-amber-300 font-mono">{actualComplaints} official complaints</strong> in the municipal grievance portal. 
            However, algorithmic modeling based on infrastructure deterioration and health indicators estimates that an equitable reporting system would have generated <strong className="text-white font-mono">{Math.round(expectedComplaints)} complaints</strong>.
          </p>
        </div>

        {/* Explainable AI Narrative */}
        {pred.explanation_narrative && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Explainable AI Diagnostic Briefing
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed space-y-2">
              <p>{pred.explanation_narrative}</p>
            </div>
          </div>
        )}

        {/* Feature Contribution Breakdown (Waterfall / Ranking) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <span>Primary Distress Attribution</span>
            <span className="text-[11px] text-slate-400 font-normal">Impact on Risk</span>
          </div>
          <div className="space-y-2">
            {factors.map((item, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    {item.factor}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Observed Severity: <strong className="text-white">{item.score}/100</strong> (Benchmark: {item.benchmark})
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  item.direction === 'increases_risk' 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {item.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Civic Suppression Diagnostic */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Why Aren't Citizens Reporting? (Friction Analysis)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Digital Illiteracy</span>
              <span className="font-bold text-amber-300 text-sm">
                {(100 - (community.digital_literacy_rate || 35)).toFixed(1)}% Excluded
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Cannot use web portals</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Civic Office Distance</span>
              <span className="font-bold text-slate-200 text-sm">
                {community.distance_to_gov_office_km || 8.0} km away
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Physical transit barrier</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Internet Penetration</span>
              <span className="font-bold text-slate-200 text-sm">
                {community.internet_penetration_rate || 30}% coverage
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Low smartphone density</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Economic Fragility</span>
              <span className="font-bold text-slate-200 text-sm">
                ₹{community.median_income_monthly?.toLocaleString()} / mo
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Daily wage livelihood focus</span>
            </div>
          </div>
        </div>

        {/* OpenStreetMap (OSM) Physical Amenity & Desert Audit */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              OpenStreetMap (OSM) Physical Infrastructure Audit
            </h4>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono">
              Live Overpass API
            </span>
          </div>

          {osmData ? (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
              {/* Nominatim Reverse Geocoded Administrative Location */}
              {osmData.osm_geographic_profile && (
                <div className="text-[11px] text-slate-400 border-b border-slate-800/80 pb-2 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>OSM Road: {osmData.osm_geographic_profile.road || 'Unpaved Arterial Access'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pl-5">
                    {osmData.osm_geographic_profile.suburb}, {osmData.osm_geographic_profile.city_district} &bull; Postal Code: {osmData.osm_geographic_profile.postcode || 'N/A'}
                  </div>
                </div>
              )}

              {/* OSM Infrastructure Desert Score */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">OSM Infrastructure Desert Index</span>
                  <span className={`text-xs font-bold ${
                    osmData.osm_infrastructure_audit?.osm_infrastructure_desert_score > 60 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {osmData.osm_infrastructure_audit?.desert_label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-extrabold text-cyan-400">
                    {osmData.osm_infrastructure_audit?.osm_infrastructure_desert_score}/100
                  </span>
                  <span className="text-[10px] text-slate-500 block">Amenity Scarcity</span>
                </div>
              </div>

              {/* 4 Mapped Public Amenities Counter on OpenStreetMap */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-sm block">💧</span>
                  <span className="font-bold text-white text-xs">
                    {osmData.osm_infrastructure_audit?.amenity_counts?.drinking_water || 0}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Water Taps</span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-sm block">🏥</span>
                  <span className="font-bold text-white text-xs">
                    {osmData.osm_infrastructure_audit?.amenity_counts?.healthcare || 0}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Clinics / PHC</span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-sm block">🗑️</span>
                  <span className="font-bold text-white text-xs">
                    {osmData.osm_infrastructure_audit?.amenity_counts?.waste_sanitation || 0}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Waste Bins</span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-sm block">🏛️</span>
                  <span className="font-bold text-white text-xs">
                    {osmData.osm_infrastructure_audit?.amenity_counts?.civic_admin || 0}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Civic Hubs</span>
                </div>
              </div>

              {/* Landmarks mapped nearby on OSM */}
              {osmData.osm_infrastructure_audit?.mapped_pois?.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                    Mapped OSM Landmarks (1.5km Radius)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {osmData.osm_infrastructure_audit.mapped_pois.map((poi, idx) => (
                      <span key={idx} className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        {poi.name} ({poi.type?.replace('_', ' ')})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-500">
              Querying OpenStreetMap Overpass API...
            </div>
          )}
        </div>

        {/* Anomaly Detection Status */}
        {pred.is_anomaly && (
          <div className="bg-rose-950/30 border border-rose-800/50 p-3.5 rounded-xl text-xs space-y-1 text-rose-200">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Scikit-Learn Isolation Forest Anomaly Triggered
            </div>
            <p className="text-[11px] text-slate-300">
              Pattern: <strong>{pred.anomaly_type}</strong> (Anomaly score: {pred.anomaly_score}). 
              The multidimensional vector deviates substantially from the standard civic equilibrium curve.
            </p>
          </div>
        )}

        {/* Transparent Rule Fallback Notice */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
          <div className="flex justify-between items-center text-slate-300">
            <span>ML Random Forest Score:</span>
            <span className="font-mono">{pred.ml_risk_score?.toFixed(1) || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Rule-Based Transparent Score:</span>
            <span className="font-mono">{pred.rule_risk_score?.toFixed(1) || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Model Confidence:</span>
            <span className="font-mono text-emerald-400">{Math.round((pred.confidence_level || 0.9) * 100)}%</span>
          </div>
        </div>

        {/* Recommended Action Box */}
        {pred.recommended_action && (
          <div className="bg-emerald-950/30 border border-emerald-800/50 p-3.5 rounded-xl text-xs space-y-1 text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Prioritized Remediation Directive
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {pred.recommended_action}
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-3">
        <button
          onClick={() => {
            onClose();
            onOpenSimulation(community);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold py-2.5 px-4 rounded-xl text-xs transition border border-slate-700 cursor-pointer shadow"
        >
          <Cpu className="w-4 h-4" />
          Test "What-If" Simulation
        </button>

        <button
          onClick={() => {
            onCreateIntervention(community);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-lg shadow-cyan-900/30 cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          Dispatch Intervention
        </button>
      </div>
    </div>
  );
}
