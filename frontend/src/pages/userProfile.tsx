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
  type LucideIcon,
} from "lucide-react";

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
  "District ID": number;
  Phone: string;
  "Voter ID": string;
  Def_Password: string;
  State: string;
  // Index signature to allow dynamic access via keys
  [key: string]: string | number;
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
  "District ID": 2104,
  Phone: "9445560413 , 9668871603",
  "Voter ID": "PLD9O0401",
  Def_Password: "PLD@8779",
  State: "Sikkim",
};

// --- COMPONENT DEFINED OUTSIDE TO PREVENT RE-RENDER/FOCUS LOSS ---
const InputGroup: React.FC<InputGroupProps> = ({
  label,
  name,
  value,
  onChange,
  icon: Icon,
  type = "text",
  fullWidth = false,
  disabled = false,
  isModified = false,
}) => (
  <div
    className={`flex flex-col space-y-1.5 ${
      fullWidth ? "col-span-1 md:col-span-2" : ""
    }`}
  >
    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 select-none">
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
          w-full px-4 py-2.5 rounded-md border 
          text-slate-900 placeholder-slate-400 text-sm font-medium
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-1 
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${
            isModified
              ? "border-orange-400 bg-orange-50/10 focus:ring-orange-500 focus:border-orange-500"
              : "border-slate-300 bg-white hover:border-slate-400 focus:ring-[#000080] focus:border-[#000080]"
          }
        `}
      />
      {Icon && (
        <div
          className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
            isModified
              ? "text-orange-500"
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
  const [formData, setFormData] = useState<UserData>(userData);
  const [initialData, setInitialData] = useState<UserData>(userData);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusState>({ type: "", message: "" });

  // 2. Handle Dynamic Prop Updates
  useEffect(() => {
    setFormData(userData);
    setInitialData(userData);
    setHasChanges(false);
  }, [userData]);

  // 3. Change Detection Logic
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Auto-convert number fields
    const newValue =
      name === "Age" || name === "District ID" ? Number(value) : value;

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

  // 4. Update Submission Logic
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
      const response = await fetch(
        `https://hack4delhi.onrender.com/update/${formData.ID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        }
      );

      if (response.ok || response.status === 200) {
        setStatus({
          type: "success",
          message: "Citizen record updated successfully.",
        });
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navigation / Branding Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-[#000080] p-1.5 rounded-full text-white">
                <Landmark size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Government of India
                </span>
                <span className="text-sm font-bold text-[#000080] leading-tight">
                  Citizen Data Portal
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                Official Record
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          {/* Decorative Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>

          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold text-[#000080] select-none">
              {formData.FirstName?.[0]}
              {formData.LastName?.[0]}
            </div>
            <div className="absolute bottom-1 right-1 bg-green-600 text-white p-1.5 rounded-full ring-4 ring-white shadow-sm">
              <CheckCircle2 size={16} strokeWidth={3} />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {formData.FirstName} {formData.LastName}
              </h1>
            </div>

            <p className="text-slate-500 font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
              <MapPin size={16} className="text-[#FF9933]" />
              {formData.State}, India
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="px-3 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-2">
                <Shield size={14} className="text-[#000080]" />
                ID: {formData.ID}
              </div>
              <div className="px-3 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-2">
                <Calendar size={14} className="text-[#000080]" />
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
                ? "bg-red-50 border-red-200 text-red-800"
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wide flex items-center gap-2">
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
                />
                <InputGroup
                  label="Last Name"
                  name="LastName"
                  value={formData.LastName}
                  onChange={handleInputChange}
                  isModified={initialData.LastName !== formData.LastName}
                />
                <InputGroup
                  label="Father's Name"
                  name="FatherName"
                  value={formData.FatherName}
                  onChange={handleInputChange}
                  isModified={initialData.FatherName !== formData.FatherName}
                />
                <InputGroup
                  label="Mother's Name"
                  name="MotherName"
                  value={formData.MotherName}
                  onChange={handleInputChange}
                  isModified={initialData.MotherName !== formData.MotherName}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup
                    label="Gender"
                    name="Sex"
                    value={formData.Sex}
                    onChange={handleInputChange}
                    isModified={initialData.Sex !== formData.Sex}
                  />
                  <InputGroup
                    label="Age"
                    name="Age"
                    type="number"
                    value={formData.Age}
                    onChange={handleInputChange}
                    isModified={initialData.Age !== formData.Age}
                  />
                </div>
                <InputGroup
                  label="Date of Birth"
                  name="Birthday"
                  value={formData.Birthday}
                  icon={Calendar}
                  onChange={handleInputChange}
                  isModified={initialData.Birthday !== formData.Birthday}
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wide flex items-center gap-2">
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
                />
                <InputGroup
                  label="State / Union Territory"
                  name="State"
                  value={formData.State}
                  icon={Building2}
                  onChange={handleInputChange}
                  isModified={initialData.State !== formData.State}
                />
                <InputGroup
                  label="District Code"
                  name="District ID"
                  type="number"
                  value={formData["District ID"]}
                  icon={Hash}
                  onChange={handleInputChange}
                  isModified={
                    initialData["District ID"] !== formData["District ID"]
                  }
                />
              </div>
            </div>
          </div>

          {/* Side Column */}
          <div className="space-y-8">
            {/* Identity Proofs */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wide flex items-center gap-2">
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
                  isModified={initialData.Aadhaar !== formData.Aadhaar}
                />
                <InputGroup
                  label="Voter ID (EPIC)"
                  name="Voter ID"
                  value={formData["Voter ID"]}
                  icon={CreditCard}
                  onChange={handleInputChange}
                  isModified={initialData["Voter ID"] !== formData["Voter ID"]}
                />
              </div>
            </div>

            {/* System Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-[#000080] uppercase tracking-wide flex items-center gap-2">
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
                />
                <InputGroup
                  label="User Reference ID"
                  name="ID"
                  value={formData.ID}
                  onChange={handleInputChange}
                  isModified={initialData.ID !== formData.ID}
                />
                <InputGroup
                  label="Access Key"
                  name="Def_Password"
                  type="password"
                  value={formData.Def_Password}
                  onChange={handleInputChange}
                  isModified={
                    initialData.Def_Password !== formData.Def_Password
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="h-24"></div> {/* Spacer for fixed footer */}
      </div>

      {/* Persistent Footer Action Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white border-t-4 border-[#FF9933] shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out z-50 ${
          hasChanges ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="bg-orange-100 p-2 rounded-full text-[#FF9933]">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Unsaved Changes Detected
              </p>
              <p className="text-xs text-slate-500">
                Update the central registry to save new data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors uppercase tracking-wide"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded bg-[#000080] text-white text-sm font-bold hover:bg-blue-900 transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide min-w-[140px]"
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
