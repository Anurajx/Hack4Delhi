import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { apiUrl } from "../config/api";

interface DetectionResult {
  source: string;
  ID: string;
  score: number;
}

export default function FuzzyDetection() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        apiUrl(`/fuzzy-detection?query=${encodeURIComponent(query)}`)
      );
      const data = await response.json();
      setResults(data?.suspicious || []);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen pt-24 pb-12 px-6 ${
        isDarkMode ? "bg-[#0a0a0c] text-slate-200" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-4">Fuzzy Duplicate Detection</h1>
        <form onSubmit={onSearch} className="flex gap-3 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suspicious records by name/UVID/credential"
            className="flex-1 rounded-lg border px-4 py-2 text-sm text-slate-900"
            required
          />
          <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
            <Search className="w-4 h-4 inline mr-1" />
            Detect
          </button>
        </form>
        {loading ? (
          <p className="text-sm">Running fuzzy detection...</p>
        ) : (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div key={`${result.ID}-${idx}`} className="rounded-lg border p-3 text-sm">
                {result.source} | UVID: {result.ID} | Similarity: {result.score}
              </div>
            ))}
            {!results.length && <p className="text-sm">No suspicious matches found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
