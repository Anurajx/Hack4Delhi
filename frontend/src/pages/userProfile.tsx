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
  QrCode,
  Bell,
  X,
  Hash,
  Shield,
  Loader2,
  Building2,
  Landmark,
  Trash2,
  Link2,
  Sparkles,
  Download,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { generateIdCardPDF } from "../utils/generateIdCard";
import { QRCodeSVG } from "qrcode.react";

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
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone1: string;
    phone2: string;
  }>;
  bloodGroup?: string;
  medicalConditions?: string;
  allergies?: string;
  organDonor?: string;
  insuranceId?: string;
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
    | Array<{
        name: string;
        relationship: string;
        phone1: string;
        phone2: string;
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
  placeholder?: string;
}

interface UserProfileProps {
  userData?: UserData;
}

interface StatusState {
  type: "success" | "error" | "";
  message: string;
}

type EmergencyNotificationType =
  | "EMERGENCY_ACCESS_ALERT"
  | "EMERGENCY_PING"
  | string;

interface EmergencyNotification {
  uvid: string;
  type: EmergencyNotificationType;
  message: string;
  seenByUser: boolean;
  createdAt: string;
  smsSent?: boolean;
  smsRecipients?: string[];
}

interface EmergencyTokenGenerateResponse {
  token: string;
  emergencyUrl: string;
}

const normalizeMedicalProfile = (data: Partial<UserData> = {}): Partial<UserData> => ({
  bloodGroup: data.bloodGroup || "",
  medicalConditions: data.medicalConditions || "",
  allergies: data.allergies || "",
  organDonor: data.organDonor || "",
  insuranceId: data.insuranceId || "",
});

