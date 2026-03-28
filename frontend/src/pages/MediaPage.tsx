import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Newspaper, 
  ExternalLink, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  Milestone, 
  Calendar,
  MessageSquare,
  Mail,
  Clock,
  ArrowUpRight
} from 'lucide-react';

const MediaPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  const pressReleases = [
    {
      date: "Oct 12, 2025",
      category: "Launch",
      title: "CredChain Launches Zero-Trust Identity Platform",
      excerpt: "The first national-level blockchain pilot goes live in selected districts of Uttar Pradesh and Karnataka."
    },
    {
      date: "Nov 05, 2025",
      category: "Feature",
      title: "Blockchain-Backed ID Verification Now Available",
      excerpt: "Major milestone reached as PAN and Aadhaar linking service integration completes successfully."
    },
    {
      date: "Dec 18, 2025",
      category: "Security",
      title: "Emergency Access QR Feature Goes Live",
      excerpt: "A life-saving innovation that allows first responders to access critical identity and health info in seconds."
    }
  ];

  const screenshots = [
    "Citizen Portal",
    "Officer Dashboard",
    "Audit Trail",
    "Regional Heatmap",
    "Emergency Access Page"
  ];

  const downloadables = [
    { title: "Project Brief (PDF)", size: "2.4 MB", icon: <FileText /> },
    { title: "Architecture Diagram", size: "1.2 MB", icon: <ImageIcon /> },
    { title: "Technical Whitepaper", size: "4.8 MB", icon: <FileText /> }
  ];

  const cardStyle = isDarkMode 
    ? "bg-[#0f0f11] border-white/10 hover:border-orange-500/30 text-white" 
    : "bg-white border-slate-200 hover:border-orange-200 text-slate-900 shadow-sm";

  return (
    <div className={`min-h-screen pt-24 pb-16 px-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
      <div className="container mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Hero */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-4 text-orange-500 font-bold uppercase tracking-widest text-xs">
            <Newspaper size={18} />
            News & Updates
          </div>
          <h1 className={`text-4xl md:text-6xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            CredChain in <br />the News
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            The latest announcements, press releases, and media resources for the 
            India Zero-Trust Governance initiative.
          </p>
        </section>

        {/* Featured Card */}
        <section className="mb-32">
          <div className={`group relative overflow-hidden rounded-[2.5rem] border p-8 md:p-16 transition-all duration-500 ${
            isDarkMode ? 'bg-gradient-to-br from-blue-900/40 to-transparent border-white/10' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-xl'
          }`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-lg shadow-blue-500/20">
                  Featured Insight
                </span>
                <h2 className={`text-3xl md:text-4xl font-bold mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Blueprint for a National Digitized Infrastructure
                </h2>
                <p className="text-lg text-slate-500 mb-10 leading-relaxed italic">
                  "CredChain isn't just a database; it's a verifiable trust layer that changes how 
                  citizens interact with the state."
                </p>
                <button className={`flex items-center gap-2 font-bold group-hover:gap-4 transition-all ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
                  Read Full Assessment <ArrowUpRight size={20} />
                </button>
              </div>
              <div className={`aspect-video rounded-3xl overflow-hidden border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-blue-200'}`}>
                <div className="w-full h-full flex items-center justify-center">
                   <Milestone size={64} className="text-blue-500 opacity-20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Press Releases */}
        <section className="mb-32">
          <h3 className={`text-2xl font-bold mb-10 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Latest Press Releases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pressReleases.map((release, i) => (
              <div key={i} className={`p-8 rounded-[2rem] border flex flex-col group cursor-pointer transition-all ${cardStyle}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <Calendar size={12} />
                    {release.date}
                  </div>
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{release.category}</span>
                </div>
                <h4 className="text-xl font-bold mb-4 leading-tight group-hover:text-orange-500 transition-colors">{release.title}</h4>
                <p className={`text-sm mb-10 flex-grow ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {release.excerpt}
                </p>
                <div className="flex items-center gap-1 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More <ExternalLink size={12} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Screenshots */}
        <section className="mb-32">
          <h3 className={`text-2xl font-bold mb-10 text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Visualizing the System</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {screenshots.map((screen) => (
              <div key={screen} className={`aspect-[4/3] rounded-2xl border flex flex-col transition-all overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:shadow-lg'}`}>
                <div className="flex-grow flex items-center justify-center">
                  <ImageIcon size={40} className="text-slate-500 opacity-20" />
                </div>
                <div className={`p-4 text-center font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                  {screen}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Download Kit */}
        <section className="mb-32 py-16 border-y border-dashed border-slate-700/20">
          <div className="text-center mb-16">
            <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Press Kit</h3>
            <p className="text-slate-500">Fast-tracked assets for journalists and analysts.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {downloadables.map((item, i) => (
              <button key={i} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${
                isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200 hover:border-orange-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="text-blue-500">{item.icon}</div>
                  <div className="text-left">
                    <div className="font-bold">{item.title}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{item.size}</div>
                  </div>
                </div>
                <Download size={20} className="text-slate-500" />
              </button>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className={`rounded-[3rem] p-12 text-center ${isDarkMode ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-orange-600'}`}>
          <div className="flex justify-center mb-6"><MessageSquare size={48} /></div>
          <h2 className="text-3xl font-black mb-4">Press Inquiries</h2>
          <p className={`max-w-xl mx-auto mb-10 text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            For all media requests, interviews, and detailed whitepapers, please contact our 
            communication desk.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="flex items-center gap-3">
              <Mail className="opacity-50" />
              <span className="font-bold font-mono text-sm md:text-base">anurajupadhyay6@gmail.com</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-current opacity-20" />
            <div className="flex items-center gap-3">
              <Clock className="opacity-50" />
              <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs">Response time: ~24 Hours</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default MediaPage;
