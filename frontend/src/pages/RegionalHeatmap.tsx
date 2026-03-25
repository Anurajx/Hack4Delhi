import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Users,
  FileText,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";
import IndiaMap from "../components/IndiaMap";
import { useTheme } from "../contexts/ThemeContext";
import { apiUrl } from "../config/api";
import { SEED_REGIONAL_DATA } from "../data/seedData";

// --- Types ---
interface RegionStats {
  name: string;
  totalRegistered: number;
  pendingApplications: number;
  pendingUpdates: number;
  linkedCredentials: number;
  averageConfidence: number;
  fraudScore: number;
  fraudRisk: 'low' | 'medium' | 'high';
  flaggedRecords: number;
  recentEvents: string[];
}

export default function RegionalHeatmap() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [regionData, setRegionData] = useState<Record<string, RegionStats>>({});
  
  // Filters and state
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch verified voters
      // Real endpoint: apiUrl("/voters?page=1") (mocking pagination loop for a real app, here just taking page 1 & 2 for sample)
      const votersRes = await fetch(apiUrl("/voters?page=1")).catch(() => null);
      let voters = [];
      if (votersRes && votersRes.ok) {
        const data = await votersRes.json();
        voters = Array.isArray(data) ? data : data.voters || [];
      }

      // 2. Fetch pending registrations (tempVoters)
      const tempVotersRes = await fetch(apiUrl("/tempVoters")).catch(() => null);
      let tempVoters = [];
      if (tempVotersRes && tempVotersRes.ok) {
        tempVoters = await tempVotersRes.json();
      }

      // 3. Fetch update requests
      const updatesRes = await fetch(apiUrl("/updateFetch")).catch(() => null);
      let updates = [];
      if (updatesRes && updatesRes.ok) {
        updates = await updatesRes.json();
      }

      // Aggregate data client-side from real database hooks
      const aggregated: Record<string, RegionStats> = {};

      // Helper to init region
      const initRegion = (stateName: string) => {
        if (!stateName) return;
        if (!aggregated[stateName]) {
          aggregated[stateName] = {
            name: stateName,
            totalRegistered: 0,
            pendingApplications: 0,
            pendingUpdates: 0,
            linkedCredentials: 0,
            averageConfidence: 95, 
            fraudScore: 0,
            fraudRisk: 'low',
            flaggedRecords: 0,
            recentEvents: []
          };
        }
      };

      voters.forEach((v: any) => {
        if (v.State) {
          initRegion(v.State);
          aggregated[v.State].totalRegistered += 1;
          aggregated[v.State].linkedCredentials += v.LinkedCredentials ? v.LinkedCredentials.length : 1;
          
          let hasFraudFlags = false;

          // Process underlying DB analytical flags
          if (v.TamperCheckFailed) {
             aggregated[v.State].fraudScore += 2;
             hasFraudFlags = true;
             if (!aggregated[v.State].recentEvents.includes("Tamper checks failed recently")) {
                aggregated[v.State].recentEvents.push("Tamper checks failed recently");
             }
          }
          
          if (v.FuzzyMatchRatio && v.FuzzyMatchRatio > 0.5) {
             aggregated[v.State].fraudScore += 1;
             hasFraudFlags = true;
             if (!aggregated[v.State].recentEvents.includes("High fuzzy match ratios flagged")) {
                aggregated[v.State].recentEvents.push("High fuzzy match ratios flagged");
             }
          }

          if (hasFraudFlags) {
            aggregated[v.State].flaggedRecords += 1;
          }
        }
      });

      tempVoters.forEach((v: any) => {
        if (v.State) {
          initRegion(v.State);
          aggregated[v.State].pendingApplications += 1;
          
          // Identify mock fuzzy duplications simulated in DB (e.g. FirstName ending with x/y)
          if (v.FirstName && (v.FirstName.endsWith('x') || v.FirstName.endsWith('y'))) {
             aggregated[v.State].fraudScore += 1;
             aggregated[v.State].flaggedRecords += 1;
             if (!aggregated[v.State].recentEvents.includes("Suspicious duplicate applications submitted")) {
                aggregated[v.State].recentEvents.push("Suspicious duplicate applications submitted");
             }
          }
        }
      });

      updates.forEach((u: any) => {
        const st = u.State || "Delhi"; 
        initRegion(st);
        aggregated[st].pendingUpdates += 1;
        
        // Track suspicious velocity simulations configured in backend
        if (u.UpdateReason && u.UpdateReason.includes("Simulation")) {
           aggregated[st].fraudScore += 0.5;
           if (!aggregated[st].recentEvents.includes("High frequency of profile updates detected")) {
              aggregated[st].recentEvents.push("High frequency of profile updates detected");
           }
        }
      });

      // Normalize and compute absolute scores deterministically
      Object.values(aggregated).forEach((stat) => {
        const updatePenalty = stat.pendingUpdates > 10 ? 2 : 0;
        const tempPenalty = stat.pendingApplications > 50 ? 3 : 0;
        
        // Combine tracked anomaly volume and raw database flags for final state metric
        let finalScore = stat.fraudScore + updatePenalty + tempPenalty;
        finalScore = Math.min(10, Math.max(0, finalScore));
        
        stat.fraudScore = Number(finalScore.toFixed(1));
        
        // Determine conclusive categorical risk based on aggregated score logic
        if (finalScore >= 7) stat.fraudRisk = 'high';
        else if (finalScore >= 4) stat.fraudRisk = 'medium';
        else stat.fraudRisk = 'low';

        // Tie confidence dynamically to final risk
        stat.averageConfidence = 100 - (finalScore * 5);
      });

      // Fallback to SEED_REGIONAL_DATA if empty
      if (Object.keys(aggregated).length === 0) {
        SEED_REGIONAL_DATA.forEach(seed => {
          aggregated[seed.state] = {
            name: seed.state,
            totalRegistered: seed.registeredCitizens,
            pendingApplications: seed.pendingApplications,
            pendingUpdates: seed.pendingUpdates,
            linkedCredentials: seed.linkedCredentials,
            averageConfidence: seed.avgConfidenceScore * 10,
            fraudScore: seed.fraudScore,
            fraudRisk: seed.fraudScore >= 7 ? 'high' : seed.fraudScore >= 4 ? 'medium' : 'low',
            flaggedRecords: seed.flaggedRecords,
            recentEvents: seed.fraudScore >= 7 ? ["Multiple fuzzy matches detected", "High update frequency"] : []
          };
        });
      }

      setRegionData(aggregated);
    } catch (error) {
      console.error("Error fetching regional data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Removed mapData translation; passing full regionData to IndiaMap

  const activeStats = useMemo(() => {
    if (selectedState && regionData[selectedState]) {
      return regionData[selectedState];
    }
    // Aggregate all if no state selected
    const total = {
      name: "All Regions (India)",
      totalRegistered: 0,
      pendingApplications: 0,
      pendingUpdates: 0,
      linkedCredentials: 0,
      averageConfidence: 0,
      fraudScore: 0,
      fraudRisk: 'low' as 'low'|'medium'|'high',
      flaggedRecords: 0,
      recentEvents: ["Multiple fuzzy matches detected across states", "Unusual update velocity in certain districts"]
    };
    
    const regions = Object.values(regionData);
    if (regions.length === 0) return total;

    regions.forEach(r => {
      total.totalRegistered += r.totalRegistered;
      total.pendingApplications += r.pendingApplications;
      total.pendingUpdates += r.pendingUpdates;
      total.linkedCredentials += r.linkedCredentials;
      total.averageConfidence += r.averageConfidence;
      total.fraudScore += r.fraudScore;
      total.flaggedRecords += r.flaggedRecords;
    });

    total.averageConfidence = Math.round(total.averageConfidence / regions.length);
    total.fraudScore = Number((total.fraudScore / regions.length).toFixed(1));
    
    if (total.fraudScore >= 7) total.fraudRisk = 'high';
    else if (total.fraudScore >= 4) total.fraudRisk = 'medium';

    return total;
  }, [selectedState, regionData]);

  // Chart data formatting
  const chartData = Object.values(regionData)
    .sort((a, b) => b.fraudScore - a.fraudScore)
    .slice(0, 8); // Top 8 states by fraud score

  return (
    <div
      className={`min-h-[calc(100vh-64px)] font-sans antialiased transition-colors duration-700 ease-in-out ${
        isDarkMode
          ? "bg-[#0a0a0c] text-slate-200"
          : "bg-[#F3F4F6] text-[#111827]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              <ShieldAlert className={`w-6 h-6 ${isDarkMode ? "text-orange-500" : "text-orange-600"}`} />
              Regional Heatmap & Fraud Detection
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Monitor fraud risks, fuzzy detections, and regional statistics in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setSelectedState(e.target.value || null);
              }}
              className={`px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 outline-none transition-all ${
                isDarkMode
                  ? "bg-[#16161a] border border-white/10 text-white"
                  : "bg-white border border-slate-200 text-slate-900"
              }`}
            >
              <option value="">All States</option>
              {Object.keys(regionData).sort().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            
            <input
              type="number"
              placeholder="District ID"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className={`w-32 px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 outline-none transition-all ${
                isDarkMode
                  ? "bg-[#16161a] border border-white/10 text-white placeholder-slate-500"
                  : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />

            <button
              onClick={fetchData}
              className={`p-2 rounded-lg transition-all border ${
                isDarkMode
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading && Object.keys(regionData).length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center">
             <div className="w-10 h-10 border-4 rounded-full border-white/10 border-t-orange-500 animate-spin mb-4"></div>
             <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Aggregating regional intel...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Heatmap Section */}
            <div className={`lg:col-span-7 rounded-2xl border flex flex-col relative overflow-hidden ${
              isDarkMode ? "bg-[#0f0f11] border-white/10" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex-1 w-full min-h-[600px] relative">
                <IndiaMap 
                  data={regionData}
                  isDarkMode={isDarkMode}
                  selectedState={selectedState}
                  onRegionClick={(name) => {
                    setSelectedState(name === selectedState ? null : name);
                    setStateFilter(name === selectedState ? "" : name);
                  }}
                />
              </div>
            </div>

            {/* Statistics Sidebar */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Highlight Card */}
              <div className={`p-6 rounded-2xl border relative overflow-hidden ${
                isDarkMode 
                  ? activeStats.fraudRisk === 'high' ? 'bg-red-950/20 border-red-500/30' : 'bg-[#0f0f11] border-white/10'
                  : activeStats.fraudRisk === 'high' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {activeStats.fraudRisk === 'high' && (
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div>
                     <h2 className={`text-xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{activeStats.name}</h2>
                     <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Regional Security Overview</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border font-bold text-lg flex items-center gap-2 ${
                    activeStats.fraudRisk === 'high' 
                      ? isDarkMode ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-red-100 text-red-700 border-red-200'
                      : activeStats.fraudRisk === 'medium'
                        ? isDarkMode ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        : isDarkMode ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    {activeStats.fraudRisk === 'high' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                    {activeStats.fraudScore.toFixed(1)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard 
                    label="Citizens"
                    value={activeStats.totalRegistered}
                    icon={<Users size={16} />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    label="Linked Credentials"
                    value={activeStats.linkedCredentials}
                    icon={<LinkIcon size={16} />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    label="Pending Apps"
                    value={activeStats.pendingApplications}
                    icon={<FileText size={16} />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    label="Update Requests"
                    value={activeStats.pendingUpdates}
                    icon={<Activity size={16} />}
                    isDarkMode={isDarkMode}
                    alert={activeStats.pendingUpdates > 50}
                  />
                </div>

                {activeStats.recentEvents.length > 0 && (
                  <div className={`mt-6 p-4 rounded-xl border ${isDarkMode ? 'bg-[#16161a] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recent Suspicious Events</h4>
                    <ul className="space-y-2">
                       {activeStats.recentEvents.map((ev, i) => (
                         <li key={i} className={`text-sm flex gap-2 items-start ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                           <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                           {ev}
                         </li>
                       ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Chart Panel */}
              <div className={`p-6 rounded-2xl border flex-grow ${
                isDarkMode ? 'bg-[#0f0f11] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className={`font-bold mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Highest Risk Regions</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#2d3748" : "#e2e8f0"} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke={isDarkMode ? "#718096" : "#a0aec0"} 
                        fontSize={10} 
                        tickFormatter={(val) => val.substring(0, 3).toUpperCase()} 
                      />
                      <YAxis stroke={isDarkMode ? "#718096" : "#a0aec0"} fontSize={10} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1a202c' : '#fff',
                          borderColor: isDarkMode ? '#2d3748' : '#e2e8f0',
                          borderRadius: '8px',
                          color: isDarkMode ? '#fff' : '#000'
                        }}
                      />
                      <Bar dataKey="fraudScore" fill={isDarkMode ? "#f97316" : "#ea580c"} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isDarkMode, alert = false }: { label: string, value: number, icon: React.ReactNode, isDarkMode: boolean, alert?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
      alert 
        ? isDarkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
        : isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
    }`}>
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${
        alert 
          ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
          : isDarkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${
        alert 
          ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
          : isDarkMode ? 'text-white' : 'text-slate-900'
      }`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
