import { useState, useEffect } from "react";
import { Check, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

// Main Application Component
export default function RegistrationSuccess() {
  const location = useLocation();
  const generatedID = location.state?.generatedID || "N/A";

  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Staggered animation effect
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`min-h-screen font-sans selection:bg-indigo-500/30 overflow-hidden relative transition-colors duration-700 ease-in-out ${
        isDarkMode ? "bg-[#0a0a0c] text-white" : "bg-[#f8f9fa] text-slate-900"
      }`}
    >
      {/* Background Ambience / Blobs */}
      <div
        className={`fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen pointer-events-none transition-opacity duration-1000 ${
          mounted ? "opacity-100" : "opacity-0"
        } ${isDarkMode ? "bg-indigo-600/20" : "bg-indigo-200/30"}`}
      />
      <div
        className={`fixed bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] mix-blend-screen pointer-events-none transition-opacity duration-1000 delay-300 ${
          mounted ? "opacity-100" : "opacity-0"
        } ${isDarkMode ? "bg-purple-600/10" : "bg-purple-200/20"}`}
      />

      {/* Grid Pattern Overlay */}
      <div
        className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none ${
          isDarkMode ? "opacity-20" : "opacity-10"
        }`}
      ></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 pt-24 pb-16">
        {/* Card */}
        <div
          className={`w-full max-w-md backdrop-blur-xl border rounded-3xl p-8 md:p-12 shadow-2xl ring-1 transition-all duration-700 ease-out transform ${
            showContent
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-95"
          } ${
            isDarkMode
              ? "bg-[#1a1d24]/80 border-white/5 ring-white/10"
              : "bg-white/90 border-slate-200 ring-slate-200/50"
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
            <h1
              className={`text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b bg-clip-text text-transparent ${
                isDarkMode
                  ? "from-white to-white/60"
                  : "from-slate-900 to-slate-700"
              }`}
            >
              Submitted to Officer
            </h1>
            <p
              className={`text-lg leading-relaxed ${
                isDarkMode ? "text-gray-400" : "text-slate-600"
              }`}
            >
              Your request has been successfully queued.{" "}
              <br className="hidden md:block" />
              once approved, your UVID will be {generatedID}.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/")}
              className={`group w-full font-semibold h-12 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${
                isDarkMode
                  ? "bg-white text-black hover:bg-gray-200 shadow-white/5"
                  : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`mt-12 flex items-center gap-6 text-sm transition-opacity duration-1000 delay-500 ${
            showContent ? "opacity-100" : "opacity-0"
          } ${isDarkMode ? "text-gray-600" : "text-slate-500"}`}
        >
          <a
            href="#"
            className={`transition-colors ${
              isDarkMode ? "hover:text-gray-400" : "hover:text-slate-700"
            }`}
          >
            Help Center
          </a>
          <span
            className={`w-1 h-1 rounded-full ${
              isDarkMode ? "bg-gray-700" : "bg-slate-400"
            }`}
          ></span>
          <a
            href="#"
            className={`transition-colors ${
              isDarkMode ? "hover:text-gray-400" : "hover:text-slate-700"
            }`}
          >
            Privacy
          </a>
          <span
            className={`w-1 h-1 rounded-full ${
              isDarkMode ? "bg-gray-700" : "bg-slate-400"
            }`}
          ></span>
          <a
            href="#"
            className={`transition-colors ${
              isDarkMode ? "hover:text-gray-400" : "hover:text-slate-700"
            }`}
          >
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
