import React, { useState } from "react";
import { 
  X, AlertTriangle, Droplets, Zap, Trash2, HeartPulse, 
  MapPin, Send, CheckCircle2, ShieldCheck, EyeOff
} from "lucide-react";
import { submitCitizenGroundTruth } from "../services/api";
import { TRANSLATIONS } from "../i18n/translations";

export default function CitizenReportModal({ isOpen, onClose, communities = [], onReportSubmitted, currentLang = "en", currentUser }) {
  if (!isOpen) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [communityId, setCommunityId] = useState(communities[0]?.id || 1);
  const [issueCategory, setIssueCategory] = useState("Drinking Water Contamination");
  const [severity, setSeverity] = useState("Critical");
  const [daysUnresolved, setDaysUnresolved] = useState("14");
  const [fieldNotes, setFieldNotes] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = [
    { label: "💧 Drinking Water Contamination / Dry Handpump", val: "Drinking Water Contamination", icon: Droplets },
    { label: "🚯 Raw Sewage & Garbage Overflow", val: "Sanitation & Garbage Overflow", icon: Trash2 },
    { label: "⚡ Hazardous Power Outages & Sparks", val: "Power Outage & Voltage Severity", icon: Zap },
    { label: "🏥 PHC Closed / Doctor Absent", val: "Healthcare Facility Absence", icon: HeartPulse },
    { label: "🛣️ Flooded / Impassable Roadway", val: "Roadway Flood & Potholes", icon: AlertTriangle }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fieldNotes.trim()) return;

    setLoading(true);
    try {
      await submitCitizenGroundTruth({
        community_id: Number(communityId),
        source_type: isAnonymous ? "Anonymous Citizen Ground-Truth" : `Citizen Report (${currentUser?.full_name || "Resident"})`,
        issue_category: issueCategory,
        severity: severity,
        field_notes: `[Citizen Distress - Unresolved for ${daysUnresolved} days]: ${fieldNotes}`,
        verified: true
      });
      setSuccess(true);
      if (onReportSubmitted) onReportSubmitted();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error("Report failure", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.authReportGroundTruth}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Citizen Portal
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direct community ground-truth channel for unlogged service distress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Citizen Report Logged!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your report has been integrated into the SilentNeed AI calculation engine and prioritized for municipal relief dispatch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Community Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Affected Community & Ward
                </label>
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ward_number || c.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Problem Category
                </label>
                <div className="space-y-1.5">
                  {categories.map((cat, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                        issueCategory === cat.val
                          ? "bg-amber-500/10 border-amber-500/50 text-amber-200"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="issueCategory"
                        checked={issueCategory === cat.val}
                        onChange={() => setIssueCategory(cat.val)}
                        className="accent-amber-500"
                      />
                      <span>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Severity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="Critical">🚨 Critical / Life Threatening</option>
                    <option value="Severe">⚠️ Severe / Daily Disruption</option>
                    <option value="Moderate">🟡 Moderate / Recurring</option>
                  </select>
                </div>

                {/* Days Unresolved */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Days Unresolved
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={daysUnresolved}
                    onChange={(e) => setDaysUnresolved(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ground-Truth Description & Real Impact
                </label>
                <textarea
                  rows="3"
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  placeholder="Describe what is happening: e.g. handpump water is coming out rust-colored with oily film, 3 children fell sick with diarrhea yesterday..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>

              {/* Anonymous Checkbox */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  <span>Submit Anonymously (Protects Identity)</span>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !fieldNotes.trim()}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950/40 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? "Submitting Ground-Truth..." : "Dispatch Ground-Truth Report to Municipal Radar"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encrypted Civic Relay</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
