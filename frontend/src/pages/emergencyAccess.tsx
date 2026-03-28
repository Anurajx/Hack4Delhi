import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../config/api";
import { useTheme } from "../contexts/ThemeContext";
import {
  AlertTriangle,
  Phone,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type EmergencyContact = {
  name?: string;
  relationship?: string;
  phone1?: string;
  phone2?: string;
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
  emergencyContacts?: EmergencyContact[];
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
  const [notifySmsSent, setNotifySmsSent] = useState<boolean | null>(null);
  const [notifySmsRecipients, setNotifySmsRecipients] = useState<string[]>(
    []
  );

  // Ping / Continuous check-ins
  const [continuousPingsEnabled, setContinuousPingsEnabled] = useState(false);
  const [pingIntervalMinutes, setPingIntervalMinutes] = useState(5);
  const [pingLog, setPingLog] = useState<
    Array<{ timestamp: string; text: string }>
  >([]);
  const [pingMessage, setPingMessage] = useState("");
  const [pingSending, setPingSending] = useState(false);
  const [manualSendAsSMS, setManualSendAsSMS] = useState(true);

  const allergies = useMemo(() => normalizeAllergies(profile?.allergies), [profile?.allergies]);
  const emergencyContacts = useMemo(() => {
    const raw = profile?.emergencyContacts;
    const primary = raw?.[0] || {};
    const secondary = raw?.[1] || {};
    return [
      {
        name: primary.name || "",
        relationship: primary.relationship || "",
        phone1: primary.phone1 || "",
        phone2: primary.phone2 || "",
      },
      {
        name: secondary.name || "",
        relationship: secondary.relationship || "",
        phone1: secondary.phone1 || "",
        phone2: secondary.phone2 || "",
      },
    ];
  }, [profile?.emergencyContacts]);

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

    setPingLog([]);

    const intervalId = window.setInterval(async () => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      try {
        const res = await fetch(
          apiUrl(`/emergency/ping/${encodeURIComponent(token)}`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "Accessor still present",
              sendSMS: true,
            }),
          }
        );
        if (!res.ok) throw new Error("Ping failed");

        const data = await res.json();
        const recipientsCount = Array.isArray(data?.smsRecipients)
          ? data.smsRecipients.length
          : 0;

        const smsPart =
          data?.smsSent === true
            ? `SMS dispatched to ${recipientsCount} contacts`
            : "SMS dispatch failed";

        setPingLog((prev) => [
          ...prev,
          {
            timestamp,
            text: `Ping sent — ${smsPart}`,
          },
        ]);
      } catch {
        setPingLog((prev) => [
          ...prev,
          {
            timestamp,
            text: "Ping sent — SMS dispatch failed",
          },
        ]);
      }
    }, pingIntervalMinutes * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [continuousPingsEnabled, pingIntervalMinutes, token]);

  const submitNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (hasSubmitted) return;

    if (!accessorName.trim() || !reasonForAccess.trim()) {
      return;
    }

    setHasSubmitted(true);
    setSubmitSuccess(false);
    setNotifySmsSent(null);
    setNotifySmsRecipients([]);

    try {
      const res = await fetch(
        apiUrl(`/emergency/notify/${encodeURIComponent(token)}`),
        {
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
        }
      );

      if (!res.ok) throw new Error("Notification failed");
      const data = await res.json();
      setSubmitSuccess(true);
      setNotifySmsSent(data?.smsSent === true);
      setNotifySmsRecipients(
        Array.isArray(data?.smsRecipients) ? data.smsRecipients : []
      );
    } catch {
      // Keep the form disabled (we already locked submit once per page load),
      // but show a visible error.
      setSubmitSuccess(false);
      setLoadError("Failed to notify identity holder. Please try again if possible.");
    }
  };

  const sendPing = async (message: string, sendAsSMS: boolean) => {
    if (!token) return;
    const trimmed = message.trim();
    if (!trimmed) return;

    setPingSending(true);
    try {
      const timestamp = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const res = await fetch(
        apiUrl(`/emergency/ping/${encodeURIComponent(token)}`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, sendSMS: sendAsSMS }),
        }
      );
      if (!res.ok) throw new Error("Ping failed");

      const data = await res.json();
      const recipientsCount = Array.isArray(data?.smsRecipients)
        ? data.smsRecipients.length
        : 0;
      const smsPart =
        sendAsSMS === true
          ? data?.smsSent === true
            ? `SMS dispatched to ${recipientsCount} contacts`
            : "SMS dispatch failed"
          : "SMS not sent";

      setPingLog((prev) => [
        ...prev,
        {
          timestamp,
          text: `Ping sent — ${smsPart}`,
        },
      ]);

      setPingMessage("");
    } catch {
      // Non-blocking; still keep emergency page usable.
    } finally {
      setPingSending(false);
    }
  };

  const maskPhone = (phone: string) => {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length <= 4) return digits;
    return `XXXXXX${digits.slice(-4)}`;
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

        </section>

        {/* Emergency Contacts */}
        <section
          className={`rounded-xl border p-5 shadow-sm ${
            isDarkMode ? "bg-[#0f0f11] border-white/10" : "bg-white border-slate-200"
          }`}
        >
          <div
            className={`flex items-center gap-2 mb-4 ${
              isDarkMode ? "text-slate-200" : "text-slate-900"
            }`}
          >
            <Phone size={18} />
            <h2 className="text-lg font-extrabold">Emergency Contacts</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {emergencyContacts.every(c => !c.name && !c.phone1) ? (
              <div className={`p-8 text-center rounded-xl border border-dashed ${isDarkMode ? "border-white/10 text-slate-500" : "border-slate-300 text-slate-500"}`}>
                <Phone size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No emergency contacts added yet</p>
              </div>
            ) : (
              emergencyContacts.map((c, idx) => {
                // If both name and phone are missing for a slot (especially secondary), skip it unless it's the only one
                if (!c.name && !c.phone1 && idx > 0) return null;
                
                const isPrimary = idx === 0;
                const badgeClass = isPrimary
                  ? "bg-blue-600 text-white"
                  : "bg-slate-500 text-white";
                const borderClass = isPrimary
                  ? "border-l-4 border-blue-500"
                  : "border-l-4 border-slate-500";

                const phone1 = c.phone1 || "";
                const phone2 = c.phone2 || "";

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-5 ${borderClass} ${
                      isDarkMode ? "border-white/10" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-extrabold">
                          {c.name || "—"}
                        </div>
                        <div className="text-sm text-slate-700">
                          Relationship: {c.relationship || "—"}
                        </div>
                      </div>

                      <span
                        className={`text-xs font-extrabold rounded-full px-3 py-1 ${badgeClass}`}
                      >
                        {isPrimary ? "Primary Contact" : "Secondary Contact"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Mobile Number 1
                        </div>
                        <a
                          href={`tel:${phone1}`}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white ${
                            phone1 ? "" : "pointer-events-none opacity-60"
                          }`}
                        >
                          <PhoneCall size={16} />
                          Call
                        </a>
                        <div className="text-sm text-slate-700">
                          {phone1 || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Alternate number
                        </div>
                        <a
                          href={`tel:${phone2}`}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white ${
                            phone2 ? "" : "pointer-events-none opacity-60"
                          }`}
                        >
                          <PhoneCall size={16} />
                          Call
                        </a>
                        <div className={`text-sm ${phone2 ? "text-slate-700" : "text-slate-500"}`}>
                          {phone2 || "Not provided"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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

              {submitSuccess && notifySmsSent !== null && (
                <div className="text-xs font-semibold text-slate-700">
                  {notifySmsSent ? (
                    <>
                      Emergency contacts SMS dispatched for reason “{reasonForAccess}”
                      (to {notifySmsRecipients.length} attempted recipients:{" "}
                      {notifySmsRecipients.map(maskPhone).filter(Boolean).join(", ")}).
                    </>
                  ) : (
                    <>SMS to emergency contacts failed or was not configured.</>
                  )}
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

            {continuousPingsEnabled && (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Ping interval
                  </label>
                  <select
                    value={pingIntervalMinutes}
                    onChange={(e) => setPingIntervalMinutes(Number(e.target.value))}
                    className={`border border-slate-300 rounded-md px-3 py-2 text-sm ${
                      isDarkMode ? "bg-white/5 text-slate-200" : "bg-white text-slate-900"
                    }`}
                  >
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
              </div>
            )}

            {continuousPingsEnabled && (
              <div
                className={`rounded-md border p-3 max-h-[200px] overflow-auto ${
                  isDarkMode
                    ? "bg-[#0a0a0c] text-slate-200 border-white/10"
                    : "bg-slate-900 text-slate-100 border-slate-700"
                }`}
              >
                {pingLog.length === 0 ? (
                  <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-300"}`}>
                    No pings sent yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pingLog.map((entry, idx) => (
                      <div key={`${entry.timestamp}-${idx}`} className="text-xs font-semibold">
                        [{entry.timestamp}] {entry.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <input
                  type="checkbox"
                  checked={manualSendAsSMS}
                  onChange={(e) => setManualSendAsSMS(e.target.checked)}
                />
                Also send as SMS to emergency contacts
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
                onClick={() => sendPing(pingMessage, manualSendAsSMS)}
                className="rounded-md bg-[#000080] text-white px-5 py-2.5 text-sm font-extrabold disabled:opacity-60"
              >
                {pingSending ? "Sending…" : "Send Update to Identity Holder"}
              </button>
              </div>
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

