import React, { useState } from "react";
import { 
  X, Shield, User, Building, HeartHandshake, CheckCircle2, 
  ArrowRight, KeyRound, Mail, Lock, Sparkles, UserPlus, LogIn
} from "lucide-react";
import { DEMO_ACCOUNTS, loginDemoRole, loginUser, registerUser } from "../services/api";
import { TRANSLATIONS } from "../i18n/translations";

export default function AuthModal({ isOpen, onClose, onAuthSuccess, currentLang = "en" }) {
  if (!isOpen) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [activeTab, setActiveTab] = useState("demo"); // "demo", "login", "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("citizen");
  const [regOrg, setRegOrg] = useState("");

  const handleDemoSelect = async (roleKey) => {
    setLoading(true);
    setError("");
    try {
      const user = await loginDemoRole(roleKey);
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError("Unable to switch to demo role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await loginUser(loginEmail, loginPassword);
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError("Please complete all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await registerUser({
        full_name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        organization: regOrg
      });
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError("Registration failed. Please try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.authSignIn} / {t.authSwitchRole}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  RBAC
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                SilentNeed AI Multi-Role Civic Access Gateway
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("demo")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "demo"
                ? "bg-cyan-500 text-slate-950 shadow font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.authOneClickDemo}</span>
          </button>

          <button
            onClick={() => setActiveTab("login")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "login"
                ? "bg-cyan-500 text-slate-950 shadow font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t.authSignIn}</span>
          </button>

          <button
            onClick={() => setActiveTab("register")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "register"
                ? "bg-cyan-500 text-slate-950 shadow font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.authSignUp}</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* TAB 1: 1-Click Role Switcher (Pre-configured Personas) */}
          {activeTab === "demo" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Experience SilentNeed AI from different civic perspectives. Click any role below to instantly log in:
              </p>

              {DEMO_ACCOUNTS.map((acc) => {
                const isAuthority = acc.role === "authority";
                const isNgo = acc.role === "ngo";
                const isCitizen = acc.role === "citizen";

                return (
                  <div
                    key={acc.id}
                    onClick={() => handleDemoSelect(acc.role)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 group ${
                      isAuthority
                        ? "bg-slate-800/60 hover:bg-cyan-950/30 border-slate-700 hover:border-cyan-500/50"
                        : isNgo
                        ? "bg-slate-800/60 hover:bg-emerald-950/30 border-slate-700 hover:border-emerald-500/50"
                        : "bg-slate-800/60 hover:bg-amber-950/30 border-slate-700 hover:border-amber-500/50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                        {acc.avatar}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                            {isAuthority ? t.authRoleAuthority : (isNgo ? t.authRoleNgo : t.authRoleCitizen)}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              isAuthority
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                                : isNgo
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {acc.role}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-300">
                          {acc.full_name} &bull; <span className="text-slate-400">{acc.organization}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {isAuthority ? t.authRoleAuthorityDesc : (isNgo ? t.authRoleNgoDesc : t.authRoleCitizenDesc)}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={loading}
                      className="shrink-0 p-2 rounded-lg bg-slate-700/60 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-300 transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Standard Sign In */}
          {activeTab === "login" && (
            <form onSubmit={handleStandardLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. commissioner@silentneed.gov.in"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail("commissioner@silentneed.gov.in");
                    setLoginPassword("demo1234");
                  }}
                  className="text-cyan-400 hover:underline"
                >
                  Auto-fill Authority Demo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail("sunita.devi@citizen.org");
                    setLoginPassword("demo1234");
                  }}
                  className="text-amber-400 hover:underline"
                >
                  Auto-fill Citizen Demo
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
              >
                {loading ? "Authenticating..." : t.authSignIn}
              </button>
            </form>
          )}

          {/* TAB 3: Register New Account */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ramesh@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  >
                    <option value="citizen">{t.authRoleCitizen}</option>
                    <option value="authority">{t.authRoleAuthority}</option>
                    <option value="ngo">{t.authRoleNgo}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Organization / Ward
                  </label>
                  <input
                    type="text"
                    value={regOrg}
                    onChange={(e) => setRegOrg(e.target.value)}
                    placeholder="e.g. Ward 42-B Council"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition disabled:opacity-50 mt-2"
              >
                {loading ? "Creating Account..." : t.authSignUp}
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role-Based Access Control Active</span>
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
