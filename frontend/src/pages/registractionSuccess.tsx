import { useState, useEffect } from "react";
import { Check, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Main Application Component
export default function RegistrationSuccess() {
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Staggered animation effect
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1115] text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Ambience / Blobs */}
      <div
        className={`fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none transition-opacity duration-1000 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`fixed bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none transition-opacity duration-1000 delay-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Card */}
        <div
          className={`w-full max-w-md bg-[#1a1d24]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl ring-1 ring-white/10 transition-all duration-700 ease-out transform ${
            showContent
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-95"
          }`}
        >
          {/* Success Icon Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl group-hover:bg-green-500/30 transition-all duration-500"></div>
              <div className="relative w-20 h-20 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-green-900/20 ring-4 ring-[#1a1d24]">
                <Check
                  className={`w-10 h-10 text-white stroke-[3px] transition-all duration-500 ${
                    showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                />
              </div>

              {/* Orbiting particle */}
              <div className="absolute inset-0 -m-1 animate-spin-slow opacity-60">
                <div className="h-2 w-2 bg-emerald-300 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)] top-0 left-1/2 -translate-x-1/2 absolute"></div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-4 mb-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Submitted to Blo
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Your request has been successfully queued.{" "}
              <br className="hidden md:block" />
              We'll notify you once the process completes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="group w-full bg-white text-black font-semibold h-12 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-white/5"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`mt-12 flex items-center gap-6 text-sm text-gray-600 transition-opacity duration-1000 delay-500 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <a href="#" className="hover:text-gray-400 transition-colors">
            Help Center
          </a>
          <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
          <a href="#" className="hover:text-gray-400 transition-colors">
            Privacy
          </a>
          <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
          <a href="#" className="hover:text-gray-400 transition-colors">
            Terms
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
