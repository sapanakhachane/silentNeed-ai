import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Filter, CheckCircle, Clock, AlertTriangle, 
  DollarSign, Building2, Calendar, CheckCircle2, ChevronRight
} from 'lucide-react';
import { 
  fetchInterventions, updateIntervention, createIntervention, fetchInterventionsSummary 
} from '../services/api';

export default function InterventionsView({ communities = [], onRefreshData }) {
  const [interventions, setInterventions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // New intervention modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({
    community_id: communities[0]?.id || 1,
    title: '',
    sector: 'Drinking Water',
    priority: 'Critical',
    estimated_budget: 250000,
    lead_department: 'Water Supply & Sewerage Board',
    status: 'Identified',
    target_completion_days: 30,
    impact_projection: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        fetchInterventions({ status: filterStatus, priority: filterPriority }),
        fetchInterventionsSummary()
      ]);
      setInterventions(list);
      setSummary(sum);
    } catch (err) {
      console.error("Error loading interventions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterPriority]);

  const handleAdvanceStatus = async (id, currentStatus) => {
    const nextStatusMap = {
      'Identified': 'Dispatched',
      'Dispatched': 'In Progress',
      'In Progress': 'Verified Completed',
      'Verified Completed': 'Identified'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'Identified';

    try {
      await updateIntervention(id, { status: nextStatus });
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error("Failed to advance status:", err);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createIntervention({
        ...newForm,
        community_id: Number(newForm.community_id),
        estimated_budget: Number(newForm.estimated_budget),
        target_completion_days: Number(newForm.target_completion_days)
      });
      setShowCreateModal(false);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to create intervention: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified Completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Dispatched':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Summary KPIs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Social Impact Intervention Pipeline</h2>
              <span className="bg-cyan-500/10 text-cyan-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Action & Remediation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dispatched municipal relief and infrastructure allocations targeting high-disparity silent need zones.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-cyan-900/30 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Dispatch New Intervention
          </button>
        </div>

        {/* 4 Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Interventions</span>
              <span className="text-2xl font-extrabold text-white">{summary.total_interventions}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Across 7 public sectors</span>
            </div>
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Committed Budget</span>
              <span className="text-2xl font-extrabold text-emerald-400">
                ₹{(summary.total_budget_allocated / 100000).toFixed(1)}L
              </span>
              <span className="text-[10px] text-emerald-400/80 block mt-1">Direct community relief</span>
            </div>
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Critical Priority</span>
              <span className="text-2xl font-extrabold text-rose-400">{summary.critical_count}</span>
              <span className="text-[10px] text-rose-400/80 block mt-1">Immediate life-safety</span>
            </div>
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Active In Pipeline</span>
              <span className="text-2xl font-extrabold text-cyan-400">
                {(summary.by_status?.['In Progress'] || 0) + (summary.by_status?.['Dispatched'] || 0)}
              </span>
              <span className="text-[10px] text-cyan-400/80 block mt-1">Currently being executed</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          Filter Interventions:
        </span>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="Identified">Identified</option>
          <option value="Dispatched">Dispatched</option>
          <option value="In Progress">In Progress</option>
          <option value="Verified Completed">Verified Completed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500"
        >
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
        </select>
      </div>

      {/* Interventions Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interventions.map((item) => {
          const comm = communities.find(c => c.id === item.community_id);
          return (
            <div 
              key={item.id} 
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      item.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {item.priority}
                    </span>
                    <span className="text-xs text-slate-400">&bull; {item.sector}</span>
                  </div>
                  <h3 className="font-bold text-white text-base mt-1">{item.title}</h3>
                  <p className="text-xs text-cyan-400 font-medium">Target: {comm ? comm.name : `Community #${item.community_id}`}</p>
                </div>

                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${getStatusBadge(item.status)}`}>
                  {item.status}
                </span>
              </div>

              {/* Impact and Notes */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-2 text-slate-300">
                {item.impact_projection && (
                  <p className="font-medium text-emerald-300">
                    Impact: {item.impact_projection}
                  </p>
                )}
                {item.notes && (
                  <p className="text-slate-400 leading-relaxed">
                    Directive: {item.notes}
                  </p>
                )}
              </div>

              {/* Details & Advance Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="space-y-0.5">
                  <div className="text-white font-semibold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    ₹{item.estimated_budget?.toLocaleString()} Budget
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {item.lead_department}
                  </div>
                </div>

                <button
                  onClick={() => handleAdvanceStatus(item.id, item.status)}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-slate-700 cursor-pointer"
                  title="Click to cycle status to next pipeline phase"
                >
                  <span>Advance Status</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create New Intervention */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base border-b border-slate-800 pb-2">
              Dispatch Social Impact Intervention
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Community</label>
                <select
                  value={newForm.community_id}
                  onChange={(e) => setNewForm({ ...newForm, community_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                >
                  {communities.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.latest_prediction?.risk_tier || 'Risk'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Intervention Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Borewell Chlorination & Water Kiosks"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Public Service Sector</label>
                  <select
                    value={newForm.sector}
                    onChange={(e) => setNewForm({ ...newForm, sector: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                  >
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Sanitation & Waste">Sanitation & Waste</option>
                    <option value="Drainage & Flood Control">Drainage & Flood Control</option>
                    <option value="Healthcare & Medical">Healthcare & Medical</option>
                    <option value="Roads & Transit">Roads & Transit</option>
                    <option value="Electrical Power">Electrical Power</option>
                    <option value="Civic Grievance Access">Civic Grievance Access</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Priority Tier</label>
                  <select
                    value={newForm.priority}
                    onChange={(e) => setNewForm({ ...newForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical (Immediate)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Allocated Budget (₹)</label>
                  <input
                    type="number"
                    value={newForm.estimated_budget}
                    onChange={(e) => setNewForm({ ...newForm, estimated_budget: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Lead Department</label>
                  <input
                    type="text"
                    value={newForm.lead_department}
                    onChange={(e) => setNewForm({ ...newForm, lead_department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Impact Projection / Target</label>
                <input
                  type="text"
                  placeholder="e.g. Expected 65% reduction in waterborne infections"
                  value={newForm.impact_projection}
                  onChange={(e) => setNewForm({ ...newForm, impact_projection: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 cursor-pointer"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
