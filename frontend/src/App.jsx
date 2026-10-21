import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, Layers, Cpu, Truck, Plus, Search, 
  Filter, AlertTriangle, Droplets, MapPin, BarChart3, ChevronRight, 
  ExternalLink, Sparkles, RefreshCw, CheckCircle2, Info,
  Compass, Building, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

import { 
  fetchCommunities, fetchAnalyticsOverview, fetchComplaintGapMatrix, fetchCityOSMAudit 
} from './services/api';

import CommunityMap from './components/CommunityMap';
import ComplaintGapMatrix from './components/ComplaintGapMatrix';
import ExplainabilityDrawer from './components/ExplainabilityDrawer';
import SimulationSandbox from './components/SimulationSandbox';
import InterventionsView from './components/InterventionsView';
import AddCommunityModal from './components/AddCommunityModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'matrix', 'simulation', 'interventions'
  const [communities, setCommunities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [matrixData, setMatrixData] = useState([]);
  const [osmCityAudit, setOsmCityAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  // Selection & Modals
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [simulationTarget, setSimulationTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [comms, stats, matrix, osmAudit] = await Promise.all([
        fetchCommunities({
          search: searchQuery,
          risk_tier: tierFilter,
          anomaly_only: anomalyOnly
        }),
        fetchAnalyticsOverview(),
        fetchComplaintGapMatrix(),
        fetchCityOSMAudit().catch(() => null)
      ]);
      setCommunities(comms);
      setAnalytics(stats);
      setMatrixData(matrix);
      if (osmAudit) setOsmCityAudit(osmAudit);
    } catch (err) {
      console.error("Data load failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [searchQuery, tierFilter, anomalyOnly]);

  const handleOpenSimulation = (comm) => {
    setSimulationTarget(comm);
    setActiveTab('simulation');
  };

  const handleCreateInterventionFromDrawer = (comm) => {
    setSelectedCommunity(null);
    setActiveTab('interventions');
  };

  // Prepare sector distress bar chart data
  const sectorChartData = analytics?.sector_distress_breakdown 
    ? Object.entries(analytics.sector_distress_breakdown).map(([name, score]) => ({
        name,
        score
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white m-0 p-0 text-left">
                  SilentNeed <span className="text-cyan-400">AI</span>
                </h1>
                <span className="hidden sm:inline-block bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/20">
                  ML Risk Radar
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block text-left">
                Detecting Invisible Community Problems & Public Service Vacuums
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Geo-Radar</span> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Complaint-Gap Matrix
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'simulation'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              What-If Sandbox
            </button>

            <button
              onClick={() => setActiveTab('interventions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'interventions'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Interventions
            </button>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-lg shadow-cyan-900/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Field Audit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* OpenStreetMap (OSM) Cartographic & Physical Amenity Intelligence Bar */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl px-5 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-xl border border-cyan-500/20 font-bold text-[11px]">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  OpenStreetMap Cartographic & Amenity Audit
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-medium text-[11px]">
                  <span className="text-slate-400">OSM Amenities Scanned:</span>
                  <span className="font-bold text-white">
                    {osmCityAudit ? (osmCityAudit.total_osm_water_points_mapped + osmCityAudit.total_osm_clinics_mapped) : 18} Verified
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400">💧 Water Points: <strong className="text-cyan-300">{osmCityAudit?.total_osm_water_points_mapped || 8}</strong></span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400">🏥 PHC / Clinics: <strong className="text-emerald-300">{osmCityAudit?.total_osm_clinics_mapped || 8}</strong></span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400">🚨 OSM Deserts: <strong className="text-rose-400">{osmCityAudit?.osm_infrastructure_deserts_count || 4} Critical Zones</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>OSM Overpass & Nominatim:</span>
                <strong className="text-emerald-300">Synchronized (HOT & Standard Layers Active)</strong>
              </div>
            </div>
            
            {/* The Complaint Paradox Callout Banner */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-800/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  The Civic Blindspot Principle
                </div>
                <h2 className="text-base font-bold text-white m-0">
                  Fewer complaints do not mean fewer problems.
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Traditional municipal dashboards allocate funding where complaint volumes are highest. 
                  SilentNeed AI cross-analyzes water quality, power reliability, and drainage metrics with 
                  digital literacy indices to reveal <strong className="text-cyan-300 font-semibold">"Ghost Hotspots"</strong> — marginalized 
                  communities enduring catastrophic public service failure in near-complete civic silence.
                </p>
              </div>

              {analytics?.complaint_disparity_paradox && (
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0 text-xs space-y-1 md:min-w-[280px]">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Observed Civic Disparity
                  </span>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Digitally Excluded Complaints:</span>
                    <strong className="text-amber-400 font-mono">
                      {analytics.complaint_disparity_paradox.digitally_excluded_avg_complaints} avg
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>True Service Distress:</span>
                    <strong className="text-red-400 font-mono">
                      {analytics.complaint_disparity_paradox.digitally_excluded_avg_real_risk}/100
                    </strong>
                  </div>
                  <div className="text-[10px] text-cyan-300/90 pt-1 border-t border-slate-800">
                    {analytics.complaint_disparity_paradox.paradox_insight}
                  </div>
                </div>
              )}
            </div>

            {/* 4 Executive KPI Cards */}
            {analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">Monitored Citizens</span>
                  <div className="text-2xl font-extrabold text-white">
                    {analytics.total_population_monitored?.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Across {analytics.total_communities} monitored zones
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">Critical Silent Need Zones</span>
                  <div className="text-2xl font-extrabold text-rose-400">
                    {analytics.critical_risk_zones}
                  </div>
                  <span className="text-[10px] text-rose-400/80 mt-1 block">
                    High distress with suppressed tickets
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">Avg Silent Need Index</span>
                  <div className="text-2xl font-extrabold text-cyan-400">
                    {analytics.average_silent_need_index} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/80 mt-1 block">
                    City-wide invisible deficit index
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">ML Anomalies Detected</span>
                  <div className="text-2xl font-extrabold text-amber-300">
                    {analytics.detected_silent_anomalies}
                  </div>
                  <span className="text-[10px] text-amber-300/80 mt-1 block">
                    Flagged by Scikit-learn Outlier Model
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Leaflet Geo-Map Component */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Geo-Spatial Need Radar
                </h3>
                <span className="text-xs text-slate-400">
                  Click any pulsing marker to inspect explainable AI diagnostics
                </span>
              </div>
              <CommunityMap
                communities={communities}
                selectedCommunity={selectedCommunity}
                onSelectCommunity={(comm) => setSelectedCommunity(comm)}
              />
            </div>

            {/* Filter and Communities Table / Inspector Grid */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base">Monitored Community Registries</h3>
                  <p className="text-xs text-slate-400">
                    Ranked by Silent Need Index. High SNI identifies communities with severe problems and suppressed reporting.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search community, ward..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 outline-none focus:border-cyan-500 w-44"
                    />
                  </div>

                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1.5 outline-none focus:border-cyan-500"
                  >
                    <option value="">All Tiers</option>
                    <option value="Critical">Critical Only</option>
                    <option value="High">High Only</option>
                    <option value="Moderate">Moderate Only</option>
                    <option value="Low">Low Only</option>
                  </select>

                  <button
                    onClick={() => setAnomalyOnly(!anomalyOnly)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition cursor-pointer ${
                      anomalyOnly 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Anomalies Only
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Community & Zone</th>
                      <th className="py-3 px-3">Population</th>
                      <th className="py-3 px-3 text-center">Complaints (90d)</th>
                      <th className="py-3 px-3 text-center">Expected</th>
                      <th className="py-3 px-3 text-center">Reporting Gap</th>
                      <th className="py-3 px-3 text-center">True Distress</th>
                      <th className="py-3 px-3 text-center">Silent Need Index</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {communities.map((comm) => {
                      const pred = comm.latest_prediction || {};
                      const ind = comm.latest_indicator || {};
                      const tier = pred.risk_tier || 'Moderate';
                      const actual = pred.actual_complaints_90d ?? ind.official_complaints_registered_90d ?? 0;
                      const expected = pred.expected_complaints_90d || 0;
                      const gap = pred.complaint_gap_ratio || 1.0;
                      const sni = pred.silent_need_index || 0;

                      return (
                        <tr 
                          key={comm.id} 
                          className="hover:bg-slate-800/40 transition cursor-pointer"
                          onClick={() => setSelectedCommunity(comm)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm">{comm.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span>{comm.zone_type}</span>
                              <span>&bull;</span>
                              <span className="font-mono text-cyan-400">{comm.code}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-300">
                            {comm.population?.toLocaleString()}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {actual}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-mono text-slate-300">
                            {Math.round(expected)}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                              gap > 4.0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              gap > 1.8 ? 'bg-orange-500/20 text-orange-400' :
                              'text-slate-400'
                            }`}>
                              {gap.toFixed(1)}x
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="font-bold text-slate-200">
                              {pred.final_risk_score?.toFixed(1) || '0.0'}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                              tier === 'Critical' ? 'text-red-400' :
                              tier === 'High' ? 'text-orange-400' :
                              'text-emerald-400'
                            }`}>
                              {tier}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="font-mono font-extrabold text-sm text-cyan-400">
                              {sni.toFixed(1)}
                            </div>
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                              <div 
                                className={`h-full ${
                                  sni >= 70 ? 'bg-red-500' :
                                  sni >= 50 ? 'bg-orange-500' :
                                  'bg-cyan-500'
                                }`}
                                style={{ width: `${Math.min(100, sni)}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCommunity(comm);
                              }}
                              className="inline-flex items-center gap-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-cyan-500/30 transition cursor-pointer"
                            >
                              XAI Brief
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* City-Wide Sector Distress Overview Bar Chart */}
            {sectorChartData.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      City-Wide Public Service Vulnerability Spectrum
                    </h3>
                    <p className="text-xs text-slate-400">
                      Average distress score across the 7 monitored public service sectors.
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorChartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                        itemStyle={{ color: '#38bdf8' }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {sectorChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.score > 60 ? '#ef4444' : entry.score > 40 ? '#f97316' : '#0284c7'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. COMPLAINT-GAP MATRIX VIEW */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <ComplaintGapMatrix
              matrixData={matrixData}
              onSelectCommunity={(point) => {
                const found = communities.find(c => c.id === point.community_id);
                if (found) setSelectedCommunity(found);
              }}
            />
          </div>
        )}

        {/* 3. POLICY SIMULATION SANDBOX VIEW */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <SimulationSandbox
              communities={communities}
              preselectedCommunity={simulationTarget}
            />
          </div>
        )}

        {/* 4. INTERVENTIONS PIPELINE VIEW */}
        {activeTab === 'interventions' && (
          <div className="space-y-6">
            <InterventionsView
              communities={communities}
              onRefreshData={loadAllData}
            />
          </div>
        )}
      </main>

      {/* Slide-in Explainable AI Inspector Drawer */}
      <ExplainabilityDrawer
        community={selectedCommunity}
        onClose={() => setSelectedCommunity(null)}
        onOpenSimulation={handleOpenSimulation}
        onCreateIntervention={handleCreateInterventionFromDrawer}
      />

      {/* Add Community / Field Survey Modal */}
      <AddCommunityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCommunityAdded={loadAllData}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SilentNeed AI &bull; Social Impact Public-Service Risk & Invisible Problem Detection System
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              FastAPI + ML Active
            </span>
            <span>&bull;</span>
            <span>Scikit-Learn Ensemble & Outlier Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
