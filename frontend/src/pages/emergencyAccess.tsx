import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../config/api";
import { useTheme } from "../contexts/ThemeContext";
import {
  AlertTriangle,
  Phone,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type EmergencyContact = {
  name?: string;
  phone?: string;
};

type EmergencyProfile = {
  FirstName?: string;
  LastName?: string;
  Phone?: string;
  State?: string;
  Birthday?: string;
  Sex?: string;

  bloodGroup?: string;
  allergies?: string[] | string;
  emergencyContact?: EmergencyContact;
  organDonor?: boolean;
  medicalConditions?: string;
  insuranceId?: string;
};

const normalizeAllergies = (value: EmergencyProfile["allergies"]): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const EmergencyAccess: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);

  // Accessor details form (audit)
  const [accessorName, setAccessorName] = useState("");
  const [accessorRole, setAccessorRole] = useState("Doctor");
  const [accessorPhone, setAccessorPhone] = useState("");
  const [reasonForAccess, setReasonForAccess] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Ping / Continuous check-ins
  const [continuousPingsEnabled, setContinuousPingsEnabled] = useState(false);
  const [pingMessage, setPingMessage] = useState("");
  const [pingSending, setPingSending] = useState(false);

  const allergies = useMemo(() => normalizeAllergies(profile?.allergies), [profile?.allergies]);
  const emergencyContact = profile?.emergencyContact || {};

  useEffect(() => {
    let isCancelled = false;

    const fetchProfile = async () => {
      if (!token) {
        setLoadError("Missing emergency token.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");
      setProfile(null);

      try {
        const res = await fetch(apiUrl(`/emergency/${encodeURIComponent(token)}`));
        if (!res.ok) throw new Error("Token expired or revoked");
        const data = (await res.json()) as EmergencyProfile;
        if (!isCancelled) setProfile(data);
      } catch (err: any) {
        if (!isCancelled) setLoadError(err?.message || "Emergency link expired");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (!continuousPingsEnabled) return;

    const intervalId = window.setInterval(async () => {
      const timestamp = new Date().toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const message = `Accessor still present at ${timestamp}`;

      try {
        await fetch(apiUrl(`/emergency/ping/${encodeURIComponent(token)}`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
      } catch {
        // In emergencies we don't want to break the page on ping failure.
      }
    }, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [continuousPingsEnabled, token]);

  const submitNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (hasSubmitted) return;

    if (!accessorName.trim() || !reasonForAccess.trim()) {
      return;
    }

    setHasSubmitted(true);

    try {
      const res = await fetch(apiUrl(`/emergency/notify/${encodeURIComponent(token)}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reasonForAccess,
          accessorName,
          accessorRole,
          accessorPhone,
          // org name intentionally not sent: backend spec only requires reason + accessor identity
          organizationName,
        }),
      });

      if (!res.ok) throw new Error("Notification failed");
      setSubmitSuccess(true);
    } catch {
      // Keep the form disabled (we already locked submit once per page load),
      // but show a visible error.
      setSubmitSuccess(false);
      setLoadError("Failed to notify identity holder. Please try again if possible.");
    }
  };

  const sendPing = async (message: string) => {
    if (!token) return;
    const trimmed = message.trim();
    if (!trimmed) return;

    setPingSending(true);
    try {
      const res = await fetch(apiUrl(`/emergency/ping/${encodeURIComponent(token)}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) throw new Error("Ping failed");
      setPingMessage("");
    } catch {
      // Non-blocking; still keep emergency page usable.
    } finally {
      setPingSending(false);
    }
  };

  const renderAllergies = () => {
    if (!allergies.length) return <span className="text-slate-500">None reported</span>;

    return (
      <div className="flex flex-wrap gap-2">
        {allergies.map((a, idx) => (
          <span
            key={`${a}-${idx}`}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              isDarkMode
                ? "bg-red-500/20 text-red-300 border-red-500/30"
                : "bg-red-100 text-red-800 border-red-300"
            }`}
          >
            {a}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-[#000080] animate-spin" />
          <p className="mt-4 text-sm text-slate-500">Loading emergency access…</p>
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full border border-red-200 rounded-lg p-6 shadow-sm text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={28} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-red-700">
              This emergency link has expired or been revoked
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Please contact the citizen directly to confirm identity and medical details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${profile.FirstName || ""} ${profile.LastName || ""}`.trim();
  const sexLabel = profile.Sex ? (profile.Sex === "M" ? "Male" : profile.Sex === "F" ? "Female" : profile.Sex) : "—";
  const bloodGroup = profile.bloodGroup || "—";
  const organDonor = profile.organDonor === true;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="sticky top-0 z-50 bg-red-600 text-white px-4 py-3 border-b border-red-700">
        <div className="max-w-4xl mx-auto flex items-start gap-3">
          <ShieldAlert className="mt-0.5" size={18} />
          <div className="text-sm font-bold leading-5">
            ⚠ EMERGENCY ACCESS — This session is being logged and the identity holder will be notified
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Identity Card */}
        <section className="border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {fullName || "—"}
              </h1>
              <div className="mt-2 text-sm text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <span className="font-semibold">Sex: </span>
                  {sexLabel}
                </span>
                <span>
                  <span className="font-semibold">DOB: </span>
                  {profile.Birthday || "—"}
                </span>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center bg-red-600 text-white rounded-full px-6 py-2 text-sm font-extrabold">
                  Blood Group: {bloodGroup}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Allergies
              </div>
              <div className="mt-2">{renderAllergies()}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Organ Donation
              </div>
              <div className="mt-2">
                {organDonor ? (
                  <span className="inline-flex items-center bg-green-600 text-white rounded-full px-6 py-2 text-sm font-extrabold">
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-slate-200 text-slate-800 rounded-full px-6 py-2 text-sm font-extrabold">
                    No
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Medical Conditions
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {profile.medicalConditions || "—"}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Insurance ID
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {profile.insuranceId || "—"}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Emergency Contact
            </div>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">
                  {emergencyContact.name || "—"}
                </div>
                <div className="text-sm text-slate-700">
                  {emergencyContact.phone || profile.Phone || "—"}
                </div>
              </div>
              <a
                href={`tel:${emergencyContact.phone || profile.Phone || ""}`}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#000080] text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                <Phone size={16} />
                Call
              </a>
            </div>
          </div>
        </section>

        {/* Accessor Details Form */}
        <section className="border border-slate-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-extrabold">Please identify yourself — required for audit</h2>
          <form onSubmit={submitNotify} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Your Name <span className="text-red-600">*</span>
                </label>
                <input
                  value={accessorName}
                  onChange={(e) => setAccessorName(e.target.value)}
                  type="text"
                  required
                  disabled={hasSubmitted}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Your Role
                </label>
                <select
                  value={accessorRole}
                  onChange={(e) => setAccessorRole(e.target.value)}
                  disabled={hasSubmitted}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm disabled:bg-slate-50"
                >
                  <option>Doctor</option>
                  <option>Paramedic</option>
                  <option>Police Officer</option>
                  <option>Disaster Relief</option>
                  <option>Hospital Staff</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Your Phone
                </label>
                <input
                  value={accessorPhone}
                  onChange={(e) => setAccessorPhone(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  disabled={hasSubmitted}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Hospital or Organization Name
                </label>
                <input
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  type="text"
                  disabled={hasSubmitted}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Reason for Access <span className="text-red-600">*</span>
              </label>
              <textarea
                value={reasonForAccess}
                onChange={(e) => setReasonForAccess(e.target.value)}
                required
                disabled={hasSubmitted}
                rows={3}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={hasSubmitted}
                className="rounded-md bg-[#000080] text-white px-5 py-2.5 text-sm font-extrabold disabled:opacity-60"
              >
                Submit & Notify Identity Holder
              </button>

              {submitSuccess && (
                <div className="inline-flex items-center gap-2 text-sm font-bold text-green-700">
                  <CheckCircle2 size={18} />
                  Identity holder has been notified. This access is now permanently logged.
                </div>
              )}
            </div>
          </form>
        </section>

        {/* Ping / Continuous Need Panel */}
        <section className="border border-slate-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-extrabold">Ongoing Assistance</h2>

          <div className="mt-4 flex flex-col gap-4">
            <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3">
              <span className="text-sm font-bold text-slate-900">
                Enable Continuous Check-in Pings
              </span>
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={continuousPingsEnabled}
                  onChange={(e) => setContinuousPingsEnabled(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`w-14 h-8 rounded-full transition-colors ${
                    continuousPingsEnabled ? "bg-green-600" : "bg-slate-200"
                  }`}
                />
                <span
                  className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    continuousPingsEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Message
                </label>
                <input
                  value={pingMessage}
                  onChange={(e) => setPingMessage(e.target.value)}
                  type="text"
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={pingSending || !pingMessage.trim()}
                onClick={() => sendPing(pingMessage)}
                className="rounded-md bg-[#000080] text-white px-5 py-2.5 text-sm font-extrabold disabled:opacity-60"
              >
                {pingSending ? "Sending…" : "Send Update to Identity Holder"}
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Use this to send real-time updates to the identity holder's emergency contact
            </p>

            {loadError && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <AlertCircle className="text-red-600 mt-0.5" size={16} />
                <div className="text-sm text-red-700">{loadError}</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmergencyAccess;

