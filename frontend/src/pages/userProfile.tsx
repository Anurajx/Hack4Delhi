import React, { useState, useEffect, type ChangeEvent } from "react";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Fingerprint,
  Save,
  CheckCircle2,
  AlertCircle,
  Hash,
  Shield,
  Loader2,
  Building2,
  Landmark,
  Trash2,
  Link2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";

// --- TYPE DEFINITIONS ---

interface UserData {
  _id: string;
  ID: string;
  Aadhaar: string;
  FirstName: string;
  LastName: string;
  MotherName: string;
  FatherName: string;
  Sex: string;
  Birthday: string;
  Age: number;
  DistrictId: number;
  Phone: string;
  VoterId: string;
  DefPassword: string;
  State: string;
  LinkedCredentials?: Array<{
    credentialType: string;
    credentialValue: string;
    details?: string;
    linkedAt?: string;
    actor?: string;
  }>;
  // Index signature to allow dynamic access via keys
  [key: string]:
    | string
    | number
    | Array<{
        credentialType: string;
        credentialValue: string;
        details?: string;
        linkedAt?: string;
        actor?: string;
      }>
    | undefined;
}

interface InputGroupProps {
  label: string;
  name: keyof UserData;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  icon?: LucideIcon;
  type?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  isModified?: boolean;
}

interface UserProfileProps {
  userData?: UserData;
}

interface StatusState {
  type: "success" | "error" | "";
  message: string;
}

// --- MOCK DATA (Fallback) ---
const DEFAULT_USER_DATA: UserData = {
  _id: "69561a7b799dcfd22b81fa18",
  ID: "TDV7305652",
  Aadhaar: "4616 8141 3774",
  FirstName: "Mayur",
  LastName: "Mahendra",
  MotherName: "Arpita",
  FatherName: "Chauhan",
  Sex: "M",
  Birthday: "01-06-1998",
  Age: 22,
  DistrictId: 2104,
  Phone: "9445560413 , 9668871603",
  VoterId: "PLD9O0401",
  DefPassword: "PLD@8779",
  State: "Sikkim",
};

