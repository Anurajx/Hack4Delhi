import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { apiUrl } from "../config/api";

interface AuditEvent {
  ID: string;
  TYPE: string;
  CREDENTIAL_TYPE: string;
  DETAILS: string;
  timestamp: string;
  actor: string;
  hash: string;
}

export default function AuditTrail() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const initialId = new URLSearchParams(location.search).get("id") || "";
  const [uvid, setUvid] = useState(initialId);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditTrail = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(apiUrl(`/get-audit-trail/${id}`));
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) fetchAuditTrail(initialId);
  }, [initialId]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchAuditTrail(uvid);
  };

  return (
    <div
      className={`min-h-screen pt-24 pb-12 px-6 ${
        isDarkMode
          ? "bg-[#0a0a0c] text-slate-200"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-4">View Audit Trail</h1>
        <form onSubmit={onSubmit} className="flex gap-3 mb-6">
          <input
            value={uvid}
            onChange={(e) => setUvid(e.target.value)}
            placeholder="Enter your UVID"
            className="flex-1 rounded-lg border px-4 py-2 text-sm text-slate-900"
            required
          />
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
            <Search className="w-4 h-4 inline mr-1" />
            Search
          </button>
        </form>
        {loading ? (
          <p className="text-sm">Loading audit trail...</p>
        ) : (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div
                key={`${event.hash}-${idx}`}
                className="rounded-lg border p-4"
              >
                <div className="text-sm font-semibold">
                  {event.TYPE} - {event.CREDENTIAL_TYPE}
                </div>
                <div className="text-xs opacity-80">{event.DETAILS}</div>
                <div className="text-xs opacity-70 mt-1">
                  {event.timestamp} | Actor: {event.actor}
                </div>
              </div>
            ))}
            {!events.length && (
              <p className="text-sm">No events found for this UVID.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
