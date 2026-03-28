import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  Shield,
  Users,
  Cpu,
  Zap,
  ArrowRight,
  Database,
  Search,
  QrCode,
  History,
  Layers,
  Activity,
  Mail
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const ingestionStats = [
    { value: "1.3B+", sub: "Aadhaar IDs Issued" },
    { value: "650M+", sub: "PAN Cards Issued" },
    { value: "1.5B+", sub: "DigiLocker Documents Issued" },
    { value: "320M+", sub: "Driving Licenses Issued" },
    { value: "90%+", sub: "Adult Aadhaar Coverage" },
    { value: "400M+", sub: "Jan Dhan Bank Accounts" },
  ];

  const architectureLayers = [
    { icon: <Users size={24} />, title: "User Interaction", desc: "Citizen and Officer gateways with biometric/OTP MFA." },
    { icon: <Shield size={24} />, title: "Verification", desc: "Automated fuzzy logic & manual officer verification flow." },
    { icon: <Cpu size={24} />, title: "National ID Server", desc: "Core routing engine for cross-departmental data sync." },
    { icon: <Database size={24} />, title: "Secure Database", desc: "Encrypted MongoDB storage for personal identifiable information." },
    { icon: <Zap size={24} />, title: "Blockchain Integrity", desc: "Solidity smart contracts on Polygon for immutable audit logs." },
    { icon: <Activity size={24} />, title: "Threat Detection", desc: "Real-time fraud monitoring and confidence scoring engine." },
  ];

  const workflowSteps = [
    { title: "Registration", desc: "Citizen submits primary details via the portal." },
    { title: "Officer Verification", desc: "Regional officers validate documents for accuracy." },
    { title: "UVID Generation", desc: "Unique Virtual Identity generated via cryptographic hashing." },
    { title: "Credential Linking", desc: "Aadhaar, PAN, and other IDs linked to the UVID." },
    { title: "Audit Trail", desc: "All actions recorded on the blockchain for transparency." },
  ];

  const techStack = [
    { name: "React / Tailwind", category: "Frontend", icon: <Layers size={20} /> },
    { name: "Node.js / Express", category: "Backend", icon: <Cpu size={20} /> },
    { name: "MongoDB", category: "Database", icon: <Database size={20} /> },
    { name: "Solidity / Polygon", category: "Blockchain", icon: <Shield size={20} /> },
    { name: "ethers.js", category: "Web3", icon: <Zap size={20} /> },
    { name: "Fuzzball", category: "Matching", icon: <Search size={20} /> },
  ];

  const keyFeatures = [
    { icon: <Search />, title: "Fuzzy Duplicate Detection", desc: "Advanced string matching to prevent multiple UVIDs for one person." },
    { icon: <Shield />, title: "Tamper Detection", desc: "Instant alerts if off-chain data deviates from blockchain hashes." },
    { icon: <Activity />, title: "Confidence Scoring", desc: "AI-driven risk assessment for every identity link request." },
    { icon: <QrCode />, title: "Emergency Access QR", desc: "Instant medical/identity access for first responders via secure QR." },
    { icon: <History />, title: "Immutable Logs", desc: "Every verification step is permanently etched on the Polygon network." },
  ];

  const cardStyle = isDarkMode
    ? "bg-[#0f0f11] border-white/10 hover:border-orange-500/30 text-white"
    : "bg-white border-slate-200 hover:border-orange-200 text-slate-900 shadow-sm";

  return (
    <div className={`min-h-screen pt-24 pb-16 px-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
      <div className="container mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Hero Section */}
        <section className="text-center mb-24 py-12">
          <h1 className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            CredChain India <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-blue-500 to-emerald-500">
              Zero-Trust Digital Identity
            </span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto font-light leading-relaxed mb-10">
            A unified, blockchain-backed ecosystem designed to solve identity fragmentation
            and eliminate data tampering in India's digital landscape.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/citizen-portal')}
              className="px-8 py-3 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="mb-32">
          <div className={`rounded-3xl p-8 md:p-12 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-orange-50/50 border-orange-100'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>The Challenge</h2>
                <div className="space-y-4 text-lg">
                  <p>
                    India's identity infrastructure, while massive, remains fragmented. Citizens often juggle
                    multiple IDs — Aadhaar, PAN, Voter ID, Driving License — which aren't natively linked, leading to data silos.
                  </p>
                  <p>
                    This fragmentation opens doors for <strong>insider tampering</strong>, <strong>identity theft</strong>,
                    and leaves underserved populations like <strong>newborns and immigrants</strong> in a documentation limbo.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Fragmented IDs", icon: <Layers className="text-orange-500" /> },
                  { label: "Insider Risks", icon: <Shield className="text-blue-500" /> },
                  { label: "Data Silos", icon: <Database className="text-emerald-500" /> },
                  { label: "Underserved Focus", icon: <Users className="text-purple-500" /> },
                ].map((item, i) => (
                  <div key={i} className={`p-6 rounded-2xl border flex flex-col items-center text-center gap-3 ${isDarkMode ? 'bg-[#0a0a0c] border-white/5' : 'bg-white border-slate-200'}`}>
                    {item.icon}
                    <span className="font-semibold text-sm uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Solution Architecture */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Solution Architecture</h2>
            <p className="text-slate-500">A multi-layered approach to absolute digital trust.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {architectureLayers.map((layer, i) => (
              <div key={i} className={`p-8 rounded-2xl border transition-all group ${cardStyle}`}>
                <div className="mb-6 p-4 rounded-xl bg-blue-500/10 text-blue-500 w-fit group-hover:scale-110 transition-transform">
                  {layer.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{layer.title}</h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {layer.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>How It Works</h2>
          </div>
          <div className="relative">
            {/* Connection Line */}
            <div className={`absolute top-1/2 left-0 right-0 h-0.5 hidden md:block -translate-y-1/2 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {workflowSteps.map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-6 z-10 ${isDarkMode ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-orange-600 text-white shadow-lg'
                    }`}>
                    {i + 1}
                  </div>
                  <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{step.title}</h4>
                  <p className="text-xs text-slate-500 px-4">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Tech Stack</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech, i) => (
              <div key={i} className={`px-6 py-4 rounded-xl border flex items-center gap-3 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className="text-blue-500">{tech.icon}</span>
                <div>
                  <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{tech.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">{tech.category}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Core Innovations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {keyFeatures.map((feature, i) => (
              <div key={i} className={`p-8 rounded-3xl border transition-all ${cardStyle}`}>
                <div className={`mb-6 p-3 rounded-lg w-fit ${isDarkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Banner */}
        <section className="mb-32">
          <div className={`rounded-3xl p-10 border overflow-hidden relative ${isDarkMode ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
              {ingestionStats.map((stat, i) => (
                <div key={i}>
                  <div className={`text-2xl md:text-3xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-emerald-700'}`}>{stat.value}</div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team/Contact */}
        <section className="text-center py-12 border-t border-dashed border-slate-700/30">
          <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Get in Touch</h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            CredChain India is an open-source initiative aimed at revolutionizing national identity.
            For technical inquiries or collaboration, reach out to our team.
          </p>
          <a
            href="mailto:credchain@gmail.com"
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-slate-900 border-transparent text-white hover:bg-slate-800'
              }`}
          >
            <Mail size={20} />
            <span className="font-semibold">credchain@gmail.com</span>
          </a>
        </section>

      </div>
    </div>
  );
};

export default AboutPage;