// --- COMPONENT DEFINED OUTSIDE TO PREVENT RE-RENDER/FOCUS LOSS ---
const InputGroup: React.FC<InputGroupProps & { isDarkMode?: boolean }> = ({
  label,
  name,
  value,
  onChange,
  icon: Icon,
  type = "text",
  fullWidth = false,
  disabled = false,
  isModified = false,
  isDarkMode = false,
}) => (
  <div
    className={`flex flex-col space-y-1.5 ${
      fullWidth ? "col-span-1 md:col-span-2" : ""
    }`}
  >
    <label
      className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 select-none ${
        isDarkMode ? "text-slate-400" : "text-slate-500"
      }`}
    >
      {label}
    </label>
    <div className="relative group">
      <input
        type={type}
        name={name as string} // Fixed: Cast to string to satisfy HTML attribute requirement
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 rounded-md border text-sm font-medium
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-1 
          disabled:cursor-not-allowed
          ${
            isDarkMode
              ? isModified
                ? "border-orange-400 bg-orange-500/10 text-white placeholder-slate-500 focus:ring-orange-500 focus:border-orange-500 disabled:bg-white/5 disabled:text-slate-500"
                : "border-white/10 bg-white/5 text-white placeholder-slate-500 hover:border-white/20 focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-slate-500"
              : isModified
              ? "border-orange-400 bg-orange-50/10 text-slate-900 placeholder-slate-400 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
              : "border-slate-300 bg-white text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:ring-[#000080] focus:border-[#000080] disabled:bg-slate-50 disabled:text-slate-500"
          }
        `}
      />
      {Icon && (
        <div
          className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
            isModified
              ? "text-orange-500"
              : isDarkMode
              ? "text-slate-500 group-focus-within:text-blue-400"
              : "text-slate-400 group-focus-within:text-[#000080]"
          }`}
        >
          <Icon size={16} />
        </div>
      )}
    </div>
  </div>
);

const UserProfile: React.FC<UserProfileProps> = ({
  userData = DEFAULT_USER_DATA,
}) => {
  // 1. State Management
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserData>(userData);
  const [initialData, setInitialData] = useState<UserData>(userData);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusState>({ type: "", message: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [credentialType, setCredentialType] = useState("AADHAAR");
  const [credentialValue, setCredentialValue] = useState("");
  const [linkedCredentials, setLinkedCredentials] = useState<
    Array<{
      credentialType: string;
      credentialValue: string;
      details?: string;
      linkedAt?: string;
      actor?: string;
    }>
  >(userData.LinkedCredentials || []);
  const [originalLinkedCredentials, setOriginalLinkedCredentials] = useState<
    Array<{
      credentialType: string;
      credentialValue: string;
      details?: string;
      linkedAt?: string;
      actor?: string;
    }>
  >(userData.LinkedCredentials || []);
  const [showCredentialPulse, setShowCredentialPulse] = useState(false);

  // 2. Handle Dynamic Prop Updates
  useEffect(() => {
    setFormData(userData);
    setInitialData(userData);
    setLinkedCredentials(userData.LinkedCredentials || []);
    setOriginalLinkedCredentials(userData.LinkedCredentials || []);
    setHasChanges(false);
  }, [userData]);

  // 3. Change Detection Logic
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Auto-convert number fields
    const newValue =
      name === "Age" || name === "DistrictId" ? Number(value) : value;

    const updatedData: UserData = {
      ...formData,
      [name]: newValue,
    };

    setFormData(updatedData);

    // Compare against the dynamically loaded initialData
    const isDirty = JSON.stringify(updatedData) !== JSON.stringify(initialData);
    setHasChanges(isDirty);

    if (status.message) setStatus({ type: "", message: "" });
  };

  const handleReset = () => {
    setFormData(initialData);
    setHasChanges(false);
    setStatus({ type: "", message: "" });
  };

  // 4. Delete Handler
  const handleDelete = async () => {
    setIsDeleting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(apiUrl(`/delete/${formData.ID}`), {
        method: "DELETE",
      });

      if (response.ok || response.status === 200) {
        setStatus({
          type: "success",
          message: "Record deleted successfully.",
        });
        // Navigate away after a short delay
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setStatus({
        type: "error",
        message: "Failed to delete record. Please check network connection.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 5. Update Submission Logic
  const handleSave = async () => {
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    const changes: Partial<UserData> = {};
    const keys = Object.keys(formData) as Array<keyof UserData>;

    keys.forEach((key) => {
      if (formData[key] !== initialData[key]) {
        changes[key] = formData[key] as any; // Allow generic assignment for partial update
      }
    });

    if (Object.keys(changes).length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl(`/updateRequest/${formData.ID}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      }

        // const response = await fetch(
        //   apiUrl(`/update/${formData.ID}`),
        //   {
        //     method: "PUT",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(changes),
        //   }
      );

      if (response.ok || response.status === 200) {
        setStatus({
          type: "success",
          message: "Citizen record updated successfully.",
        });
        // Update initialData to match formData after successful save
        setInitialData({ ...formData });
        // Hide the footer bar by resetting hasChanges
        setHasChanges(false);
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Update failed:", error);
      setStatus({
        type: "error",
        message: "Submission failed. Please check network connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredential = async () => {
    if (!credentialType || !credentialValue || !formData.ID) return;
    setStatus({ type: "", message: "" });
    try {
      const response = await fetch(apiUrl("/add-credential"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ID: formData.ID,
          credentialType,
          credentialValue,
          details: `${credentialType} linked from citizen portal`,
          actor: "CITIZEN",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed");
      setCredentialValue("");
      setLinkedCredentials(data.LinkedCredentials || []);
      setOriginalLinkedCredentials(data.LinkedCredentials || []);
      setShowCredentialPulse(true);
      setTimeout(() => setShowCredentialPulse(false), 1400);
      setStatus({ type: "success", message: "New credential linked successfully." });
    } catch (error) {
      setStatus({ type: "error", message: "Failed to link credential." });
    }
  };

  const handleCredentialInlineEdit = (index: number, value: string) => {
    setLinkedCredentials((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, credentialValue: value } : item,
      ),
    );
  };

  const handleCredentialUpdate = async (index: number) => {
    const target = linkedCredentials[index];
    const source = originalLinkedCredentials.find(
      (item, idx) =>
        idx === index && item.credentialType === target.credentialType,
    );
    const oldCredentialValue = source?.credentialValue;
    if (!oldCredentialValue || !target.credentialValue) return;

    try {
      const response = await fetch(apiUrl("/update-credential"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ID: formData.ID,
          credentialType: target.credentialType,
          oldCredentialValue,
          newCredentialValue: target.credentialValue,
          details: `${target.credentialType} edited from profile`,
          actor: "CITIZEN",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to update");
      setLinkedCredentials(data.LinkedCredentials || []);
      setOriginalLinkedCredentials(data.LinkedCredentials || []);
      setShowCredentialPulse(true);
      setTimeout(() => setShowCredentialPulse(false), 1400);
      setStatus({ type: "success", message: "Credential updated successfully." });
    } catch (error) {
      setStatus({ type: "error", message: "Failed to update credential." });
    }
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-700 ease-in-out ${
        isDarkMode
          ? "bg-[#0a0a0c] text-slate-200"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Navigation / Branding Bar */}
      <div
        className={`border-b sticky top-0 z-40 transition-colors duration-700 ${
          isDarkMode
            ? "bg-[#0f0f11] border-white/10"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-[#000080] p-1.5 rounded-full text-white">
                <Landmark size={20} />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-xs font-bold uppercase tracking-widest leading-none ${
                    isDarkMode ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  Government of India
                </span>
                <span
                  className={`text-sm font-bold leading-tight ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  Citizen Data Portal
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isDarkMode
                    ? "bg-white/10 text-slate-300"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                Official Record
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Header Card */}
        <div
          className={`rounded-lg shadow-sm border p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-colors duration-700 ${
            isDarkMode
              ? "bg-[#0f0f11] border-white/10"
              : "bg-white border-slate-200"
          }`}
        >
          {/* Decorative Background Pattern */}
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none ${
              isDarkMode ? "bg-white/5" : "bg-slate-50"
            }`}
          ></div>

          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div
              className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-4 shadow-md flex items-center justify-center text-4xl font-bold select-none ${
                isDarkMode
                  ? "bg-white/10 border-white/20 text-blue-400"
                  : "bg-slate-100 border-white text-[#000080]"
              }`}
            >
              {formData.FirstName?.[0]}
              {formData.LastName?.[0]}
            </div>
            <div
              className={`absolute bottom-1 right-1 p-1.5 rounded-full ring-4 shadow-sm ${
                isDarkMode
                  ? "bg-green-500 text-white ring-[#0f0f11]"
                  : "bg-green-600 text-white ring-white"
              }`}
            >
              <CheckCircle2 size={16} strokeWidth={3} />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <h1
                className={`text-3xl font-bold tracking-tight ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                {formData.FirstName} {formData.LastName}
              </h1>
            </div>

            <p
              className={`font-medium mb-4 flex items-center justify-center md:justify-start gap-2 ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <MapPin size={16} className="text-[#FF9933]" />
              {formData.State}, India
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div
                className={`px-3 py-1 rounded text-xs font-semibold border flex items-center gap-2 ${
                  isDarkMode
                    ? "bg-white/10 text-slate-300 border-white/20"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <Shield
                  size={14}
                  className={isDarkMode ? "text-blue-400" : "text-[#000080]"}
                />
                ID: {formData.ID}
              </div>
              <div
                className={`px-3 py-1 rounded text-xs font-semibold border flex items-center gap-2 ${
                  isDarkMode
                    ? "bg-white/10 text-slate-300 border-white/20"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <Calendar
                  size={14}
                  className={isDarkMode ? "text-blue-400" : "text-[#000080]"}
                />
                DOB: {formData.Birthday}
              </div>
            </div>
          </div>
        </div>
        {/* Status Notification */}
        {status.message && (
          <div
            className={`rounded-md border p-4 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-1 ${
              status.type === "error"
                ? isDarkMode
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-red-50 border-red-200 text-red-800"
                : isDarkMode
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {status.type === "error" ? (
              <AlertCircle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
            <span className="font-medium text-sm">{status.message}</span>
          </div>
        )}
        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Details */}
            <div
              className={`rounded-lg shadow-sm border overflow-hidden transition-colors duration-700 ${
                isDarkMode
                  ? "bg-[#0f0f11] border-white/10"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-700 ${
                  isDarkMode
                    ? "border-white/10 bg-white/5"
                    : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <h2
                  className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  <User size={18} /> Personal Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup
                  label="First Name"
                  name="FirstName"
                  value={formData.FirstName}
                  onChange={handleInputChange}
                  isModified={initialData.FirstName !== formData.FirstName}
                  isDarkMode={isDarkMode}
                />
                <InputGroup
                  label="Last Name"
                  name="LastName"
                  value={formData.LastName}
                  onChange={handleInputChange}
                  isModified={initialData.LastName !== formData.LastName}
                  isDarkMode={isDarkMode}
                />
                <InputGroup
                  label="Father's Name"
                  name="FatherName"
                  value={formData.FatherName}
                  onChange={handleInputChange}
                  isModified={initialData.FatherName !== formData.FatherName}
                  isDarkMode={isDarkMode}
                />
                <InputGroup
                  label="Mother's Name"
                  name="MotherName"
                  value={formData.MotherName}
                  onChange={handleInputChange}
                  isModified={initialData.MotherName !== formData.MotherName}
                  isDarkMode={isDarkMode}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup
                    label="Gender"
                    name="Sex"
                    value={formData.Sex}
                    onChange={handleInputChange}
                    isModified={initialData.Sex !== formData.Sex}
                    isDarkMode={isDarkMode}
                  />
                  <InputGroup
                    label="Age"
                    name="Age"
                    type="number"
                    value={formData.Age}
                    onChange={handleInputChange}
                    isModified={initialData.Age !== formData.Age}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <InputGroup
                  label="Date of Birth"
                  name="Birthday"
                  value={formData.Birthday}
                  icon={Calendar}
                  onChange={handleInputChange}
                  disabled
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

            {/* Contact Details */}
            <div
              className={`rounded-lg shadow-sm border overflow-hidden transition-colors duration-700 ${
                isDarkMode
                  ? "bg-[#0f0f11] border-white/10"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-700 ${
                  isDarkMode
                    ? "border-white/10 bg-white/5"
                    : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <h2
                  className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  <Phone size={18} /> Contact & Location
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup
                  label="Phone Numbers"
                  name="Phone"
                  value={formData.Phone}
                  fullWidth
                  icon={Phone}
                  onChange={handleInputChange}
                  isModified={initialData.Phone !== formData.Phone}
                  isDarkMode={isDarkMode}
                />
                <InputGroup
                  label="State / Union Territory"
                  name="State"
                  value={formData.State}
                  icon={Building2}
                  onChange={handleInputChange}
                  isModified={initialData.State !== formData.State}
                  isDarkMode={isDarkMode}
                />
                <InputGroup
                  label="District Code"
                  name="DistrictId"
                  type="number"
                  value={formData["DistrictId"]}
                  icon={Hash}
                  onChange={handleInputChange}
                  isModified={
                    initialData["DistrictId"] !== formData["DistrictId"]
                  }
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </div>

          {/* Side Column */}
          <div className="space-y-8">
            {/* Identity Proofs */}
            <div
              className={`rounded-lg shadow-sm border overflow-hidden transition-colors duration-700 ${
                isDarkMode
                  ? "bg-[#0f0f11] border-white/10"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-4 border-b transition-colors duration-700 ${
                  isDarkMode
                    ? "border-white/10 bg-white/5"
                    : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <h2
                  className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  <Fingerprint size={18} /> Identity Proofs
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <InputGroup
                  label="Aadhaar Number"
                  name="Aadhaar"
                  value={formData.Aadhaar}
                  icon={CreditCard}
                  onChange={handleInputChange}
                  disabled
                  isDarkMode={isDarkMode}
                />
                <InputGroup
                  label="Government ID (EPIC)"
                  name="VoterId"
                  value={formData["VoterId"]}
                  icon={CreditCard}
                  onChange={handleInputChange}
                  disabled
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

            {/* System Metadata */}
            <div
              className={`rounded-lg shadow-sm border overflow-hidden transition-colors duration-700 ${
                isDarkMode
                  ? "bg-[#0f0f11] border-white/10"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-4 border-b transition-colors duration-700 ${
                  isDarkMode
                    ? "border-white/10 bg-white/5"
                    : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <h2
                  className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  <Shield size={18} /> Secure Data
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <InputGroup
                  label="System ID"
                  name="_id"
                  value={formData._id}
                  disabled
                  onChange={handleInputChange}
                  isDarkMode={isDarkMode}
                />
                <InputGroup
                  label="UVID"
                  name="ID"
                  value={formData.ID}
                  onChange={handleInputChange}
                  disabled
                  isDarkMode={isDarkMode}
                />
                <InputGroup
                  label="Access Key"
                  name="DefPassword"
                  type="password"
                  value={formData.DefPassword}
                  onChange={handleInputChange}
                  isModified={initialData.DefPassword !== formData.DefPassword}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

            {/* Link New Credential */}
            <div
              className={`rounded-lg shadow-sm border overflow-hidden transition-colors duration-700 ${
                isDarkMode
                  ? "bg-[#0f0f11] border-white/10"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-4 border-b transition-colors duration-700 ${
                  isDarkMode
                    ? "border-white/10 bg-white/5"
                    : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <h2
                  className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  <Link2 size={18} /> Link New Credential
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <select
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm text-slate-900"
                >
                  <option value="AADHAAR">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                </select>
                <input
                  value={credentialValue}
                  onChange={(e) => setCredentialValue(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm text-slate-900"
                  placeholder="Enter credential number"
                />
                <button
                  type="button"
                  onClick={handleAddCredential}
                  className="w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white"
                >
                  Add Credential
                </button>
                {showCredentialPulse && (
                  <div className="relative overflow-hidden rounded-md border border-emerald-300 bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">
                    <span className="absolute inset-0 animate-pulse bg-emerald-200/40" />
                    <span className="relative inline-flex items-center gap-1">
                      <Sparkles size={12} /> Credential linked successfully
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/audit-trail?id=${formData.ID}`)}
                  className="w-full rounded-md bg-slate-700 py-2 text-sm font-semibold text-white"
                >
                  View Audit Trail
                </button>
              </div>
            </div>

            {/* Linked Credentials on Main Screen */}
            <div
              className={`rounded-lg shadow-sm border overflow-hidden transition-colors duration-700 ${
                isDarkMode
                  ? "bg-[#0f0f11] border-white/10"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-4 border-b transition-colors duration-700 ${
                  isDarkMode
                    ? "border-white/10 bg-white/5"
                    : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <h2
                  className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  <CreditCard size={18} /> Linked Credentials
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {linkedCredentials.length === 0 ? (
                  <p className="text-xs opacity-70">No linked credentials yet.</p>
                ) : (
                  linkedCredentials.map((credential, index) => (
                    <div key={`${credential.credentialType}-${index}`} className="rounded-md border p-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                        {credential.credentialType}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={credential.credentialValue || ""}
                          onChange={(e) =>
                            handleCredentialInlineEdit(index, e.target.value)
                          }
                          className="flex-1 rounded-md border px-3 py-2 text-sm text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleCredentialUpdate(index)}
                          className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="h-24"></div> {/* Spacer for fixed footer */}
      </div>

      {/* Delete Button - Fixed Position */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isDeleting || isLoading}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
          isDarkMode
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-red-500 hover:bg-red-600 text-white"
        }`}
        title="Delete ID Record"
      >
        {isDeleting ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Trash2 size={20} />
        )}
      </button>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`rounded-lg shadow-xl border max-w-md w-full mx-4 transition-colors duration-700 ${
              isDarkMode
                ? "bg-[#0f0f11] border-white/10"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-full ${
                    isDarkMode ? "bg-red-500/20" : "bg-red-100"
                  }`}
                >
                  <AlertCircle
                    size={24}
                    className={isDarkMode ? "text-red-400" : "text-red-600"}
                  />
                </div>
                <h3
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Delete ID Record
                </h3>
              </div>
              <p
                className={`text-sm mb-6 ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Are you sure you want to delete this government ID record? This
                action cannot be undone. The record for{" "}
                <span className="font-semibold">
                  {formData.FirstName} {formData.LastName}
                </span>{" "}
                (ID: {formData.ID}) will be permanently removed from the system.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isDarkMode
                      ? "text-slate-300 hover:bg-white/10"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors flex items-center gap-2 ${
                    isDarkMode
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Footer Action Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 border-t-4 border-[#FF9933] transition-all duration-300 ease-in-out z-50 ${
          hasChanges ? "translate-y-0" : "translate-y-full"
        } ${
          isDarkMode
            ? "bg-[#0f0f11] shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
            : "bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            className={`flex items-center gap-3 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <div
              className={`p-2 rounded-full text-[#FF9933] ${
                isDarkMode ? "bg-orange-500/20" : "bg-orange-100"
              }`}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <p
                className={`text-sm font-bold ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}
              >
                Unsaved Changes Detected
              </p>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Update the central registry to save new data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded text-sm font-bold transition-colors uppercase tracking-wide ${
                isDarkMode
                  ? "text-slate-400 hover:bg-white/10 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide min-w-[140px] ${
                isDarkMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-[#000080] hover:bg-blue-900"
              }`}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isLoading ? "Processing..." : "Update Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
