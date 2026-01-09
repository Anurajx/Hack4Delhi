import "./App.css";

import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  ShieldCheck,
  Vote,
  Users,
  Lock,
  Sun,
  Moon,
  ArrowRight,
  Globe,
  Activity,
} from "lucide-react";
import RegistrationSuccess from "./pages/registractionSuccess";
import UserProfile from "./pages/userProfile";
import CitizenLogin from "./pages/citizenLogin";
import Administrative from "./pages/administrative";
import BLOPortal from "./pages/bloPortal";
import { useTheme } from "./contexts/ThemeContext";
//import { SignInButton, SignUpButton } from "@clerk/clerk-react";

// Wrapper component for UserProfile to access route state
const UserProfileWrapper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = location.state?.userData;

  // If no user data is provided (direct navigation), redirect to home
  useEffect(() => {
    if (!userData) {
      navigate("/");
    }
  }, [userData, navigate]);

  // Show nothing while redirecting
  if (!userData) {
    return null;
  }

  return <UserProfile userData={userData} />;
};

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegistrationSuccess = location.pathname === "/registration-success";
  const isUserProfile = location.pathname === "/user-profile";
  const isCitizenPortal = location.pathname === "/citizen-portal";
  const isAdministrative = location.pathname === "/administrative";
  const isBloPortal = location.pathname === "/blo-portal";

  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  //const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10 && !isScrolled) setIsScrolled(true);
      if (window.scrollY <= 10 && isScrolled) setIsScrolled(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  return (
    <div
      className={`min-h-screen font-sans antialiased selection:bg-orange-500 selection:text-white transition-colors duration-700 ease-in-out flex flex-col
      ${
        isDarkMode
          ? "bg-[#0a0a0c] text-slate-200"
          : "bg-[#f8f9fa] text-slate-900"
      }`}
    >
      {/* --- BACKGROUND --- */}
      {!isRegistrationSuccess &&
        !isUserProfile &&
        !isCitizenPortal &&
        !isAdministrative &&
        !isBloPortal && (
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div
              className={`absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:4rem_4rem] 
          ${
            isDarkMode
              ? "[mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
              : "[mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)]"
          }`}
            />
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-20 blur-[120px] rounded-full pointer-events-none
          ${
            isDarkMode
              ? "bg-gradient-to-b from-blue-900/40 via-purple-900/10 to-transparent"
              : "bg-gradient-to-b from-blue-200/60 via-purple-100/40 to-transparent"
          }`}
            />
          </div>
        )}

      {/* --- HEADER --- */}
      {!isRegistrationSuccess &&
        !isUserProfile &&
        !isCitizenPortal &&
        !isAdministrative &&
        !isBloPortal && (
          <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent
          ${
            isScrolled
              ? isDarkMode
                ? "bg-[#0a0a0c]/80 border-white/5 backdrop-blur-xl py-4"
                : "bg-white/80 border-slate-200/50 backdrop-blur-xl py-4"
              : "py-6"
          }`}
          >
            <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
              <div
                className="flex items-center gap-4 group cursor-pointer"
                onClick={() => navigate("/")}
              >
                <div
                  className={`relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-500 
              ${
                isDarkMode
                  ? "bg-white/5 border border-white/10 group-hover:border-white/20"
                  : "bg-white border border-slate-200 shadow-sm"
              }`}
                >
                  <img
                    src="./logo.webp"
                    alt="Logo"
                    // className={`w-6 h-6 object-contain transition-all duration-500 ${
                    //   isDarkMode
                    //     ? "invert brightness-0 opacity-90"
                    //     : "brightness-0 opacity-80"
                    // }`}
                  />
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-bold tracking-wider uppercase leading-none mb-1 ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    VoteChain
                  </span>
                  <span
                    className={`text-[10px] font-medium tracking-[0.2em] uppercase leading-none ${
                      isDarkMode ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    Government of India
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1">
                {["About", "Voter Services", "Elections", "Media"].map(
                  (item) => (
                    <a
                      key={item}
                      href="#"
                      onClick={alert.bind(
                        null,
                        "please use homepage to navigate to " + `${item}`
                      )}
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-full transition-all duration-300 select-none
                ${
                  isDarkMode
                    ? "text-slate-400 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                    >
                      {item}
                    </a>
                  )
                )}
                <div
                  className={`w-px h-4 mx-4 ${
                    isDarkMode ? "bg-white/10" : "bg-slate-200"
                  }`}
                ></div>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-all duration-300 
              ${
                isDarkMode
                  ? "text-slate-400 hover:text-amber-400 hover:bg-white/5"
                  : "text-slate-500 hover:text-amber-500 hover:bg-slate-100"
              }`}
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* <button
            className={`md:hidden p-2 rounded-lg ${
              isDarkMode
                ? "text-white hover:bg-white/10"
                : "text-slate-900 hover:bg-slate-100"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button> */}
            </div>
          </nav>
        )}

      {/* --- MAIN CONTENT AREA --- */}
      <Routes>
        <Route path="/registration-success" element={<RegistrationSuccess />} />
        <Route path="/user-profile" element={<UserProfileWrapper />} />
        <Route path="/citizen-portal" element={<CitizenLogin />} />
        <Route path="/administrative" element={<Administrative />} />
        <Route path="/blo-portal" element={<BLOPortal />} />
        <Route
          path="/*"
          element={
            <main className="relative z-10 pt-40 pb-20 flex-grow flex flex-col justify-center">
              <div className="container mx-auto px-6 max-w-7xl animate-in fade-in duration-700">
                <div className="flex flex-col items-center text-center">
                  {/* <div
                      className={`flex items-center gap-3 px-4 py-1.5 rounded-full border mb-10 backdrop-blur-md transition-colors duration-300
                      ${
                        isDarkMode
                          ? "bg-white/5 border-white/10 text-slate-300"
                          : "bg-white/60 border-slate-200 text-slate-600 shadow-sm"
                      }`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${greenBg}`}
                        ></span>
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${greenBg}`}
                        ></span>
                      </span>
                      <span className="text-[11px] font-semibold tracking-widest uppercase">
                        Ledger Operational
                      </span>
                      <div
                        className={`w-px h-3 ${
                          isDarkMode ? "bg-white/10" : "bg-slate-300"
                        }`}
                      ></div>
                    </div> */}

                  <h1 className="max-w-5xl mx-auto mb-8">
                    <span
                      className={`block text-5xl md:text-8xl font-semibold tracking-tighter leading-[0.9] mb-2 ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      The Foundation of
                    </span>
                    <span className="block text-5xl md:text-8xl font-semibold tracking-tighter leading-[0.9]">
                      <span
                        className={`text-transparent bg-clip-text bg-gradient-to-r opacity-90 
                          ${
                            isDarkMode
                              ? "from-orange-500 via-white to-emerald-500"
                              : "from-orange-600 via-blue-800 to-emerald-600"
                          }`}
                      >
                        Democracy
                      </span>
                    </span>
                  </h1>

                  <p
                    className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light mb-16 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    An Blockchain based voter lifecycle event log for the
                    Election Commission of India.
                    <span
                      className={
                        isDarkMode ? "text-slate-200" : "text-slate-700"
                      }
                    >
                      {" "}
                      Secure. Transparent. Immutable.
                    </span>
                  </p>

                  <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {/* Voter Portal Button */}
                    <div
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-2xl
                        ${
                          isDarkMode
                            ? "bg-[#0f0f11] border-white/10 hover:border-orange-500/30"
                            : "bg-white border-slate-200 hover:border-orange-200 shadow-sm"
                        }`}
                    >
                      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-600 to-orange-400 opacity-80"></div>
                      <div className="p-8 md:p-10 flex flex-col h-full items-start text-left">
                        <div
                          className={`mb-6 p-3 rounded-xl inline-flex items-center justify-center transition-colors duration-300
                            ${
                              isDarkMode
                                ? "bg-orange-500/10 text-orange-400"
                                : "bg-orange-50 text-orange-600"
                            }`}
                        >
                          <User className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <h3
                          className={`text-2xl font-semibold tracking-tight mb-3 ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          Citizen Portal
                        </h3>
                        <p
                          className={`text-sm leading-relaxed mb-10 max-w-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Access digital voter services. Download e-EPIC,
                          register to vote, and update your profile.
                        </p>
                        <div className="mt-auto w-full pt-6 border-t border-dashed border-gray-700/20">
                          <button
                            onClick={() => navigate("/citizen-portal")}
                            className={`group/btn w-full py-3 px-0 flex items-center justify-between text-sm font-semibold tracking-wide transition-all
                              ${
                                isDarkMode
                                  ? "text-white hover:text-orange-400"
                                  : "text-slate-900 hover:text-orange-600"
                              }`}
                          >
                            <span>Access Services</span>
                            <span
                              className={`p-2 rounded-full transition-all duration-300 group-hover/btn:translate-x-1 
                                ${
                                  isDarkMode
                                    ? "bg-white/5 group-hover/btn:bg-orange-500/20"
                                    : "bg-slate-100 group-hover/btn:bg-orange-100"
                                }`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Official Login Button */}
                    <div
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-2xl
                        ${
                          isDarkMode
                            ? "bg-[#0f0f11] border-white/10 hover:border-emerald-500/30"
                            : "bg-white border-slate-200 hover:border-emerald-200 shadow-sm"
                        }`}
                    >
                      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-80"></div>
                      <div className="p-8 md:p-10 flex flex-col h-full items-start text-left">
                        <div
                          className={`mb-6 p-3 rounded-xl inline-flex items-center justify-center transition-colors duration-300
                            ${
                              isDarkMode
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                        >
                          <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <h3
                          className={`text-2xl font-semibold tracking-tight mb-3 ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          Administrative Login
                        </h3>
                        <p
                          className={`text-sm leading-relaxed mb-10 max-w-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Secure gateway for Election Officials, BLOs, and
                          Observers. Admin login required.
                        </p>
                        <div className="mt-auto w-full pt-6 border-t border-dashed border-gray-700/20">
                          <button
                            onClick={() => navigate("/administrative")}
                            className={`group/btn w-full py-3 px-0 flex items-center justify-between text-sm font-semibold tracking-wide transition-all
                              ${
                                isDarkMode
                                  ? "text-white hover:text-emerald-400"
                                  : "text-slate-900 hover:text-emerald-600"
                              }`}
                          >
                            <span>Secure Login</span>
                            <span
                              className={`p-2 rounded-full transition-all duration-300 group-hover/btn:translate-x-1 
                                ${
                                  isDarkMode
                                    ? "bg-white/5 group-hover/btn:bg-emerald-500/20"
                                    : "bg-slate-100 group-hover/btn:bg-emerald-100"
                                }`}
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Data Strip */}
                <div className="w-full max-w-7xl mx-auto mt-24">
                  <div
                    className={`grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-y
                      ${
                        isDarkMode
                          ? "border-white/10 divide-white/10"
                          : "border-slate-200 divide-slate-200"
                      }`}
                  >
                    {[
                      {
                        label: "Electorate Size",
                        value: "968M+",
                        icon: Users,
                        sub: "Registered Voters",
                      },
                      {
                        label: "Infrastructure",
                        value: "1.2M",
                        icon: Globe,
                        sub: "Polling Stations",
                      },
                      {
                        label: "Integrity",
                        value: "100%",
                        icon: Vote,
                        sub: "EVM Coverage",
                      },
                      {
                        label: "Participation",
                        value: "67.4%",
                        icon: Activity,
                        sub: "Voter Turnout",
                      },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-center py-8 px-4 group cursor-default"
                      >
                        <div
                          className={`mb-3 transition-colors duration-300 ${
                            isDarkMode
                              ? "text-slate-600 group-hover:text-slate-400"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        >
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-3xl font-bold tracking-tighter mb-1 transition-colors duration-300 ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {stat.value}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-widest font-semibold ${
                            isDarkMode ? "text-slate-500" : "text-slate-500"
                          }`}
                        >
                          {stat.sub}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          }
        />
      </Routes>

      {/* --- FOOTER --- */}
      {!isRegistrationSuccess &&
        !isUserProfile &&
        !isCitizenPortal &&
        !isAdministrative &&
        !isBloPortal && (
          <footer
            className={`relative z-10 border-t ${
              isDarkMode
                ? "bg-[#0a0a0c] border-white/5"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="container mx-auto px-6 max-w-7xl py-16">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                <div className="md:col-span-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center overflow-hidden 
                  ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}
                    >
                      <img src="./logo.webp" alt="Logo" />
                    </div>
                    <span
                      className={`text-lg font-bold tracking-tight ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      ECI Portal
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed mb-6 max-w-xs ${
                      isDarkMode ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    The Election Commission of India is an autonomous
                    constitutional authority responsible for administering
                    election processes in India.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h4
                    className={`text-xs font-bold uppercase tracking-widest mb-6 ${
                      isDarkMode ? "text-slate-200" : "text-slate-900"
                    }`}
                  >
                    Services
                  </h4>
                  <ul className="space-y-4">
                    {[
                      "Voter Registration",
                      "Download e-EPIC",
                      "Track Application",
                      "Search in Roll",
                    ].map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className={`text-sm transition-colors ${
                            isDarkMode
                              ? "text-slate-500 hover:text-orange-400"
                              : "text-slate-600 hover:text-orange-600"
                          }`}
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <h4
                    className={`text-xs font-bold uppercase tracking-widest mb-6 ${
                      isDarkMode ? "text-slate-200" : "text-slate-900"
                    }`}
                  >
                    Information
                  </h4>
                  <ul className="space-y-4">
                    {["Press Releases", "Manuals", "RTI", "Tenders"].map(
                      (link) => (
                        <li key={link}>
                          <a
                            href="#"
                            className={`text-sm transition-colors ${
                              isDarkMode
                                ? "text-slate-500 hover:text-white"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {link}
                          </a>
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div className="md:col-span-4">
                  <h4
                    className={`text-xs font-bold uppercase tracking-widest mb-6 ${
                      isDarkMode ? "text-slate-200" : "text-slate-900"
                    }`}
                  >
                    Headquarters
                  </h4>
                  <div
                    className={`space-y-4 text-sm ${
                      isDarkMode ? "text-slate-500" : "text-slate-600"
                    }`}
                  >
                    <p>
                      Nirvachan Sadan, Ashoka Road,
                      <br />
                      New Delhi 110001
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider opacity-50">
                          Helpline
                        </span>
                        <span
                          className={`text-lg font-mono ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          1950
                        </span>
                      </div>
                      <div className="w-px h-8 bg-current opacity-10"></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider opacity-50">
                          Control Room
                        </span>
                        <span
                          className={`text-lg font-mono ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          011-23052205
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`border-t mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs ${
                  isDarkMode
                    ? "border-white/5 text-slate-600"
                    : "border-slate-100 text-slate-400"
                }`}
              >
                <p>&copy; 2025 Election Commission of India. NIC/GOI.</p>
                <div className="flex gap-8">
                  <a href="#" className="hover:text-current transition-colors">
                    Privacy
                  </a>
                  <a href="#" className="hover:text-current transition-colors">
                    Terms
                  </a>
                  <a href="#" className="hover:text-current transition-colors">
                    Accessibility
                  </a>
                </div>
              </div>
            </div>
          </footer>
        )}
    </div>
  );
};

export default App;
