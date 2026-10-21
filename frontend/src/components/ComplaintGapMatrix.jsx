import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Cell
} from 'recharts';
import { AlertCircle, HelpCircle, Layers, ArrowUpRight } from 'lucide-react';

export default function ComplaintGapMatrix({ matrixData = [], onSelectCommunity }) {
  // Color code scatter points by quadrant
  const getColor = (entry) => {
    if (entry.quadrant?.includes("Silent Crisis")) return "#ef4444"; // Red
    if (entry.quadrant?.includes("Vocal Saturated")) return "#f97316"; // Orange
    if (entry.quadrant?.includes("Vocal Low Distress")) return "#38bdf8"; // Cyan/Blue
    return "#10b981"; // Emerald
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs max-w-xs space-y-1.5">
          <div className="font-bold text-white text-sm border-b border-slate-800 pb-1 flex justify-between items-center">
            <span>{data.name}</span>
            <span className="font-mono text-[11px] text-cyan-400">SNI: {data.silent_need_index}</span>
          </div>
          <div className="text-slate-400">
            Zone Type: <span className="text-slate-200">{data.zone_type}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>True Distress Risk:</span>
            <span className="font-bold text-red-400">{data.final_risk_score.toFixed(1)}/100</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Actual Complaints (90d):</span>
            <span className="font-bold text-amber-300">{data.actual_complaints}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Expected Complaints:</span>
            <span className="font-semibold text-slate-300">{Math.round(data.expected_complaints)}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 text-[11px] font-semibold text-cyan-300 flex items-center justify-between">
            <span>Quadrant: {data.quadrant}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Header and Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-bold text-white">The Complaint-Gap Matrix</h3>
            <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
              Unmasking Invisible Need
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comparing registered civic tickets (X-Axis) against AI-estimated public service distress (Y-Axis).
          </p>
        </div>

        {/* Quadrant Guide Pill */}
        <div className="flex items-center gap-3 text-xs bg-slate-950/70 px-3.5 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30"></span>
            <span className="text-slate-300 font-medium">Silent Crisis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-slate-300 font-medium">Vocal Need</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span className="text-slate-300 font-medium">Affluent Bias</span>
          </div>
        </div>
      </div>

      {/* Recharts Scatter Plot */}
      <div className="h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            
            {/* Shaded Quadrant Backgrounds */}
            {/* Top-Left Quadrant: THE SILENT NEED ZONE */}
            <ReferenceArea 
              x1={0} x2={15} y1={50} y2={100} 
              fill="#ef4444" 
              fillOpacity={0.07} 
              stroke="#ef4444" 
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{ value: "🚨 SILENT CRISIS (High Distress, Low Voice)", position: "insideTopLeft", fill: "#f87171", fontSize: 11, fontWeight: "bold" }}
            />
            {/* Bottom-Right Quadrant: Hyper-Complaining Affluent */}
            <ReferenceArea 
              x1={20} x2={75} y1={0} y2={50} 
              fill="#0284c7" 
              fillOpacity={0.04} 
              stroke="#0284c7" 
              strokeDasharray="4 4"
              strokeOpacity={0.25}
              label={{ value: "📢 Vocal Low Distress (Digital Overreporting)", position: "insideBottomRight", fill: "#38bdf8", fontSize: 11 }}
            />

            <XAxis 
              type="number" 
              dataKey="actual_complaints" 
              name="Official Complaints (90d)" 
              unit=" tix"
              domain={[0, 'dataMax + 10']}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: "Official Complaints Logged in Portal (90 Days) ➔", position: "bottom", offset: 10, fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="final_risk_score" 
              name="Public Service Distress" 
              domain={[0, 100]}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: "▲ True Service Distress (AI Index 0-100)", angle: -90, position: "insideLeft", offset: 10, fill: "#94a3b8", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Threshold dividing lines */}
            <ReferenceLine y={50} stroke="#475569" strokeDasharray="3 3" />
            <ReferenceLine x={15} stroke="#475569" strokeDasharray="3 3" />

            <Scatter 
              name="Communities" 
              data={matrixData} 
              cursor="pointer"
              onClick={(e) => onSelectCommunity && onSelectCommunity(e.payload)}
            >
              {matrixData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColor(entry)} 
                  stroke="#0f172a" 
                  strokeWidth={2}
                  r={entry.silent_need_index > 70 ? 8 : 6}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Strategic Insight Callout */}
      <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 flex items-start gap-3 text-xs">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-white">The Blindspot Revelation:</strong> Communities located in the shaded red quadrant (Top-Left) 
          face up to 88/100 public service failure (toxic drinking water, flooded raw sewage), yet logged fewer than 4 complaints in 90 days. 
          Standard municipal triage algorithms relying solely on ticket count allocate zero resources to these zones, compounding inequality.
        </p>
      </div>
    </div>
  );
}
