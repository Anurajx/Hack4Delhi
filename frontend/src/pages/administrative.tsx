import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Key, BadgeCheck, Lock } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

//Handles BLO login

type LoginStatus = "idle" | "loading" | "success" | "error";

const Administrative: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [officerId, setOfficerId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<LoginStatus>("idle");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      if (officerId === "admin" && password === "1234") {
        setStatus("success");
        // Navigate to BLO Portal after successful login
        setTimeout(() => {
          navigate("/blo-portal");
        }, 1500);
      } else setStatus("error");
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ease-in-out pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center ${
        isDarkMode
          ? "bg-[#0a0a0c] text-slate-200"
          : "bg-[#f8f9fa] text-slate-900"
      }`}
    >
      <div className="w-full max-w-md mx-auto animate-in slide-in-from-right-8 fade-in duration-500">
        <button
          onClick={() => navigate("/")}
          className={`mb-8 flex items-center gap-2 text-sm font-medium transition-colors ${
            isDarkMode
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div
          className={`rounded-2xl border p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden
          ${
            isDarkMode
              ? "bg-[#0f0f11]/90 border-white/10"
              : "bg-white/90 border-slate-200"
          }`}
        >
          {/* Emerald Gradient for Admin */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>

          <div className="text-center mb-8">
            <div
              className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4 
              ${
                isDarkMode
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2
              className={`text-2xl font-bold tracking-tight mb-2 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Official Login
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Restricted access for Election Officials & BLOs
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? "text-slate-500" : "text-slate-500"
                }`}
              >
                Officer ID / BLO ID
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={officerId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setOfficerId(e.target.value)
                  }
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-all duration-300 font-medium pl-10
                    ${
                      isDarkMode
                        ? "bg-black/20 border-white/10 text-white focus:border-emerald-500/50 focus:bg-white/5"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500/50 focus:bg-white"
                    }`}
                  placeholder="Enter Officer ID"
                  required
                />
                <BadgeCheck
                  className={`absolute left-3 top-3.5 w-4 h-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-slate-500 group-focus-within:text-emerald-500"
                      : "text-slate-400 group-focus-within:text-emerald-600"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? "text-slate-500" : "text-slate-500"
                }`}
              >
                Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-all duration-300 font-medium pl-10
                    ${
                      isDarkMode
                        ? "bg-black/20 border-white/10 text-white focus:border-emerald-500/50 focus:bg-white/5"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500/50 focus:bg-white"
                    }`}
                  placeholder="Enter Password"
                  required
                />
                <Key
                  className={`absolute left-3 top-3.5 w-4 h-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-slate-500 group-focus-within:text-emerald-500"
                      : "text-slate-400 group-focus-within:text-emerald-600"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className={`w-full py-3 rounded-lg font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg
                ${status === "loading" ? "opacity-70 cursor-wait" : ""}
                bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/20`}
            >
              {status === "loading" ? (
                <span className="animate-pulse">Verifying...</span>
              ) : (
                <>
                  Secure Login <Lock className="w-4 h-4" />
                </>
              )}
            </button>

            {status === "error" && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                Please check your user ID password and try again.{" "}
              </div>
            )}

            {status === "success" && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
                Access Granted. Redirecting to Dashboard...
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Administrative;
