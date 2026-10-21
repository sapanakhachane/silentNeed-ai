import React, { useState, useEffect } from 'react';
import { 
  Play, Sparkles, TrendingDown, DollarSign, Award, CheckCircle2, 
  RotateCcw, Droplets, Truck, HeartPulse, Shield, HelpCircle
} from 'lucide-react';
import { runSimulation } from '../services/api';

export default function SimulationSandbox({ communities = [], preselectedCommunity = null }) {
  const [selectedCommId, setSelectedCommId] = useState(
    preselectedCommunity ? preselectedCommunity.id : (communities[0]?.id || '')
  );

  // Intervention toggles and sliders
  const [waterHoursBoost, setWaterHoursBoost] = useState(4.0);
  const [purificationPlant, setPurificationPlant] = useState(true);
  const [roadRepair, setRoadRepair] = useState(false);
  const [garbageBoost, setGarbageBoost] = useState(2.0);
  const [mobileClinic, setMobileClinic] = useState(true);
  const [drainageDesilting, setDrainageDesilting] = useState(true);
  const [civicKiosk, setCivicKiosk] = useState(true);

  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preselectedCommunity) {
      setSelectedCommId(preselectedCommunity.id);
    }
  }, [preselectedCommunity]);

  const activeCommunity = communities.find(c => c.id === Number(selectedCommId)) || communities[0];

  const handleSimulate = async () => {
    if (!selectedCommId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runSimulation({
        community_id: Number(selectedCommId),
        water_access_hours_boost: Number(waterHoursBoost),
        water_purification_plant_added: purificationPlant,
        road_repair_investment: roadRepair,
        garbage_frequency_boost: Number(garbageBoost),
        mobile_clinic_deployed: mobileClinic,
        drainage_desilting_completed: drainageDesilting,
        civic_grievance_kiosk_installed: civicKiosk
      });
      setSimResult(res);
    } catch (err) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setLoading(false);
    }
  };

  // Run automatically on first load or when changing community
  useEffect(() => {
    if (selectedCommId) {
      handleSimulate();
    }
  }, [selectedCommId]);

  return (
    <div className="space-y-6">
      {/* Sandbox Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Policy "What-If" Simulation Sandbox</h2>
            <span className="bg-cyan-500/10 text-cyan-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Counterfactual ML Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Model the systemic impact of hypothetical municipal interventions before allocating public capital.
            Test how combinations of infrastructure upgrades and civic kiosks eradicate invisible distress.
          </p>
        </div>

        {/* Community Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Target Community:</label>
          <select
            value={selectedCommId}
            onChange={(e) => setSelectedCommId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500 transition"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.latest_prediction?.risk_tier || 'Risk'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Controls Left, Predicted Outcomes Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Interventions Controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white">Configure Policy Package</h3>
            <span className="text-[11px] text-slate-400">Interactive Toggles</span>
          </div>

          {/* 1. Drinking Water */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                Drinking Water Interventions
              </span>
              <span className="text-cyan-400 font-mono">+{waterHoursBoost}h/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={waterHoursBoost}
              onChange={(e) => setWaterHoursBoost(e.target.value)}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <label className="flex items-center gap-2 text-xs text-slate-300 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={purificationPlant}
                onChange={(e) => setPurificationPlant(e.target.checked)}
                className="rounded accent-cyan-500 cursor-pointer"
              />
              <span>Install Solar RO Purification Kiosk (Cuts Contamination by 75%)</span>
            </label>
          </div>

          {/* 2. Drainage & Flood Desilting */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={drainageDesilting}
                onChange={(e) => setDrainageDesilting(e.target.checked)}
                className="mt-0.5 rounded accent-cyan-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white block">Mechanical Culvert Desilting & Embankments</span>
                <span className="text-[11px] text-slate-400">Lowers flood inundation by 80% during heavy rains</span>
              </div>
            </label>
          </div>

          {/* 3. Healthcare Mobile Van */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={mobileClinic}
                onChange={(e) => setMobileClinic(e.target.checked)}
                className="mt-0.5 rounded accent-cyan-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white block">Bi-Weekly Mobile PHC Health Clinic</span>
                <span className="text-[11px] text-slate-400">Brings primary diagnostics and vaccines directly to settlement</span>
              </div>
            </label>
          </div>

          {/* 4. Sanitation Pickup */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>Municipal Waste Collection Boost</span>
              <span className="text-amber-400 font-mono">+{garbageBoost}x / week</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={garbageBoost}
              onChange={(e) => setGarbageBoost(e.target.value)}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* 5. Road Rehabilitation */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={roadRepair}
                onChange={(e) => setRoadRepair(e.target.checked)}
                className="mt-0.5 rounded accent-cyan-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white block">Arterial Road Paving & Transit Linkage</span>
                <span className="text-[11px] text-slate-400">Eliminates pothole choke points and connects to bus corridor</span>
              </div>
            </label>
          </div>

          {/* 6. The Grievance Kiosk (Paradox Solver) */}
          <div className="bg-gradient-to-r from-cyan-950/40 to-slate-950 p-3.5 rounded-xl border border-cyan-800/50 space-y-1.5">
            <label className="flex items-start gap-2.5 text-xs text-cyan-200 cursor-pointer">
              <input
                type="checkbox"
                checked={civicKiosk}
                onChange={(e) => setCivicKiosk(e.target.checked)}
                className="mt-0.5 rounded accent-cyan-400 cursor-pointer"
              />
              <div>
                <span className="font-bold text-cyan-300 block">Deploy Neighborhood Citizen Grievance Kiosk</span>
                <span className="text-[11px] text-slate-300">
                  Provides free voice/assisted ticketing. Eliminates the digital divide so complaints finally mirror real need!
                </span>
              </div>
            </label>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-cyan-900/30 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Counterfactual ML Simulation
          </button>
        </div>

        {/* Right Column: Projected Impact & ROI Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {simResult ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">Projected Intervention Impact</h3>
                  <span className="text-xs text-slate-400">Community: {activeCommunity?.name}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-bold">
                  <Award className="w-3.5 h-3.5" />
                  Social ROI Score: {simResult.roi_score}
                </div>
              </div>

              {/* Before vs After Impact Comparison Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Distress Score Reduction */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Public Service Distress Score</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Baseline</span>
                      <span className="text-lg font-bold text-slate-300">{simResult.baseline_risk_score.toFixed(1)}</span>
                    </div>
                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-xs text-emerald-400 block">Simulated</span>
                      <span className="text-xl font-extrabold text-emerald-400">{simResult.simulated_risk_score.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/40 inline-block">
                    ▼ {simResult.risk_reduction_pct}% Distress Reduction
                  </div>
                </div>

                {/* Silent Need Index Reduction */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Silent Need Index (Invisible Gap)</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Baseline</span>
                      <span className="text-lg font-bold text-slate-300">{simResult.baseline_silent_need_index.toFixed(1)}</span>
                    </div>
                    <TrendingDown className="w-5 h-5 text-cyan-400" />
                    <div>
                      <span className="text-xs text-cyan-400 block">Simulated</span>
                      <span className="text-xl font-extrabold text-cyan-400">{simResult.simulated_silent_need_index.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/40 inline-block">
                    ▼ {simResult.silent_need_reduction_pct}% Blindspot Eradication
                  </div>
                </div>
              </div>

              {/* Citizen Voice Unmasking Card */}
              <div className="bg-gradient-to-r from-blue-950/30 via-slate-950 to-cyan-950/30 border border-blue-900/40 p-4 rounded-xl space-y-1.5 text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Democratic Feedback Equilibrium
                </span>
                <p className="text-slate-300 leading-relaxed">
                  With the civic assistance kiosk in place, visible citizen tickets are projected to reach <strong className="text-white">{simResult.simulated_visible_complaints}</strong> (up from {activeCommunity?.latest_indicator?.official_complaints_registered_90d || 0}). 
                  The complaint gap narrows from <strong className="text-red-400">{activeCommunity?.latest_prediction?.complaint_gap_ratio || 1.0}x deficit</strong> down to a healthy, equitable feedback equilibrium.
                </p>
              </div>

              {/* Sector-by-Sector Improvements Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Sector-Specific Distress Relief
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(simResult.sector_improvements || {}).map(([sec, imp]) => (
                    <div key={sec} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                      <span className="text-slate-400 capitalize">{sec.replace('_risk', '')}:</span>
                      <span className="font-mono font-bold text-emerald-400">-{imp} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated Budget Footprint */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Total Estimated Implementation Budget</span>
                  <span className="text-xl font-extrabold text-white">
                    ₹{simResult.estimated_intervention_cost?.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Target Population Benefitted</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {activeCommunity?.population?.toLocaleString()} citizens
                  </span>
                </div>
              </div>

              {/* Natural Language Executive Brief */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
                "{simResult.summary}"
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-cyan-500 mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-white">Configuring simulation...</p>
              <p className="text-xs max-w-sm mt-1">Adjust parameters on the left and run the counterfactual ML model.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
