import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Check,
  X,
  Users,
  MapPin,
  Phone,
  Calendar,
  Fingerprint,
  CreditCard,
  RefreshCw,
  FilePlus,
  FileEdit,
  User,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
//import console from "console";

// --- Types ---
interface Voter {
  _id: string;
  ID: string;
  Aadhaar: string;
  FirstName: string;
  LastName: string;
  MotherName: string;
  FatherName: string;
  Sex: "M" | "F" | "O";
  Birthday: string;
  Age: number;
  "District ID": number;
  Phone: string;
  "Voter ID": string;
  State: string;
  Def_Password?: string;

  // Update Request Fields (Optional)
  CurrentAddress?: string;
  NewAddress?: string;
  CurrentPhone?: string;
  NewPhone?: string;
  CurrentName?: string;
  NewName?: string;
  UpdateRequestType?: string; // e.g., "Address Change", "Correction"

  // For update requests from /updateFetch
  updateField?: string; // The field that was changed (e.g., "Sex", "LastName")
  updateValue?: string | number; // The new value for that field
  fullVoterData?: Voter; // Full voter data fetched from /voters/:id
}

// --- Mock Data ---
const MOCK_REGISTRATIONS: Voter[] = [
  {
    _id: "6960d2c6a90da11f41b2e18e",
    ID: "LPU2776075",
    Aadhaar: "3591 4628 3661",
    FirstName: "Akash",
    LastName: "Singh",
    MotherName: "Aishwarya",
    FatherName: "Bhavesh",
    Sex: "M",
    Birthday: "16-02-1984",
    Age: 37,
    "District ID": 43,
    Phone: "9623412913",
    "Voter ID": "ABC659753",
    State: "Andhra Pradesh",
  },
  {
    _id: "6960d2c6a90da11f41b2e18f",
    ID: "ZCX3808115",
    Aadhaar: "5773 7940 7366",
    FirstName: "Dipti",
    LastName: "Kumar",
    MotherName: "Gayatri",
    FatherName: "Dheeraj",
    Sex: "F",
    Birthday: "13-01-1998",
    Age: 23,
    "District ID": 47,
    Phone: "9222325956",
    "Voter ID": "JID563930",
    State: "Andhra Pradesh",
  },
  {
    _id: "6960d2c6a90da11f41b2e190",
    ID: "RTN9250973",
    Aadhaar: "7820 3429 4038",
    FirstName: "Shlok",
    LastName: "Agarwal",
    MotherName: "Aparna",
    FatherName: "Girish",
    Sex: "M",
    Birthday: "04-02-1988",
    Age: 33,
    "District ID": 26,
    Phone: "9722768470",
    "Voter ID": "KOF752745",
    State: "Andhra Pradesh",
  },
];

const MOCK_UPDATES: Voter[] = [
  {
    _id: "upd_1",
    ID: "REQ882910",
    Aadhaar: "9988 7766 5544",
    FirstName: "Vikram",
    LastName: "Reddy",
    MotherName: "Sujata",
    FatherName: "Anil",
    Sex: "M",
    Birthday: "12-05-1990",
    Age: 34,
    "District ID": 43,
    Phone: "9876543210",
    "Voter ID": "VXY998877",
    State: "Andhra Pradesh",
    UpdateRequestType: "Migration",
    CurrentAddress: "H.No 12/A, Old Market, Dist 40",
    NewAddress: "Flat 404, Green Heights, Dist 43",
  },
  {
    _id: "upd_2",
    ID: "REQ112233",
    Aadhaar: "1122 3344 5566",
    FirstName: "Ananya",
    LastName: "Iyer",
    MotherName: "Lakshmi",
    FatherName: "Venkat",
    Sex: "F",
    Birthday: "20-11-1995",
    Age: 28,
    "District ID": 43,
    Phone: "9123456780",
    "Voter ID": "ANI112233",
    State: "Andhra Pradesh",
    UpdateRequestType: "Phone Update",
    CurrentPhone: "9123456780",
    NewPhone: "9988776655",
  },
  {
    _id: "upd_3",
    ID: "REQ445566",
    Aadhaar: "7788 9900 1122",
    FirstName: "Rajesh",
    LastName: "Koothrappali",
    MotherName: "Mrs. Koothrappali",
    FatherName: "V.M.",
    Sex: "M",
    Birthday: "06-10-1985",
    Age: 38,
    "District ID": 43,
    Phone: "8885552222",
    "Voter ID": "BIG876543",
    State: "Andhra Pradesh",
    UpdateRequestType: "Name Correction",
    CurrentName: "Rajesh Ramayan Koothrappali",
    NewName: "Rajesh R. Koothrappali",
  },
];

