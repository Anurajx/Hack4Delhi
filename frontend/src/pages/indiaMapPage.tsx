import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
import { Users, Activity, Copy, MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { apiUrl } from "../config/api";

interface StateStats {
  State: string;
  additions: number;
  updations: number;
  duplications: number;
}

const IndiaMapPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  // const navigate = useNavigate();
  const [stats, setStats] = useState<StateStats[]>([]);
  const [hoveredState, setHoveredState] = useState<StateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/state-stats"));
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.message || `Server error ${response.status}`);
        return;
      }
      const data = await response.json();
      setStats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch state stats:", err);
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const sortedStats = useMemo(() => [...stats].sort((a, b) => b.additions - a.additions), [stats]);
  const maxAdditions = stats.length > 0 ? Math.max(...stats.map((s) => s.additions)) : 1;
  const totalAdditions = stats.reduce((sum, s) => sum + s.additions, 0);
  const totalDuplications = stats.reduce((sum, s) => sum + s.duplications, 0);
  const totalUpdations = stats.reduce((sum, s) => sum + s.updations, 0);

  const getHeatColor = (value: number): string => {
    const ratio = value / maxAdditions;
    if (ratio > 0.85) return isDarkMode ? "bg-orange-500" : "bg-orange-500";
    if (ratio > 0.6) return isDarkMode ? "bg-amber-500" : "bg-amber-500";
    if (ratio > 0.35) return isDarkMode ? "bg-yellow-400" : "bg-yellow-400";
    if (ratio > 0.1) return isDarkMode ? "bg-blue-500" : "bg-blue-500";
    return isDarkMode ? "bg-slate-600" : "bg-slate-300";
  };

  const getRankBadge = (idx: number) => {
    if (idx === 0) return { label: "1", cls: "bg-orange-500 text-white" };
    if (idx === 1) return { label: "2", cls: isDarkMode ? "bg-slate-600 text-slate-200" : "bg-slate-300 text-slate-700" };
    if (idx === 2) return { label: "3", cls: isDarkMode ? "bg-yellow-700/60 text-yellow-300" : "bg-yellow-200 text-yellow-800" };
    return { label: `${idx + 1}`, cls: isDarkMode ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400" };
  };

  const bg = isDarkMode ? "bg-[#0a0a0c]" : "bg-[#f4f5f7]";
  const card = isDarkMode ? "bg-[#111113] border-white/[0.07]" : "bg-white border-slate-200";
  const text = isDarkMode ? "text-slate-200" : "text-slate-900";
  const muted = isDarkMode ? "text-slate-500" : "text-slate-400";
  const divider = isDarkMode ? "border-white/[0.06]" : "border-slate-100";

  return (
    <div className={`min-h-screen w-full font-sans antialiased ${bg} ${text}`}>


      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            National Coverage
          </h1>
          <p className={`text-sm ${muted}`}>
            State-wise voter registration, update requests, and flagged duplicate identities
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Additions", value: totalAdditions, icon: TrendingUp, color: isDarkMode ? "text-emerald-400" : "text-emerald-600", accent: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50" },
            { label: "Pending Updates", value: totalUpdations, icon: Activity, color: isDarkMode ? "text-blue-400" : "text-blue-600", accent: isDarkMode ? "bg-blue-500/10" : "bg-blue-50" },
            { label: "Flagged Duplicates", value: totalDuplications, icon: AlertTriangle, color: isDarkMode ? "text-red-400" : "text-red-600", accent: isDarkMode ? "bg-red-500/10" : "bg-red-50" },
          ].map(({ label, value, icon: Icon, color, accent }) => (
            <div key={label} className={`rounded-2xl border p-5 ${card}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {loading ? "—" : value.toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${muted}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Table panel */}
          <div className={`rounded-2xl border overflow-hidden ${card}`}>
            {/* Table header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <h2 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                State Directory
              </h2>
              <span className={`text-xs ${muted}`}>{sortedStats.length} states</span>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${muted}`}>Aggregating national data…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <AlertTriangle className={`w-10 h-10 ${isDarkMode ? "text-red-500/60" : "text-red-400"}`} />
                <p className={`text-sm font-medium ${isDarkMode ? "text-red-400" : "text-red-600"}`}>Failed to load data</p>
                <p className={`text-xs max-w-xs text-center ${muted}`}>{error}</p>
                <button onClick={fetchStats} className={`mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${isDarkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
                  Retry
                </button>
              </div>
            ) : sortedStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-40">
                <MapPin className="w-10 h-10" />
                <p className="text-sm">No state records found in ledger.</p>
              </div>
            ) : (
              <div className="overflow-auto" style={{ maxHeight: "540px" }}>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className={`sticky top-0 z-10 ${isDarkMode ? "bg-[#111113]" : "bg-white"}`}>
                      {["#", "State", "Additions", "Updates", "Duplicates", "Density"].map((h, i) => (
                        <th
                          key={h}
                          className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider border-b ${divider} ${muted} ${i === 0 ? "w-10" : ""} ${i >= 2 ? "text-right" : ""} ${i === 5 ? "w-40" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStats.map((s, idx) => {
                      const badge = getRankBadge(idx);
                      const fillPct = maxAdditions > 0 ? (s.additions / maxAdditions) * 100 : 0;
                      const isHovered = hoveredState?.State === s.State;

                      return (
                        <tr
                          key={s.State}
                          onMouseEnter={() => setHoveredState(s)}
                          onMouseLeave={() => setHoveredState(null)}
                          className={`border-b transition-colors cursor-default ${divider} ${isHovered
                            ? isDarkMode ? "bg-white/[0.04]" : "bg-orange-50/60"
                            : isDarkMode ? "hover:bg-white/[0.025]" : "hover:bg-slate-50"
                            }`}
                        >
                          {/* Rank */}
                          <td className="py-3 px-4">
                            <span className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          {/* State name */}
                          <td className={`py-3 px-4 font-medium whitespace-nowrap ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                            {s.State}
                          </td>
                          {/* Additions */}
                          <td className={`py-3 px-4 text-right font-mono font-semibold tabular-nums ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                            {s.additions.toLocaleString()}
                          </td>
                          {/* Updations */}
                          <td className={`py-3 px-4 text-right font-mono tabular-nums ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                            {s.updations.toLocaleString()}
                          </td>
                          {/* Duplications */}
                          <td className={`py-3 px-4 text-right font-mono tabular-nums ${s.duplications > 0
                            ? isDarkMode ? "text-red-400 font-semibold" : "text-red-600 font-semibold"
                            : muted
                            }`}>
                            {s.duplications > 0 ? s.duplications.toLocaleString() : "—"}
                          </td>
                          {/* Heat bar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${getHeatColor(s.additions)}`}
                                  style={{ width: `${Math.max(fillPct, 1.5)}%` }}
                                />
                              </div>
                              <span className={`text-[10px] w-8 text-right font-mono ${muted}`}>
                                {Math.round(fillPct)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className={`rounded-2xl border ${card} self-start sticky top-24`}>
            {hoveredState ? (
              <div className="p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${isDarkMode ? "bg-orange-500/10" : "bg-orange-50"}`}>
                    <MapPin className={`w-5 h-5 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {hoveredState.State}
                    </h3>
                    <p className={`text-xs mt-0.5 ${muted}`}>
                      #{sortedStats.findIndex(s => s.State === hoveredState.State) + 1} by additions
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "New Additions", value: hoveredState.additions, icon: Users, color: isDarkMode ? "text-emerald-400" : "text-emerald-600", bg: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50" },
                    { label: "Pending Updates", value: hoveredState.updations, icon: Activity, color: isDarkMode ? "text-blue-400" : "text-blue-600", bg: isDarkMode ? "bg-blue-500/10" : "bg-blue-50" },
                    { label: "Flagged Duplicates", value: hoveredState.duplications, icon: Copy, color: isDarkMode ? "text-red-400" : "text-red-600", bg: isDarkMode ? "bg-red-500/10" : "bg-red-50" },
                  ].map(({ label, value, icon: Icon, color, bg: iconBg }) => (
                    <div key={label} className={`flex items-center justify-between p-4 rounded-xl border ${isDarkMode ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${iconBg}`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <span className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
                      </div>
                      <span className={`text-base font-bold tabular-nums ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Share of national total */}
                {totalAdditions > 0 && (
                  <div className={`mt-5 pt-5 border-t ${divider}`}>
                    <p className={`text-xs mb-3 ${muted}`}>Share of national additions</p>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                        style={{ width: `${(hoveredState.additions / totalAdditions) * 100}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1.5 text-right font-mono ${muted}`}>
                      {((hoveredState.additions / totalAdditions) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-slate-100"}`}>
                  <MapPin className={`w-6 h-6 ${muted}`} />
                </div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Select a state</p>
                <p className={`text-xs mt-1 ${muted}`}>Hover over any row to view detailed statistics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndiaMapPage;
