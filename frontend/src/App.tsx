import "./App.css";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import {
  User,
  ShieldCheck,
  ChevronRight,
  Search,
  Menu,
  X,
  Vote,
  FileText,
  Phone,
  BarChart3,
  Users,
  Lock,
  Sun,
  Moon,
  ArrowRight,
  Zap,
  Globe,
  Activity,
  ArrowLeft,
  Key,
  Fingerprint,
  UserPlus,
  ClipboardList,
  FileSearch,
  BadgeCheck,
  MapPin,
  Calendar,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

type ViewState =
  | "home"
  | "portal-landing"
  | "login"
  | "register"
  | "admin-login";
type LoginStatus = "idle" | "loading" | "success" | "error";

interface RegistrationData {
  id: string;
  aadhaar: string;
  firstName: string;
  lastName: string;
  motherName: string;
  fatherName: string;
  sex: string;
  birthday: string;
  age: string;
  districtId: string;
  phone: string;
  voterId: string;
  defPassword: string;
  state: string;
}

interface PortalLandingProps {
  onNavigate: (option: string) => void;
  onBack: () => void;
}

interface FormProps {
  onBack: () => void;
}

interface PortalOption {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderHover: string;
}

// --- Main Component ---

const App: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [currentView, setCurrentView] = useState<ViewState>("home");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10 && !isScrolled) setIsScrolled(true);
      if (window.scrollY <= 10 && isScrolled) setIsScrolled(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Common Color/Style Definitions
  const greenBg = "bg-emerald-500";

  // --- Sub-Components ---

  // 1. Portal Landing / Selection Page
  const PortalLanding: React.FC<PortalLandingProps> = ({
    onNavigate,
    onBack,
  }) => {
    const options: PortalOption[] = [
      {
        id: "login",
        title: "Login",
        desc: "Access your dashboard.",
        icon: User,
        colorClass: isDarkMode ? "text-orange-500" : "text-orange-600",
        bgClass: isDarkMode ? "bg-orange-500/10" : "bg-orange-50",
        borderHover: isDarkMode
          ? "hover:border-orange-500/50"
          : "hover:border-orange-300",
      },
      {
        id: "register",
        title: "New Registration",
        desc: "Apply for Voter ID (Form 6).",
        icon: UserPlus,
        colorClass: isDarkMode ? "text-blue-500" : "text-blue-600",
        bgClass: isDarkMode ? "bg-blue-500/10" : "bg-blue-50",
        borderHover: isDarkMode
          ? "hover:border-blue-500/50"
          : "hover:border-blue-300",
      },
      {
        id: "candidates",
        title: "Candidate List",
        desc: "View affidavits & contestants.",
        icon: ClipboardList,
        colorClass: isDarkMode ? "text-emerald-500" : "text-emerald-600",
        bgClass: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50",
        borderHover: isDarkMode
          ? "hover:border-emerald-500/50"
          : "hover:border-emerald-300",
      },
    ];

    return (
      <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 flex flex-col justify-center min-h-[50vh]">
        <div className="flex items-center justify-between mb-10 border-b pb-6 border-white/5">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isDarkMode
                ? "text-slate-400 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <span
            className={`text-xs font-bold uppercase tracking-widest ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Citizen Services Portal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => onNavigate(opt.id)}
              className={`group cursor-pointer relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                ${
                  isDarkMode
                    ? `bg-[#0f0f11] border-white/10 ${opt.borderHover}`
                    : `bg-white border-slate-200 ${opt.borderHover} shadow-sm`
                }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${opt.bgClass} ${opt.colorClass}`}
                >
                  <opt.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {opt.title}
                </h3>
              </div>

              <p
                className={`text-sm leading-relaxed mb-6 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {opt.desc}
              </p>

              <div
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide transition-transform duration-300 group-hover:translate-x-1 ${opt.colorClass}`}
              >
                Proceed <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 2. Citizen Login Form View
  const LoginForm: React.FC<FormProps> = ({ onBack }) => {
    const [userId, setUserId] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [status, setStatus] = useState<LoginStatus>("idle");

    const handleLogin = async (e: FormEvent) => {
      e.preventDefault();
      setStatus("loading");
      try {
        const response = await fetch("http://localhost:5000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, password }),
        });
        if (response.ok) setStatus("success");
        else setStatus("error");
      } catch (error) {
        setStatus("error");
      }
    };

    return (
      <div className="w-full max-w-md mx-auto animate-in slide-in-from-right-8 fade-in duration-500">
        <button
          onClick={onBack}
          className={`mb-8 flex items-center gap-2 text-sm font-medium transition-colors ${
            isDarkMode
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </button>

        <div
          className={`rounded-2xl border p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden
          ${
            isDarkMode
              ? "bg-[#0f0f11]/90 border-white/10"
              : "bg-white/90 border-slate-200"
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-orange-400"></div>

          <div className="text-center mb-8">
            <div
              className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4 
              ${
                isDarkMode
                  ? "bg-orange-500/10 text-orange-500"
                  : "bg-orange-50 text-orange-600"
              }`}
            >
              <User className="w-6 h-6" />
            </div>
            <h2
              className={`text-2xl font-bold tracking-tight mb-2 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Citizen Login
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Enter your credentials to access ECI services
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? "text-slate-500" : "text-slate-500"
                }`}
              >
                User ID / EPIC Number
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={userId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setUserId(e.target.value)
                  }
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-all duration-300 font-medium pl-10
                    ${
                      isDarkMode
                        ? "bg-black/20 border-white/10 text-white focus:border-orange-500/50 focus:bg-white/5"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500/50 focus:bg-white"
                    }`}
                  placeholder="Enter User ID"
                  required
                />
                <Fingerprint
                  className={`absolute left-3 top-3.5 w-4 h-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-slate-500 group-focus-within:text-orange-500"
                      : "text-slate-400 group-focus-within:text-orange-600"
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
                        ? "bg-black/20 border-white/10 text-white focus:border-orange-500/50 focus:bg-white/5"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500/50 focus:bg-white"
                    }`}
                  placeholder="Enter Password"
                  required
                />
                <Key
                  className={`absolute left-3 top-3.5 w-4 h-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-slate-500 group-focus-within:text-orange-500"
                      : "text-slate-400 group-focus-within:text-orange-600"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className={`w-full py-3 rounded-lg font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg
                ${status === "loading" ? "opacity-70 cursor-wait" : ""}
                bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-orange-900/20`}
            >
              {status === "loading" ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>
                  Secure Login <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {status === "error" && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                Connection to server failed (Localhost:5000 unavailable)
              </div>
            )}

            {status === "success" && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
                Login Successful. Redirecting...
              </div>
            )}
          </form>
        </div>
      </div>
    );
  };

  // 3. New Registration Form View
  const RegistrationForm: React.FC<FormProps> = ({ onBack }) => {
    const [formData, setFormData] = useState<RegistrationData>({
      id: "",
      aadhaar: "",
      firstName: "",
      lastName: "",
      motherName: "",
      fatherName: "",
      sex: "",
      birthday: "",
      age: "",
      districtId: "",
      phone: "",
      voterId: "",
      defPassword: "",
      state: "",
    });
    const [status, setStatus] = useState<LoginStatus>("idle");

    const handleChange = (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: FormEvent) => {
      e.preventDefault();
      setStatus("loading");
      try {
        const response = await fetch("http://localhost:5000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) setStatus("success");
        else setStatus("error");
      } catch (error) {
        setStatus("error");
      }
    };

    const inputClasses = `w-full px-4 py-3 rounded-lg border outline-none transition-all duration-300 font-medium pl-10
      ${
        isDarkMode
          ? "bg-black/20 border-white/10 text-white focus:border-blue-500/50 focus:bg-white/5"
          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500/50 focus:bg-white"
      }`;

    const labelClasses = `text-xs font-semibold uppercase tracking-wider ${
      isDarkMode ? "text-slate-500" : "text-slate-500"
    }`;
    const iconClasses = `absolute left-3 top-3.5 w-4 h-4 transition-colors duration-300 ${
      isDarkMode
        ? "text-slate-500 group-focus-within:text-blue-500"
        : "text-slate-400 group-focus-within:text-blue-600"
    }`;

    return (
      <div className="w-full max-w-4xl mx-auto animate-in slide-in-from-right-8 fade-in duration-500 pb-10">
        <button
          onClick={onBack}
          className={`mb-8 flex items-center gap-2 text-sm font-medium transition-colors ${
            isDarkMode
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </button>

        <div
          className={`rounded-2xl border p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden
          ${
            isDarkMode
              ? "bg-[#0f0f11]/90 border-white/10"
              : "bg-white/90 border-slate-200"
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>

          <div className="text-center mb-10">
            <div
              className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4 
              ${
                isDarkMode
                  ? "bg-blue-500/10 text-blue-500"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <UserPlus className="w-6 h-6" />
            </div>
            <h2
              className={`text-2xl font-bold tracking-tight mb-2 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              New Voter Registration
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Fill out the details below to apply for a new Voter ID Card (Form
              6)
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* --- Personal Details --- */}
            <div className="md:col-span-2 text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/5 pb-2 mt-2">
              Personal Details
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Application ID</label>
              <div className="relative group">
                <input
                  name="id"
                  type="text"
                  value={formData.id}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Generate/Enter ID"
                  required
                />
                <BadgeCheck className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Aadhaar Number</label>
              <div className="relative group">
                <input
                  name="aadhaar"
                  type="text"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="12-digit Aadhaar"
                  required
                />
                <Fingerprint className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>First Name</label>
              <div className="relative group">
                <input
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="First Name"
                  required
                />
                <User className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Last Name</label>
              <div className="relative group">
                <input
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Last Name"
                  required
                />
                <User className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Father's Name</label>
              <div className="relative group">
                <input
                  name="fatherName"
                  type="text"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Father's Name"
                  required
                />
                <User className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Mother's Name</label>
              <div className="relative group">
                <input
                  name="motherName"
                  type="text"
                  value={formData.motherName}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Mother's Name"
                  required
                />
                <User className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Sex</label>
              <div className="relative group">
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className={`${inputClasses} appearance-none cursor-pointer`}
                  required
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <Users className={iconClasses} />
                <div
                  className={`absolute right-4 top-4 w-2 h-2 border-r border-b rotate-45 pointer-events-none ${
                    isDarkMode ? "border-slate-500" : "border-slate-400"
                  }`}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Birthday</label>
              <div className="relative group">
                <input
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  className={inputClasses}
                  required
                />
                <Calendar className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Age</label>
              <div className="relative group">
                <input
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Age"
                  required
                />
                <Activity className={iconClasses} />
              </div>
            </div>

            {/* --- Location & Security --- */}
            <div className="md:col-span-2 text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/5 pb-2 mt-4">
              Location & Security
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>District ID</label>
              <div className="relative group">
                <input
                  name="districtId"
                  type="text"
                  value={formData.districtId}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="District Code"
                  required
                />
                <MapPin className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>State</label>
              <div className="relative group">
                <input
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="State Name"
                  required
                />
                <Globe className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Phone Number</label>
              <div className="relative group">
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="10-digit Mobile"
                  required
                />
                <Phone className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Voter ID (If Existing)</label>
              <div className="relative group">
                <input
                  name="voterId"
                  type="text"
                  value={formData.voterId}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="EPIC Number (Optional)"
                />
                <CreditCard className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className={labelClasses}>Default Password</label>
              <div className="relative group">
                <input
                  name="defPassword"
                  type="password"
                  value={formData.defPassword}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Set a temporary password"
                  required
                />
                <Key className={iconClasses} />
              </div>
            </div>

            <div className="md:col-span-2 pt-6">
              <button
                type="submit"
                disabled={status === "loading"}
                className={`w-full py-3 rounded-lg font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg
                  ${status === "loading" ? "opacity-70 cursor-wait" : ""}
                  bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-900/20`}
              >
                {status === "loading" ? (
                  <span className="animate-pulse">Submitting Form...</span>
                ) : (
                  <>
                    Register Now <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {status === "error" && (
              <div className="md:col-span-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                Connection to server failed (Localhost:5000 unavailable)
              </div>
            )}

            {status === "success" && (
              <div className="md:col-span-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
                Registration Submitted Successfully.
              </div>
            )}
          </form>
        </div>
      </div>
    );
  };

  // 4. Admin Login Form View (Official BLO Login)
  const AdminLoginForm: React.FC<FormProps> = ({ onBack }) => {
    const [officerId, setOfficerId] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [status, setStatus] = useState<LoginStatus>("idle");

    const handleLogin = async (e: FormEvent) => {
      e.preventDefault();
      setStatus("loading");
      try {
        const response = await fetch("http://localhost:5000/admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ officerId, password }),
        });
        if (response.ok) setStatus("success");
        else setStatus("error");
      } catch (error) {
        setStatus("error");
      }
    };

    return (
      <div className="w-full max-w-md mx-auto animate-in slide-in-from-right-8 fade-in duration-500">
        <button
          onClick={onBack}
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
                Connection to server failed (Localhost:5000 unavailable)
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
    );
  };

  // View Routing Logic
  const handlePortalNavigation = (option: string) => {
    if (option === "login") {
      setCurrentView("login");
    } else if (option === "register") {
      setCurrentView("register");
    } else {
      // Placeholder for other routes
      alert(`Redirecting to ${option} page...`);
    }
  };

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

      {/* --- HEADER --- */}
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
            onClick={() => setCurrentView("home")}
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
            {["About", "Voter Services", "Elections", "Media"].map((item) => (
              <a
                key={item}
                href="#"
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-full transition-all duration-300
                ${
                  isDarkMode
                    ? "text-slate-400 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item}
              </a>
            ))}
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

      {/* --- MAIN CONTENT AREA --- */}
      <main className="relative z-10 pt-40 pb-20 flex-grow flex flex-col justify-center">
        {currentView === "home" && (
          <div className="container mx-auto px-6 max-w-7xl animate-in fade-in duration-700">
            <div className="flex flex-col items-center text-center">
              <div
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
                  System Operational
                </span>
                <div
                  className={`w-px h-3 ${
                    isDarkMode ? "bg-white/10" : "bg-slate-300"
                  }`}
                ></div>
                <span className="text-[11px] font-medium tracking-wide">
                  Phase 1 Polling Live
                </span>
              </div>

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
                An Blockchain based voter lifecycle event log for the Election
                Commission of India.
                <span
                  className={isDarkMode ? "text-slate-200" : "text-slate-700"}
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
                      Access digital voter services. Download e-EPIC, register
                      to vote, and view candidate affidavits.
                    </p>
                    <div className="mt-auto w-full pt-6 border-t border-dashed border-gray-700/20">
                      <button
                        onClick={() => setCurrentView("portal-landing")}
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
                      Observers. Two-factor authentication required.
                    </p>
                    <div className="mt-auto w-full pt-6 border-t border-dashed border-gray-700/20">
                      <button
                        onClick={() => setCurrentView("admin-login")}
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
        )}

        {currentView === "portal-landing" && (
          <PortalLanding
            onNavigate={handlePortalNavigation}
            onBack={() => setCurrentView("home")}
          />
        )}

        {currentView === "login" && (
          <LoginForm onBack={() => setCurrentView("portal-landing")} />
        )}

        {currentView === "register" && (
          <RegistrationForm onBack={() => setCurrentView("portal-landing")} />
        )}

        {currentView === "admin-login" && (
          <AdminLoginForm onBack={() => setCurrentView("home")} />
        )}
      </main>

      {/* --- FOOTER --- */}
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
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Emblem_of_India.svg/1200px-Emblem_of_India.svg.png"
                    alt="Ashok Stambh"
                    className={`w-5 h-5 object-contain ${
                      isDarkMode
                        ? "invert brightness-0 opacity-80"
                        : "brightness-0 opacity-70"
                    }`}
                  />
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
                The Election Commission of India is an autonomous constitutional
                authority responsible for administering election processes in
                India.
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
                {["Press Releases", "Manuals", "RTI", "Tenders"].map((link) => (
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
                ))}
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
    </div>
  );
};

export default App;