export default function BLOPortal() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<"registrations" | "updates">(
    "registrations"
  );
  const [data, setData] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(false);
  const [districtInput, setDistrictInput] = useState("");
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);

  // --- Actions ---

  const fetchData = async () => {
    setLoading(true);

    if (activeTab === "registrations") {
      // Fetch new registrations
      try {
        const response = await fetch(
          "https://hack4delhi.onrender.com/tempVoters"
        );
        if (!response.ok) throw new Error("Failed");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.warn("Backend not reachable, using mock data.");
        setTimeout(() => {
          setData(MOCK_REGISTRATIONS);
        }, 500);
      } finally {
        setLoading(false);
      }
    } else {
      // Fetch update requests and then fetch full voter details for each
      try {
        const response = await fetch(
          "https://hack4delhi.onrender.com/updateFetch"
        );
        if (!response.ok) throw new Error("Failed");
        const updateRequests = await response.json();

        // Fetch full voter details for each update request
        const updateRequestsWithDetails = await Promise.all(
          updateRequests.map(async (updateReq: any) => {
            try {
              // Fetch full voter details using the ID
              const voterResponse = await fetch(
                `https://hack4delhi.onrender.com/voters/${updateReq.ID}`
              );
              if (!voterResponse.ok) {
                console.warn(`Failed to fetch voter ${updateReq.ID}`);
                return null;
              }
              const fullVoterData = await voterResponse.json();

              // Determine which field was changed and its new value
              const changedFields = Object.keys(updateReq).filter(
                (key) => key !== "_id" && key !== "ID" && key !== "__v"
              );

              return {
                ...updateReq,
                fullVoterData: fullVoterData,
                updateField: changedFields[0] || "Unknown",
                updateValue: updateReq[changedFields[0]],
              };
            } catch (err) {
              console.error(`Error fetching voter ${updateReq.ID}:`, err);
              return null;
            }
          })
        );

        // Filter out any null values (failed fetches)
        const validUpdates = updateRequestsWithDetails.filter(
          (item) => item !== null
        ) as Voter[];

        setData(validUpdates);
      } catch (err) {
        console.warn("Backend not reachable, using mock data.");
        setTimeout(() => {
          setData(MOCK_UPDATES);
        }, 500);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    // Find the item before removing it (needed for update requests)
    const item = data.find((v) => v._id === id);
    if (!item) return;

    // Optimistic UI: Remove card instantly
    setData((prev) => prev.filter((v) => v._id !== id));

    try {
      if (activeTab === "registrations") {
        // For new registrations, use ID field (not _id)
        const voterId = item.ID;
        if (!voterId) {
          throw new Error("Voter ID not found");
        }

        const url =
          action === "approve"
            ? `https://hack4delhi.onrender.com/approve/${voterId}`
            : `https://hack4delhi.onrender.com/reject/${voterId}`;

        const response = await fetch(url, {
          method: action === "approve" ? "POST" : "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to ${action} registration`);
        }
      } else {
        // For update requests
        if (action === "approve") {
          // Send update request data to /update/:id where id is the voter's ID
          const updateData: any = {};
          if (item.updateField && item.updateValue !== undefined) {
            updateData[item.updateField] = item.updateValue;
          }

          const url = `https://hack4delhi.onrender.com/update/${item.ID}`;
          const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          });

          if (response.ok) {
            console.log(`Update for voter ${item.ID} approved.`);
            // Delete the update request from UpdateVoter collection after approval
            await fetch(
              `https://hack4delhi.onrender.com/rejectUpdate/${item.ID}`,
              {
                method: "DELETE",
              }
            );
          } else {
            throw new Error("Failed to approve update");
          }
        } else {
          // Reject - delete from update collection
          const url = `https://hack4delhi.onrender.com/rejectUpdate/${item.ID}`;
          await fetch(url, { method: "DELETE" });
        }
      }
    } catch (err) {
      console.error(`Error processing ${action}:`, err);
      // Re-add item on error
      setData((prev) => [...prev, item]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- Filter Logic ---

  const filteredData = useMemo(() => {
    if (!activeDistrict) return data;
    return data.filter((v) => v["District ID"].toString() === activeDistrict);
  }, [data, activeDistrict]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveDistrict(districtInput.trim() === "" ? null : districtInput);
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-700 ease-in-out ${
        isDarkMode
          ? "bg-[#0a0a0c] text-slate-200 selection:bg-indigo-500/30 selection:text-white"
          : "bg-[#F3F4F6] text-[#111827] selection:bg-indigo-100 selection:text-indigo-900"
      }`}
    >
      {/* --- Minimalist Modern Header --- */}
      <header
        className={`border-b sticky top-0 z-50 transition-colors duration-700 ${
          isDarkMode
            ? "bg-[#0f0f11] border-white/10"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
            <div className="h-px w-6 bg-current opacity-20"></div>
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-lg transition-colors duration-700 ${
                  isDarkMode
                    ? "bg-indigo-500/20 text-indigo-400 shadow-indigo-500/20"
                    : "bg-indigo-600 text-white shadow-indigo-200"
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <span
                className={`text-lg font-bold tracking-tight ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                BLO
                <span
                  className={`font-light ${
                    isDarkMode ? "text-slate-400" : "text-gray-400"
                  }`}
                >
                  Portal
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav
              className={`hidden md:flex gap-6 text-sm font-medium transition-colors duration-700 ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              }`}
            >
              <span
                className={`cursor-pointer transition-colors ${
                  isDarkMode ? "hover:text-white" : "hover:text-gray-900"
                }`}
              >
                Documentation
              </span>
              <span
                className={`cursor-pointer transition-colors ${
                  isDarkMode ? "hover:text-white" : "hover:text-gray-900"
                }`}
              >
                Support
              </span>
            </nav>
            <div
              className={`h-4 w-px hidden md:block ${
                isDarkMode ? "bg-white/10" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-full transition-colors border ${
                isDarkMode
                  ? "hover:bg-white/10 border-white/10 hover:border-white/20"
                  : "hover:bg-gray-50 border-transparent hover:border-gray-200"
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  isDarkMode
                    ? "bg-gradient-to-tr from-slate-600 to-slate-800"
                    : "bg-gradient-to-tr from-gray-700 to-gray-900"
                }`}
              >
                AG
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  isDarkMode ? "text-slate-300" : "text-gray-700"
                }`}
              >
                Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* --- Controls Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          {/* Tab Switcher */}
          <div
            className={`p-1 rounded-xl flex gap-1 w-full md:w-auto overflow-x-auto transition-colors duration-700 ${
              isDarkMode ? "bg-white/5" : "bg-gray-200/50"
            }`}
          >
            <TabButton
              active={activeTab === "registrations"}
              onClick={() => setActiveTab("registrations")}
              icon={<FilePlus size={16} />}
              label="New Applications"
              isDarkMode={isDarkMode}
            />
            <TabButton
              active={activeTab === "updates"}
              onClick={() => setActiveTab("updates")}
              icon={<FileEdit size={16} />}
              label="Update Requests"
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <form
              onSubmit={handleSearch}
              className="relative group flex-1 md:w-64"
            >
              <input
                type="number"
                value={districtInput}
                onChange={(e) => setDistrictInput(e.target.value)}
                placeholder="Filter by District ID"
                className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none shadow-sm ${
                  isDarkMode
                    ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:bg-white/10 group-hover:border-white/20"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 group-hover:border-gray-300"
                }`}
              />
              <Search
                className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                  isDarkMode
                    ? "text-slate-500 group-hover:text-slate-400"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}
              />
            </form>

            <button
              onClick={fetchData}
              className={`p-2 rounded-lg transition-all shadow-sm ${
                isDarkMode
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-400 hover:text-white"
                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600"
              }`}
              title="Refresh Data"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* --- Active Filter Indicator --- */}
        {activeDistrict && (
          <div className="mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              }`}
            >
              Showing results for:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                isDarkMode
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  : "bg-indigo-50 text-indigo-700 border-indigo-100"
              }`}
            >
              District {activeDistrict}
              <button
                onClick={() => {
                  setDistrictInput("");
                  setActiveDistrict(null);
                }}
                className={
                  isDarkMode ? "hover:text-indigo-200" : "hover:text-indigo-900"
                }
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}

        {/* --- Content Grid --- */}
        {loading && filteredData.length === 0 ? (
          <div className="py-24 text-center">
            <div
              className={`w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4 ${
                isDarkMode
                  ? "border-white/10 border-t-indigo-500"
                  : "border-gray-200 border-t-indigo-600"
              }`}
            ></div>
            <p
              className={`text-sm font-medium ${
                isDarkMode ? "text-slate-400" : "text-gray-400"
              }`}
            >
              Syncing with server...
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          <EmptyState type={activeTab} isDarkMode={isDarkMode} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredData.map((item) =>
              activeTab === "registrations" ? (
                <RegistrationCard
                  key={item._id}
                  data={item}
                  onApprove={() => handleAction(item._id, "approve")}
                  onReject={() => handleAction(item._id, "reject")}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <UpdateCard
                  key={item._id}
                  data={item}
                  onApprove={() => handleAction(item._id, "approve")}
                  onReject={() => handleAction(item._id, "reject")}
                  isDarkMode={isDarkMode}
                />
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// --- Components ---

const TabButton = ({
  active,
  onClick,
  icon,
  label,
  isDarkMode = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isDarkMode?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      active
        ? isDarkMode
          ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
          : "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
        : isDarkMode
        ? "text-slate-400 hover:text-white hover:bg-white/5"
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
    }`}
  >
    {icon}
    {label}
  </button>
);

const EmptyState = ({
  type,
  isDarkMode = false,
}: {
  type: string;
  isDarkMode?: boolean;
}) => (
  <div
    className={`rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center transition-colors duration-700 ${
      isDarkMode
        ? "border-white/10 bg-white/5"
        : "border-gray-200 bg-gray-50/50"
    }`}
  >
    <div
      className={`h-12 w-12 rounded-xl shadow-sm border flex items-center justify-center mb-4 transition-colors duration-700 ${
        isDarkMode ? "bg-white/10 border-white/10" : "bg-white border-gray-100"
      }`}
    >
      <Check className="w-6 h-6 text-emerald-500" />
    </div>
    <h3
      className={`font-semibold mb-1 ${
        isDarkMode ? "text-white" : "text-gray-900"
      }`}
    >
      All Clear
    </h3>
    <p
      className={`text-sm max-w-xs ${
        isDarkMode ? "text-slate-400" : "text-gray-500"
      }`}
    >
      There are no pending{" "}
      {type === "registrations" ? "registrations" : "updates"} at this moment.
    </p>
  </div>
);

// --- Card: Registration (Clean & Data-Rich) ---

function RegistrationCard({
  data,
  onApprove,
  onReject,
  isDarkMode = false,
}: {
  data: Voter;
  onApprove: () => void;
  onReject: () => void;
  isDarkMode?: boolean;
}) {
  return (
    <div
      className={`group rounded-2xl border shadow-sm transition-all duration-300 flex flex-col overflow-hidden ${
        isDarkMode
          ? "bg-[#0f0f11] border-white/10 hover:shadow-lg hover:border-indigo-500/30"
          : "bg-white border-gray-200 hover:shadow-lg hover:border-indigo-100"
      }`}
    >
      <div className="p-6 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border transition-colors duration-700 ${
                isDarkMode
                  ? "bg-white/10 text-slate-300 border-white/10"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
            >
              {data.FirstName?.[0] || "?"}
              {data.LastName?.[0] || ""}
            </div>
            <div>
              <h3
                className={`text-lg font-bold leading-tight ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {data.FirstName} {data.LastName}
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-gray-500"
                }`}
              >
                S/o {data.FatherName}
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border transition-colors duration-700 ${
              isDarkMode
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                : "bg-indigo-50 text-indigo-700 border-indigo-100"
            }`}
          >
            Dist {data["District ID"]}
          </span>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
          <DetailItem
            label="Voter ID"
            value={data["Voter ID"]}
            icon={<CreditCard size={14} />}
            isDarkMode={isDarkMode}
          />
          <DetailItem
            label="Aadhaar"
            value={data.Aadhaar}
            icon={<Fingerprint size={14} />}
            isDarkMode={isDarkMode}
          />
          <DetailItem
            label="Phone"
            value={data.Phone}
            icon={<Phone size={14} />}
            isDarkMode={isDarkMode}
          />
          <DetailItem
            label="DOB"
            value={data.Birthday}
            icon={<Calendar size={14} />}
            isDarkMode={isDarkMode}
          />
          <div
            className={`col-span-2 pt-2 border-t mt-2 ${
              isDarkMode ? "border-white/5" : "border-gray-50"
            }`}
          >
            <div
              className={`flex items-center gap-2 text-xs ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              }`}
            >
              <MapPin size={12} />
              <span className="truncate">{data.State}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <CardActions
        onApprove={onApprove}
        onReject={onReject}
        approveLabel="Approve"
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

// --- Card: Update Request (The "Smart" Card) ---

// Define stricter type for changes for Typescript safety
interface ChangeDetail {
  type: string;
  old?: string;
  new?: string;
  icon: React.ElementType;
}

function UpdateCard({
  data,
  onApprove,
  onReject,
  isDarkMode = false,
}: {
  data: Voter;
  onApprove: () => void;
  onReject: () => void;
  isDarkMode?: boolean;
}) {
  // Explicitly type the changes array
  const changes: ChangeDetail[] = [];

  // Handle new format from /updateFetch
  if (data.updateField && data.fullVoterData) {
    const field = data.updateField;
    const oldValue = data.fullVoterData[field as keyof Voter];
    const newValue = data.updateValue;

    // Map field names to icons and display names
    let icon = User;
    let displayName = field;

    switch (field) {
      case "Phone":
        icon = Phone;
        break;
      case "FirstName":
      case "LastName":
      case "MotherName":
      case "FatherName":
        icon = User;
        displayName = field.replace(/([A-Z])/g, " $1").trim();
        break;
      case "State":
      case "District ID":
        icon = MapPin;
        displayName = field.replace(/([A-Z])/g, " $1").trim();
        break;
      case "Birthday":
        icon = Calendar;
        displayName = "Date of Birth";
        break;
      case "Aadhaar":
      case "Voter ID":
        icon = CreditCard;
        displayName = field.replace(/([A-Z])/g, " $1").trim();
        break;
      case "Sex":
        icon = User;
        displayName = "Gender";
        break;
      default:
        icon = User;
        displayName = field.replace(/([A-Z])/g, " $1").trim();
    }

    changes.push({
      type: displayName,
      old: String(oldValue || "N/A"),
      new: String(newValue || "N/A"),
      icon: icon,
    });
  } else {
    // Handle old format (for backward compatibility with mock data)
    if (data.NewAddress)
      changes.push({
        type: "Address",
        old: data.CurrentAddress,
        new: data.NewAddress,
        icon: MapPin,
      });
    if (data.NewPhone)
      changes.push({
        type: "Phone",
        old: data.CurrentPhone,
        new: data.NewPhone,
        icon: Phone,
      });
    if (data.NewName)
      changes.push({
        type: "Name",
        old: data.CurrentName,
        new: data.NewName,
        icon: User,
      });
  }

  return (
    <div
      className={`group rounded-2xl border shadow-sm transition-all duration-300 flex flex-col overflow-hidden ${
        isDarkMode
          ? "bg-[#0f0f11] border-white/10 hover:shadow-lg hover:border-amber-500/30"
          : "bg-white border-gray-200 hover:shadow-lg hover:border-amber-100"
      }`}
    >
      {/* Top Bar */}
      <div
        className={`px-6 py-4 border-b flex justify-between items-center transition-colors duration-700 ${
          isDarkMode
            ? "border-white/10 bg-white/5"
            : "border-gray-100 bg-gray-50/30"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-slate-400" : "text-gray-500"
            }`}
          >
            {data.UpdateRequestType || "Update Request"}
          </span>
        </div>
        <span
          className={`text-xs font-mono ${
            isDarkMode ? "text-slate-500" : "text-gray-400"
          }`}
        >
          #{data["Voter ID"]}
        </span>
      </div>

      <div className="p-6 flex-1">
        <div className="mb-6">
          <h3
            className={`text-base font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {data.fullVoterData?.FirstName || data.FirstName}{" "}
            {data.fullVoterData?.LastName || data.LastName}
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? "text-slate-400" : "text-gray-500"
            }`}
          >
            District{" "}
            {data.fullVoterData?.["District ID"] || data["District ID"]} •{" "}
            {data.fullVoterData?.State || data.State}
          </p>
          <p
            className={`text-xs mt-1 ${
              isDarkMode ? "text-slate-500" : "text-gray-400"
            }`}
          >
            ID: {data.ID}
          </p>
        </div>

        {/* Dynamic Diff View */}
        <div className="space-y-5">
          {changes.map((change, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center gap-2 mb-2">
                <change.icon
                  size={14}
                  className={isDarkMode ? "text-slate-500" : "text-gray-400"}
                />
                <span
                  className={`text-xs font-semibold uppercase ${
                    isDarkMode ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  {change.type} Update
                </span>
              </div>

              <div
                className={`relative pl-4 border-l-2 mb-3 ${
                  isDarkMode ? "border-white/10" : "border-gray-200"
                }`}
              >
                <div
                  className={`text-xs line-through opacity-70 mb-1 ${
                    isDarkMode
                      ? "text-red-400 decoration-red-400/50"
                      : "text-red-500 decoration-red-300/50"
                  }`}
                >
                  {change.old || "Not available"}
                </div>
                <div
                  className={`text-sm font-medium p-2 rounded-md border ${
                    isDarkMode
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                      : "bg-emerald-50/50 border-emerald-100/50 text-emerald-950"
                  }`}
                >
                  {change.new}
                </div>
              </div>
            </div>
          ))}

          {changes.length === 0 && (
            <div
              className={`text-center text-sm italic py-4 ${
                isDarkMode ? "text-slate-500" : "text-gray-400"
              }`}
            >
              Details not provided in preview.
            </div>
          )}
        </div>
      </div>

      <CardActions
        onApprove={onApprove}
        onReject={onReject}
        approveLabel="Update"
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

// --- Shared Sub-Components ---

const DetailItem = ({
  label,
  value,
  icon,
  isDarkMode = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  isDarkMode?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <div
      className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${
        isDarkMode ? "text-slate-500" : "text-gray-400"
      }`}
    >
      {icon} {label}
    </div>
    <div
      className={`font-medium truncate ${
        isDarkMode ? "text-white" : "text-gray-900"
      }`}
      title={value}
    >
      {value}
    </div>
  </div>
);

const CardActions = ({
  onApprove,
  onReject,
  approveLabel,
  isDarkMode = false,
}: {
  onApprove: () => void;
  onReject: () => void;
  approveLabel: string;
  isDarkMode?: boolean;
}) => (
  <div
    className={`grid grid-cols-2 border-t ${
      isDarkMode ? "border-white/10" : "border-gray-100"
    }`}
  >
    <button
      onClick={onReject}
      className={`flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
        isDarkMode
          ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          : "text-gray-600 hover:text-red-600 hover:bg-red-50"
      }`}
    >
      <X size={16} />
      Reject
    </button>
    <button
      onClick={onApprove}
      className={`flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-l ${
        isDarkMode
          ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-white/10"
          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-gray-100"
      }`}
    >
      <Check size={16} />
      {approveLabel}
    </button>
  </div>
);
