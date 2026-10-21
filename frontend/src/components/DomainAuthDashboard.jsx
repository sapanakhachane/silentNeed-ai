import React, { useState } from "react";
import { 
  Building, User, HeartHandshake, Microscope, ShieldCheck, 
  CheckCircle2, ArrowRight, Sparkles, LogIn, UserPlus, LogOut, 
  KeyRound, Mail, Lock, AlertTriangle, Droplets, MapPin, 
  Compass, FileText, ChevronRight, RefreshCw, BarChart2, ShieldAlert
} from "lucide-react";
import { DEMO_ACCOUNTS, loginDemoRole, loginUser, registerUser, logoutUser } from "../services/api";
import { TRANSLATIONS } from "../i18n/translations";

export default function DomainAuthDashboard({ 
  currentUser, 
  setCurrentUser, 
  currentLang = "en",
  onNavigateTab,
  onOpenCitizenReport,
  communities = []
}) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [activeMode, setActiveMode] = useState(currentUser ? "dossier" : "register"); // "register", "login", "dossier"
  const [selectedDomain, setSelectedDomain] = useState(currentUser?.role || "authority");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deptOrWard, setDeptOrWard] = useState("");
  const [govIdOrRegNo, setGovIdOrRegNo] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const DOMAINS = [
    {
      id: "authority",
      name: "Municipal Authorities & Govt",
      shortLabel: "Authority",
      icon: Building,
      avatar: "🏛️",
      color: "cyan",
      borderColor: "border-cyan-500/40",
      bgGradient: "from-cyan-950/40 via-slate-900 to-slate-900",
      tagline: "Urban Local Bodies, Municipal Commissioners, Public Works & Water Boards",
      mission: "Targeting public capital and dispatching emergency relief to communities facing severe service deficits.",
      clearance: "Tier 1 Executive Clearance",
      features: [
        "Full Geo-Radar access & ML outlier inspection",
        "Intervention budget approvals & relief dispatch",
        "Policy Simulation sandbox stress-testing",
        "City-wide OpenStreetMap infrastructure audit"
      ],
      sampleUser: DEMO_ACCOUNTS.find(a => a.role === "authority")
    },
    {
      id: "citizen",
      name: "Citizens & Community Residents",
      shortLabel: "Citizen",
      icon: User,
      avatar: "🏡",
      color: "amber",
      borderColor: "border-amber-500/40",
      bgGradient: "from-amber-950/40 via-slate-900 to-slate-900",
      tagline: "Informal Settlement Residents, Marginalized Hamlets, Ward Councils",
      mission: "Unmasking invisible community distress, submitting ground-truth alerts, and tracking civic aid delivery.",
      clearance: "Tier 3 Ground-Truth Clearance",
      features: [
        "Real-time local ward distress monitoring",
        "Direct anonymous ground-truth reporting channel",
        "AI Civic Ombudsman guidance for relief rights",
        "Tracking dispatched water tankers & road repairs"
      ],
      sampleUser: DEMO_ACCOUNTS.find(a => a.role === "citizen")
    },
    {
      id: "ngo",
      name: "Social Impact NGOs & Field Auditors",
      shortLabel: "NGO Auditor",
      icon: HeartHandshake,
      avatar: "🤝",
      color: "emerald",
      borderColor: "border-emerald-500/40",
      bgGradient: "from-emerald-950/40 via-slate-900 to-slate-900",
      tagline: "Grassroots NGOs, Humanitarian Relief Teams, Cartographic Field Auditors",
      mission: "Verifying physical service vacuums and mapping missing infrastructure on OpenStreetMap.",
      clearance: "Tier 2 Field Operations Clearance",
      features: [
        "Submit verified field surveys (+ Add Field Audit)",
        "OpenStreetMap POI deficit ground verification",
        "Complaint-Gap Matrix deep analysis",
        "Humanitarian aid allocation coordination"
      ],
      sampleUser: DEMO_ACCOUNTS.find(a => a.role === "ngo")
    },
    {
      id: "researcher",
      name: "Researchers & Data Scientists",
      shortLabel: "Researcher",
      icon: Microscope,
      avatar: "🔬",
      color: "purple",
      borderColor: "border-purple-500/40",
      bgGradient: "from-purple-950/40 via-slate-900 to-slate-900",
      tagline: "Academic Institutions, Civic Data Scientists, Algorithmic Fairness Auditors",
      mission: "Investigating civic reporting biases, machine learning transparency, and spatial inequality patterns.",
      clearance: "Tier 2 Analytics Clearance",
      features: [
        "Explainable AI feature weight inspection",
        "Isolation forest anomaly score distributions",
        "Raw municipal dataset export (JSON / CSV)",
        "Algorithmic reporting friction modeling"
      ],
      sampleUser: DEMO_ACCOUNTS.find(a => a.role === "researcher") || DEMO_ACCOUNTS[0]
    }
  ];

  const currentDomainInfo = DOMAINS.find(d => d.id === selectedDomain) || DOMAINS[0];

  const handle1ClickDemoLogin = async (roleKey) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const user = await loginDemoRole(roleKey);
      setCurrentUser(user);
      setSelectedDomain(roleKey);
      setActiveMode("dossier");
      setStatusMessage({ type: "success", text: `Successfully switched to ${user.full_name} (${user.role.toUpperCase()} domain)!` });
    } catch (err) {
      setStatusMessage({ type: "error", text: "Login failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setStatusMessage({ type: "error", text: "Please fill in all mandatory fields." });
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      const user = await registerUser({
        full_name: fullName,
        email: email,
        password: password,
        role: selectedDomain,
        organization: deptOrWard || `${currentDomainInfo.name} Member`,
        ward_assigned: jurisdiction || "All Monitored Clusters"
      });
      setCurrentUser(user);
      setActiveMode("dossier");
      setStatusMessage({ type: "success", text: `Account registered successfully in ${currentDomainInfo.name}!` });
    } catch (err) {
      setStatusMessage({ type: "error", text: "Registration could not be completed." });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setStatusMessage({ type: "error", text: "Please enter both email and password." });
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      const user = await loginUser(loginEmail, loginPassword);
      setCurrentUser(user);
      setSelectedDomain(user.role);
      setActiveMode("dossier");
      setStatusMessage({ type: "success", text: `Welcome back, ${user.full_name}!` });
    } catch (err) {
      setStatusMessage({ type: "error", text: "Authentication error. Check credentials." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActiveMode("login");
    setStatusMessage({ type: "info", text: "You have signed out of your domain session." });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/60 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Civic Domain & Authentication Architecture
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Register & Login Domain Gateway
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            SilentNeed AI operates across 4 specialized civic domains—tailoring explainable risk detection, 
            anonymous ground-truth reporting, and humanitarian interventions for government authorities, 
            local citizens, NGOs, and civic data researchers.
          </p>
        </div>

        {/* Current Auth Status Pill */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shrink-0 flex flex-col items-end gap-2 text-right">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Active Session Status
          </div>
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{currentUser.avatar || "🏛️"}</span>
              <div className="text-left">
                <div className="text-xs font-bold text-white">{currentUser.full_name}</div>
                <div className="text-[10px] text-cyan-300 font-medium uppercase">{currentUser.role} Domain</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Guest Session (Unauthenticated)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Four Civic Domain Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DOMAINS.map((domain) => {
          const isSelected = selectedDomain === domain.id;
          const isUserActive = currentUser?.role === domain.id;
          const IconComp = domain.icon;

          return (
            <div
              key={domain.id}
              onClick={() => {
                setSelectedDomain(domain.id);
                if (currentUser?.role === domain.id) {
                  setActiveMode("dossier");
                }
              }}
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative group ${
                isSelected 
                  ? `bg-gradient-to-b ${domain.bgGradient} ${domain.borderColor} ring-2 ring-cyan-500/30 shadow-xl`
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
              }`}
            >
              {isUserActive && (
                <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Logged In
                </span>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                    {domain.avatar}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                      {domain.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {domain.clearance}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  {domain.tagline}
                </p>

                <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  {domain.features.slice(0, 2).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handle1ClickDemoLogin(domain.id);
                  }}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>1-Click Login</span>
                </button>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          statusMessage.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" 
            : statusMessage.type === "error"
            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-200"
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 3. Action Mode Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode("register")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeMode === "register"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/40"
                  : "text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Domain Profile</span>
            </button>

            <button
              onClick={() => setActiveMode("login")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeMode === "login"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/40"
                  : "text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Domain Login</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setActiveMode("dossier")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeMode === "dossier"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/40"
                    : "text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>My Active Domain Dossier</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Selected Domain:</span>
            <strong className="text-cyan-300 font-semibold">{currentDomainInfo.name}</strong>
          </div>
        </div>

        {/* MODE A: REGISTRATION PORTAL */}
        {activeMode === "register" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form */}
            <form onSubmit={handleRegisterSubmit} className="lg:col-span-2 space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Register for {currentDomainInfo.name}</span>
                  <span className="text-lg">{currentDomainInfo.avatar}</span>
                </h3>
                <p className="text-xs text-slate-400">{currentDomainInfo.mission}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name / Representative Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedDomain === "authority" 
                        ? "officer@municipal.gov.in" 
                        : selectedDomain === "researcher" 
                        ? "kavita@university.edu"
                        : "name@example.org"
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure access key"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {selectedDomain === "authority" 
                      ? "Municipal Department / Directorate" 
                      : selectedDomain === "citizen" 
                      ? "Residential Slum / Hamlet / Ward Name"
                      : selectedDomain === "ngo"
                      ? "NGO Name & Registration No."
                      : "Research Institute / University"}
                  </label>
                  <input
                    type="text"
                    value={deptOrWard}
                    onChange={(e) => setDeptOrWard(e.target.value)}
                    placeholder={
                      selectedDomain === "authority"
                        ? "e.g. Water Supply & Sewerage Board"
                        : selectedDomain === "citizen"
                        ? "e.g. Bhim Nagar Transit Colony"
                        : selectedDomain === "ngo"
                        ? "e.g. CleanWater Trust (DARPAN-891)"
                        : "e.g. Dept of Urban AI & Spatial Studies"
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {selectedDomain === "citizen" ? "Primary Spoken Language" : "Official Verification ID / Badge Code"}
                  </label>
                  <input
                    type="text"
                    value={govIdOrRegNo}
                    onChange={(e) => setGovIdOrRegNo(e.target.value)}
                    placeholder={selectedDomain === "citizen" ? "e.g. Hindi, Bengali, Tamil" : "e.g. GOV-MUNICIPAL-4491"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jurisdiction / Target Operational Zone
                  </label>
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  >
                    <option value="All City-Wide Wards">All City-Wide Wards (Global)</option>
                    {communities.map((c) => (
                      <option key={c.id} value={`${c.name} (${c.ward_number || c.district})`}>
                        {c.name} - {c.ward_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950/50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? "Registering Domain Profile..." : `Complete Registration in ${currentDomainInfo.name}`}</span>
                </button>
              </div>
            </form>

            {/* Live Domain Identity Preview Card */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Live Domain Credential Badge
              </span>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {currentDomainInfo.avatar}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {fullName || "Your Full Name"}
                    </h4>
                    <span className="text-[10px] text-cyan-400 font-semibold block">
                      {currentDomainInfo.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {email || "your-email@domain.org"}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] space-y-1 pt-2 border-t border-slate-800 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Clearance:</span>
                    <strong className="text-emerald-400 font-mono">{currentDomainInfo.clearance}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Organization:</span>
                    <span className="truncate max-w-[140px] text-slate-300">{deptOrWard || "Self-Declared"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Zone:</span>
                    <span className="truncate max-w-[140px] text-cyan-300">{jurisdiction || "All City Wards"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300 block">Domain Capabilities:</span>
                {currentDomainInfo.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* MODE B: DOMAIN LOGIN PORTAL */}
        {activeMode === "login" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Standard Login */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-cyan-400" />
                  <span>Domain Authentication Portal</span>
                </h3>
                <p className="text-xs text-slate-400">Enter your domain credentials or use a 1-click evaluation profile.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Domain Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. commissioner@silentneed.gov.in"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Access Key / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950/40 transition cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In to Domain"}
              </button>
            </form>

            {/* 1-Click Domain Shortcuts */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Instant 1-Click Evaluation Profiles
              </span>

              {DOMAINS.map((domain) => {
                const sample = domain.sampleUser;
                return (
                  <div
                    key={domain.id}
                    onClick={() => handle1ClickDemoLogin(domain.id)}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{domain.avatar}</span>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                          {sample?.full_name || domain.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {domain.name} &bull; <span className="text-cyan-400 font-mono">{sample?.email}</span>
                        </div>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-300 text-[10px] font-bold transition">
                      Log In ➔
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* MODE C: ACTIVE DOMAIN DOSSIER */}
        {activeMode === "dossier" && currentUser && (
          <div className="space-y-6">
            
            {/* Persona Hero */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl p-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl">
                  {currentUser.avatar || "🏛️"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">{currentUser.full_name}</h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                      {currentUser.role} Domain
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{currentUser.organization}</p>
                  <p className="text-[11px] text-cyan-400">{currentUser.ward_assigned || "All City Clusters"}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentUser.role === "citizen" && (
                  <button
                    onClick={onOpenCitizenReport}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Report Local Issue</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigateTab("dashboard")}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Go to Geo-Radar</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Domain Security & Permissions Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Security Clearance</span>
                <div className="text-base font-extrabold text-emerald-400 mt-1">Tier 1 Verified</div>
                <span className="text-[10px] text-slate-400">Cryptographically signed session</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Assigned District</span>
                <div className="text-base font-extrabold text-white mt-1 truncate">
                  {currentUser.ward_assigned || "City Wards (HQ)"}
                </div>
                <span className="text-[10px] text-slate-400">Physical & Sensor Coverage</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Domain Privileges</span>
                <div className="text-base font-extrabold text-cyan-400 mt-1">
                  {currentUser.permissions?.length || 6} Capabilities
                </div>
                <span className="text-[10px] text-slate-400">Active role policies unlocked</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Audit Channel</span>
                <div className="text-base font-extrabold text-purple-400 mt-1">Live Relay</div>
                <span className="text-[10px] text-slate-400">Direct to ML Diagnostic Pipeline</span>
              </div>
            </div>

            {/* Privileges Checklist */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Active Domain Permissions & Operational Clearance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(currentUser.permissions || currentDomainInfo.features).map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="capitalize">{typeof perm === 'string' ? perm.replace(/_/g, ' ') : perm}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