const normalizeEmergencyContacts = (
  raw?: UserData["emergencyContacts"]
): NonNullable<UserData["emergencyContacts"]> => {
  const contacts = Array.isArray(raw) ? raw : [];
  const c0 = contacts[0] || { name: "", relationship: "", phone1: "", phone2: "" };
  const c1 = contacts[1] || { name: "", relationship: "", phone1: "", phone2: "" };
  return [
    {
      name: c0.name || "",
      relationship: c0.relationship || "",
      phone1: c0.phone1 || "",
      phone2: c0.phone2 || "",
    },
    {
      name: c1.name || "",
      relationship: c1.relationship || "",
      phone1: c1.phone1 || "",
      phone2: c1.phone2 || "",
    },
  ];
};

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
  bloodGroup: "",
  medicalConditions: "",
  allergies: "",
  organDonor: "",
  insuranceId: "",
  emergencyContacts: [
    { name: "", relationship: "", phone1: "", phone2: "" },
    { name: "", relationship: "", phone1: "", phone2: "" },
  ],
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
  placeholder = "",
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
        placeholder={placeholder}
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Emergency Access Mode
  const [emergencyTokenUrl, setEmergencyTokenUrl] = useState<string>("");
  const [emergencyExpiresAt, setEmergencyExpiresAt] = useState<number | null>(
    null,
  );
  const [emergencyQRLoading, setEmergencyQRLoading] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState<StatusState>({
    type: "",
    message: "",
  });
  const [emergencyNotifications, setEmergencyNotifications] = useState<
    EmergencyNotification[]
  >([]);
  const [unreadEmergencyNotificationsCount, setUnreadEmergencyNotificationsCount] =
    useState(0);
  const [showEmergencyNotificationsModal, setShowEmergencyNotificationsModal] =
    useState(false);

  // 2. Handle Dynamic Prop Updates
  useEffect(() => {
    const normalizedUserData: UserData = {
      ...userData,
      ...normalizeMedicalProfile(userData),
      emergencyContacts: normalizeEmergencyContacts(userData.emergencyContacts),
    };
    setFormData(normalizedUserData);
    setInitialData(normalizedUserData);
    setLinkedCredentials(userData.LinkedCredentials || []);
    setOriginalLinkedCredentials(userData.LinkedCredentials || []);
    setHasChanges(false);
  }, [userData]);

  // Generate Emergency QR + refresh notifications for this UVID
  useEffect(() => {
    if (!formData.ID) return;

    const run = async () => {
      await generateEmergencyTokenAndUrl();
      await fetchEmergencyNotifications();
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.ID]);

  // --- Emergency Access Mode helpers ---
  async function generateEmergencyTokenAndUrl() {
    if (!formData.ID) return;
    setEmergencyQRLoading(true);
    setEmergencyStatus({ type: "", message: "" });
    try {
    const target = apiUrl(`/emergency/generate/${encodeURIComponent(formData.ID)}`);
    console.log(`API: Calling ${target}`);
      const res = await fetch(target, { method: "POST" });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Generation failed: ${res.status} ${errBody}`);
      }
      
      const data = (await res.json()) as EmergencyTokenGenerateResponse;
      const emergencyFullUrl = `${window.location.origin}${data.emergencyUrl}`;
      console.log(`Success: Registered token ${data.token}`);

      setEmergencyTokenUrl(emergencyFullUrl);
      // Backend expiresAt is 72 hours from createdAt; we mirror that locally for UI.
      setEmergencyExpiresAt(Date.now() + 72 * 60 * 60 * 1000);
    } catch (err) {
      console.error("Emergency generation error:", err);
      setEmergencyStatus({ type: "error", message: "Failed to generate Emergency QR." });
    } finally {
      setEmergencyQRLoading(false);
    }
  }

  async function fetchEmergencyNotifications() {
    if (!formData.ID) return;
    const target = apiUrl(`/emergency/notifications/${encodeURIComponent(formData.ID)}`);
    try {
      const res = await fetch(target);
      if (!res.ok) throw new Error("Fetch notifications failed");
      const data = await res.json();
      setEmergencyNotifications(data);
      setUnreadEmergencyNotificationsCount(data.filter((n: any) => !n.seenByUser).length);
    } catch (error) {
       console.error("Notifications fetch fail:", error);
       setEmergencyNotifications([]);
       setUnreadEmergencyNotificationsCount(0);
    }
  }

  async function handleRegenerateEmergency() {
    if (!formData.ID) return;
    setEmergencyQRLoading(true);
    setEmergencyStatus({ type: "", message: "" });
    try {
      console.log(`API: Revoking old tokens for ${formData.ID}`);
      await fetch(apiUrl(`/emergency/token/${encodeURIComponent(formData.ID)}`), { method: "DELETE" });
      
      console.log("API: Requesting new token");
      await generateEmergencyTokenAndUrl();
      
      setEmergencyStatus({
        type: "success",
        message: "Emergency access QR regenerated successfully.",
      });
      await fetchEmergencyNotifications();
    } catch (err) {
      console.error("Regeneration flow error:", err);
      setEmergencyStatus({ type: "error", message: "Failed to regenerate QR." });
    } finally {
      setEmergencyQRLoading(false);
    }
  }

  async function handleRevokeEmergencyAccess() {
    if (!formData.ID) return;
    setEmergencyQRLoading(true);
    setEmergencyStatus({ type: "", message: "" });
    try {
      const res = await fetch(
        apiUrl(`/emergency/token/${encodeURIComponent(formData.ID)}`),
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Revoke failed");

      // Wipe current access URL from UI
      setEmergencyTokenUrl("");
      setEmergencyExpiresAt(null);

      setEmergencyStatus({
        type: "success",
        message: "Current emergency access revoked successfully.",
      });
      await fetchEmergencyNotifications();
    } catch {
      setEmergencyStatus({
        type: "error",
        message: "Failed to revoke emergency access.",
      });
    } finally {
      setEmergencyQRLoading(false);
    }
  }

  async function openEmergencyNotificationsModal() {
    setShowEmergencyNotificationsModal(true);
    await fetchEmergencyNotifications();
  }

  function markAllEmergencyNotificationsAsRead() {
    setEmergencyNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        seenByUser: true,
      }))
    );
    setUnreadEmergencyNotificationsCount(0);
    // Stub: no backend endpoint yet.
  }

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

  type EmergencyContactField = "name" | "relationship" | "phone1" | "phone2";

  const handleEmergencyContactChange = (
    contactIndex: number,
    field: EmergencyContactField,
    value: string
  ) => {
    setFormData((prev) => {
      const contacts = normalizeEmergencyContacts(prev.emergencyContacts);
      const nextContacts = contacts.map((c, idx) =>
        idx === contactIndex ? { ...c, [field]: value } : c
      );

      const updatedData: UserData = {
        ...prev,
        emergencyContacts: nextContacts,
      };

      const isDirty = JSON.stringify(updatedData) !== JSON.stringify(initialData);
      setHasChanges(isDirty);
      if (status.message) setStatus({ type: "", message: "" });

      return updatedData;
    });
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

    const officialKeys = [
      "FirstName",
      "LastName",
      "Aadhaar",
      "Phone",
      "State",
      "DistrictId",
      "Birthday",
      "Sex",
      "FatherName",
      "MotherName",
    ];
    const directKeys = [
      "bloodGroup",
      "medicalConditions",
      "allergies",
      "organDonor",
      "insuranceId",
      "emergencyContacts",
    ];

    const officialChanges: any = {};
    const directChanges: any = {};

    Object.keys(formData).forEach((key) => {
      const isDirect = directKeys.includes(key);
      const isOfficial = officialKeys.includes(key);

      if (isDirect || isOfficial) {
        const current = formData[key as keyof UserData];
        const initial = initialData[key as keyof UserData];

        // Deep comparison for arrays and nested objects
        const hasChanged =
          JSON.stringify(current) !== JSON.stringify(initial);

        if (hasChanged) {
          if (isDirect) directChanges[key] = current;
          else officialChanges[key] = current;
        }
      }
    });

    console.log("Save operation started", {
      identity: formData.ID,
      officialChanges,
      directChanges,
    });

    if (
      Object.keys(officialChanges).length === 0 &&
      Object.keys(directChanges).length === 0
    ) {
      setIsLoading(false);
      return;
    }

    try {
      let success = true;

      // 1. Submit Official Change Request (requires approval)
      if (Object.keys(officialChanges).length > 0) {
        console.log("API: Submitting official update request", officialChanges);
        const res = await fetch(apiUrl(`/updateRequest/${formData.ID}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(officialChanges),
        });
        if (!res.ok) success = false;
      }

      // 2. Submit Direct Changes (emergency info - immediate state update)
      if (Object.keys(directChanges).length > 0) {
        console.log("API: Submitting direct profile update", directChanges);
        const res = await fetch(apiUrl(`/update-citizen/${formData.ID}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(directChanges),
        });
        if (!res.ok) success = false;
      }

      if (success) {
        setStatus({
          type: "success",
          message:
            Object.keys(officialChanges).length > 0
              ? "Emergency info updated! Official identity changes sent for validation."
              : "Profile changes saved successfully.",
        });
        // Update initialData to match current formData
        setInitialData({ ...formData });
        setHasChanges(false);
      } else {
        throw new Error("One or more update steps failed");
      }
    } catch (error) {
      console.error("Critical: Update failed", error);
      setStatus({
        type: "error",
        message: "Failed to save profile. Please check your network.",
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

  const handleDownloadCard = async () => {
    if (!formData.ID) return;
    setIsGeneratingPDF(true);
    try {
      const baseUrl = window.location.origin;
      await generateIdCardPDF(formData, baseUrl, emergencyTokenUrl);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setStatus({ type: "error", message: "Failed to generate ID card PDF." });
    } finally {
      setIsGeneratingPDF(false);
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
        {/* Status Notification + Integrity Badge */}
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
          {/* Prominent Linked Credentials + Add Form */}
          <div className="lg:col-span-3">
            <div
              className={`rounded-lg shadow-sm border overflow-hidden transition-colors duration-700 ${
                isDarkMode ? "bg-[#0f0f11] border-white/10" : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-700 ${
                  isDarkMode ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <h2
                  className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  <CreditCard size={18} /> Linked Credentials
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCard}
                    disabled={isGeneratingPDF}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 ${
                      isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-[#000080] hover:bg-blue-900 text-white"
                    }`}
                  >
                    {isGeneratingPDF ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    {isGeneratingPDF ? "Generating…" : "Download ID Card"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/audit-trail?id=${formData.ID}`)}
                    className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    View Audit Trail
                  </button>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 rounded-md border p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                    <Link2 size={14} /> Link New Credential
                  </div>
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
                </div>
                <div className="lg:col-span-2 space-y-3">
                  {linkedCredentials.length === 0 ? (
                    <p className="text-xs opacity-70">No linked credentials yet.</p>
                  ) : (
                    linkedCredentials.map((credential, index) => (
                      <div
                        key={`${credential.credentialType}-${index}`}
                        className="rounded-md border p-3"
                      >
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
          {/* Identity QR Codes */}
          <div className="lg:col-span-3 space-y-6">
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
                  <QrCode size={18} /> Identity QR Codes
                </h2>

                <button
                  type="button"
                  onClick={() => void openEmergencyNotificationsModal()}
                  className={`relative inline-flex items-center justify-center rounded-full px-3 py-2 border transition-colors ${
                    isDarkMode
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                  title="View emergency notifications"
                >
                  <Bell size={16} />
                  {unreadEmergencyNotificationsCount > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDarkMode ? "bg-red-500 text-white" : "bg-red-600 text-white"
                      }`}
                    >
                      {unreadEmergencyNotificationsCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR 1: Your UVID */}
                <div className="rounded-md border p-4 flex flex-col items-center gap-3">
                  <div className="text-xs font-bold uppercase tracking-wider opacity-80 text-center">
                    Your UVID
                  </div>
                  <QRCodeSVG
                    value={`${window.location.origin}/citizen-card/${formData.ID}`}
                    size={140}
                    bgColor="#FFFFFF"
                    fgColor="#000080"
                    level="M"
                    marginSize={2}
                  />
                  <p className="text-xs text-center mt-1 text-slate-600">
                    Show to officers for identity verification
                  </p>
                </div>

                {/* QR 2: Emergency Access QR */}
                <div className="rounded-md border p-4 flex flex-col items-center gap-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-600 text-center">
                    Emergency Access QR
                  </div>
                  <QRCodeSVG
                    value={emergencyTokenUrl || ""}
                    size={140}
                    bgColor="#FFFFFF"
                    fgColor="#000080"
                    level="M"
                    marginSize={2}
                  />
                  <p
                    className={`text-xs text-center mt-1 ${
                      isDarkMode ? "text-red-300" : "text-red-600"
                    }`}
                  >
                    For medical/disaster use only — every scan is logged
                  </p>
                  {emergencyExpiresAt && (
                    <p className="text-xs text-center text-slate-600 mt-1">
                      Valid until:{" "}
                      {new Date(emergencyExpiresAt).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  <div className="w-full mt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRevokeEmergencyAccess()}
                      disabled={emergencyQRLoading}
                      className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${
                        isDarkMode
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      {emergencyQRLoading ? "Processing…" : "Revoke Emergency Access"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRegenerateEmergency()}
                      disabled={emergencyQRLoading}
                      className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-[#000080] hover:bg-blue-900 text-white"
                      }`}
                    >
                      Regenerate
                    </button>
                  </div>

                  {emergencyStatus.message && (
                    <div
                      className={`w-full mt-2 rounded-md border p-3 text-xs font-semibold shadow-sm ${
                        emergencyStatus.type === "error"
                          ? isDarkMode
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-red-50 border-red-200 text-red-800"
                          : isDarkMode
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-emerald-50 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      {emergencyStatus.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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

            {/* Medical & Emergency Profile */}
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
                    isDarkMode ? "text-red-400" : "text-[#b91c1c]"
                  }`}
                >
                  <AlertCircle size={18} /> Medical & Emergency Profile
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={(formData.bloodGroup as string) || ""}
                    onChange={(e) => handleInputChange(e as any)}
                    className={`px-4 py-2.5 rounded-md border text-sm font-medium transition-all ${
                      isDarkMode
                        ? "border-white/10 bg-white/5 text-white"
                        : "border-slate-300 bg-white text-slate-900"
                    }`}
                  >
                    <option value="">Select Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Organ Donor Status
                  </label>
                  <div className="flex items-center gap-4 py-2">
                    {["Yes", "No"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="organDonor"
                          value={opt}
                          checked={formData.organDonor === opt}
                          onChange={(e) => handleInputChange(e as any)}
                          className="w-4 h-4 accent-red-600"
                        />
                        <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <InputGroup
                    label="Allergies (comma-separated)"
                    name="allergies"
                    value={formData.allergies as any}
                    fullWidth
                    placeholder="e.g. Penicillin, Pollen, Nuts (leave blank if none)"
                    onChange={handleInputChange}
                    isModified={initialData.allergies !== formData.allergies}
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Existing Medical Conditions
                  </label>
                  <textarea
                    name="medicalConditions"
                    value={(formData.medicalConditions as string) || ""}
                    onChange={(e) => handleInputChange(e as any)}
                    rows={3}
                    placeholder="Provide brief details about chronic conditions, or 'None'"
                    className={`w-full px-4 py-2.5 rounded-md border text-sm font-medium transition-all ${
                      isDarkMode
                        ? "border-white/10 bg-white/5 text-white"
                        : "border-slate-300 bg-white text-slate-900"
                    }`}
                  />
                </div>

                <InputGroup
                  label="Private Insurance ID"
                  name="insuranceId"
                  value={(formData.insuranceId as string) || ""}
                  icon={Shield}
                  onChange={handleInputChange}
                  isModified={initialData.insuranceId !== formData.insuranceId}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

            {/* Emergency Contacts */}
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
                  <Phone size={18} /> Emergency Contacts
                </h2>
              </div>

              <div className="p-6 space-y-5">
                {[0, 1].map((idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 ${
                        isPrimary
                          ? "border-blue-500/40"
                          : "border-slate-500/40"
                      } border-l-4 ${
                        isPrimary ? "border-blue-500" : "border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="text-sm font-extrabold">
                          {isPrimary ? "Primary Contact" : "Secondary Contact"}
                        </div>
                        <span
                          className={`text-xs font-extrabold rounded-full px-3 py-1 ${
                            isPrimary
                              ? "bg-blue-600 text-white"
                              : "bg-slate-500 text-white"
                          }`}
                        >
                          {isPrimary ? "Primary Contact" : "Secondary Contact"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Contact name
                          </label>
                          <input
                            value={formData.emergencyContacts?.[idx]?.name || ""}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                idx,
                                "name",
                                e.target.value
                              )
                            }
                            className={`w-full px-4 py-2 rounded-md border text-sm ${
                              isDarkMode
                                ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                                : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                            }`}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Relationship
                          </label>
                          <input
                            value={
                              formData.emergencyContacts?.[idx]?.relationship || ""
                            }
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                idx,
                                "relationship",
                                e.target.value
                              )
                            }
                            className={`w-full px-4 py-2 rounded-md border text-sm ${
                              isDarkMode
                                ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                                : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Mobile number 1
                          </label>
                          <input
                            value={formData.emergencyContacts?.[idx]?.phone1 || ""}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                idx,
                                "phone1",
                                e.target.value
                              )
                            }
                            className={`w-full px-4 py-2 rounded-md border text-sm ${
                              isDarkMode
                                ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                                : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                            }`}
                            placeholder="e.g. 9876543210"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Mobile number 2 (alternate)
                          </label>
                          <input
                            value={formData.emergencyContacts?.[idx]?.phone2 || ""}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                idx,
                                "phone2",
                                e.target.value
                              )
                            }
                            className={`w-full px-4 py-2 rounded-md border text-sm ${
                              isDarkMode
                                ? "border-white/10 bg-white/5 text-white placeholder-slate-500"
                                : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                            }`}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
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

          </div>
        </div>
        <div className="h-24"></div> {/* Spacer for fixed footer */}
      </div>

      {/* Emergency Notifications Modal */}
      {showEmergencyNotificationsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`rounded-lg shadow-xl border max-w-2xl w-full mx-4 overflow-hidden transition-colors duration-700 ${
              isDarkMode ? "bg-[#0f0f11] border-white/10" : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`p-5 border-b flex items-center justify-between gap-4 transition-colors duration-700 ${
                isDarkMode ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell size={18} />
                <h3
                  className={`text-sm font-bold uppercase tracking-wide ${
                    isDarkMode ? "text-blue-400" : "text-[#000080]"
                  }`}
                >
                  Emergency Notifications
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllEmergencyNotificationsAsRead}
                  className={`rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                    isDarkMode
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Mark all as read
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmergencyNotificationsModal(false)}
                  className={`rounded-md p-2 transition-colors ${
                    isDarkMode
                      ? "hover:bg-white/10 text-slate-300"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 max-h-[70vh] overflow-auto space-y-3">
              {emergencyNotifications.length === 0 ? (
                <div className="text-sm text-slate-600">
                  No emergency access events recorded
                </div>
              ) : (
                emergencyNotifications.map((n, idx) => {
                  const isAlert = n.type === "EMERGENCY_ACCESS_ALERT";
                  const badgeClass = isAlert
                    ? isDarkMode
                      ? "bg-red-500 text-white"
                      : "bg-red-600 text-white"
                    : isDarkMode
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-amber-100 text-amber-900 border border-amber-200";

                  const accessorMatch = n.message.match(/^(.+?)\s*\(([^)]+)\)/);
                  const accessorName = accessorMatch?.[1];
                  const accessorRole = accessorMatch?.[2];

                  return (
                    <div
                      key={`${n.type}-${n.createdAt}-${idx}`}
                      className={`rounded-md border p-3 ${
                        isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${badgeClass}`}
                        >
                          {n.type}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>

                      {(() => {
                        const smsSent = n.smsSent === true;
                        const recipients = Array.isArray(n.smsRecipients)
                          ? n.smsRecipients
                          : [];

                        const maskPhone = (phone: string) => {
                          const digits = String(phone || "").replace(/\D/g, "");
                          if (!digits) return "";
                          if (digits.length <= 4) return digits;
                          return `XXXXXX${digits.slice(-4)}`;
                        };

                        const maskedRecipients = recipients
                          .map((p) => maskPhone(p))
                          .filter(Boolean)
                          .join(", ");

                        return (
                          <div className="mt-2">
                            <div
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                smsSent
                                  ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                                  : "bg-slate-500/10 text-slate-400 border-slate-300/20"
                              }`}
                            >
                              <MessageSquare size={12} />
                              {smsSent ? "SMS Sent" : "SMS Failed"}
                            </div>

                            <div
                              className={`text-xs mt-1 ${
                                isDarkMode ? "text-slate-400" : "text-slate-600"
                              }`}
                            >
                              {maskedRecipients || "—"}
                            </div>
                          </div>
                        );
                      })()}

                      {accessorName && accessorRole && (
                        <div className="mt-2 text-xs font-bold text-slate-700">
                          {accessorName} • {accessorRole}
                        </div>
                      )}

                      <p
                        className={`mt-2 text-sm ${
                          isDarkMode ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        {n.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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
