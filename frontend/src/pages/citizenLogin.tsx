import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ArrowRight,
  ArrowLeft,
  Key,
  Fingerprint,
  UserPlus,
  BadgeCheck,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  Users,
  Activity,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

type ViewState = "portal-landing" | "login" | "register";
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

interface PortalOption {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderHover: string;
}

// Portal Landing / Selection Page
const PortalLanding: React.FC<{
  navigate: ReturnType<typeof useNavigate>;
  isDarkMode: boolean;
  setCurrentView: (view: ViewState) => void;
}> = ({ navigate, isDarkMode, setCurrentView }) => {
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
  ];

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 flex flex-col justify-center min-h-[50vh]">
      <div className="flex items-center justify-between mb-10 border-b pb-6 border-white/5">
        <button
          onClick={() => navigate("/")}
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
            onClick={() => setCurrentView(opt.id as ViewState)}
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

// Citizen Login Form View
const LoginForm: React.FC<{
  navigate: ReturnType<typeof useNavigate>;
  isDarkMode: boolean;
  setCurrentView: (view: ViewState) => void;
}> = ({ navigate, isDarkMode, setCurrentView }) => {
  const [userId, setUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<LoginStatus>("idle");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch(
        `https://hack4delhi.onrender.com/auth/${userId}/${password}`
      );

      const data = await response.json();
      console.log(data);

      if (data.success && data.voters && data.voters.length > 0) {
        const userData = data.voters[0];
        setStatus("success");
        // Navigate to user profile with user data after a short delay
        setTimeout(() => {
          navigate("/user-profile", { state: { userData } });
        }, 1500);
      } else setStatus("error");
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in slide-in-from-right-8 fade-in duration-500">
      <button
        onClick={() => setCurrentView("portal-landing")}
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
              User ID
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
              Invalid User ID or Password
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

// New Registration Form View
const RegistrationForm: React.FC<{
  navigate: ReturnType<typeof useNavigate>;
  isDarkMode: boolean;
  setCurrentView: (view: ViewState) => void;
}> = ({ navigate, isDarkMode, setCurrentView }) => {
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

  const payload = {
    ID: formData.id,
    Aadhaar: formData.aadhaar,
    FirstName: formData.firstName,
    LastName: formData.lastName,
    MotherName: formData.motherName,
    FatherName: formData.fatherName,
    Sex: formData.sex,
    Birthday: formData.birthday,
    Age: Number(formData.age),
    DistrictId: Number(formData.districtId),
    Phone: formData.phone,
    VoterId: formData.voterId,
    DefPassword: formData.defPassword,
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      console.log(formData);
      const response = await fetch("https://hack4delhi.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setStatus("success");
        // Navigate to success page after a short delay
        setTimeout(() => {
          navigate("/registration-success");
        }, 1500);
      } else setStatus("error");
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
        onClick={() => setCurrentView("portal-landing")}
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
            Fill out the details below to apply for a new Voter ID Card (Form 6)
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* --- Personal Details --- */}
          <div className="md:col-span-2 text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/5 pb-2 mt-2">
            Personal Details <br />
          </div>
          <div className="md:col-span-2 text-xs font-bold  tracking-widest opacity-50 border-b border-white/5 pb-2 mt-2">
            For now we let all fields be manually entered, later Application ID
            and EPIC will be auto-generated by backend
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
              Please check your user ID password and try again.
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

const CitizenLogin: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [currentView, setCurrentView] = useState<ViewState>("portal-landing");

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ease-in-out pt-20 pb-12 px-4 sm:px-6 lg:px-8 ${
        isDarkMode
          ? "bg-[#0a0a0c] text-slate-200"
          : "bg-[#f8f9fa] text-slate-900"
      }`}
    >
      {currentView === "portal-landing" && (
        <PortalLanding
          navigate={navigate}
          isDarkMode={isDarkMode}
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === "login" && (
        <LoginForm
          navigate={navigate}
          isDarkMode={isDarkMode}
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === "register" && (
        <RegistrationForm
          navigate={navigate}
          isDarkMode={isDarkMode}
          setCurrentView={setCurrentView}
        />
      )}
    </div>
  );
};

export default CitizenLogin;
