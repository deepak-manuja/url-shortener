import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Copy, ExternalLink, BarChart2, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { shortenUrl, getAllUrls } from "./api";

export default function App() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const BASE_URL = "https://www.spliter.xyz";
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "https://url-shortener-backend-9drd.onrender.com";

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await getAllUrls();
      setHistory(res.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const res = await shortenUrl(url.trim(), customAlias.trim() || undefined);
      setResult(res.data);
      await fetchHistory();
      toast.success("Link shortened!");
    } catch (err) {
      const msg = err.response?.data?.error || "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] font-sans">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "14px" } }} />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold tracking-tight text-gray-900">✂ Snip</span>
          <a href="https://github.com/deepak-manuja" target="_blank" rel="noreferrer"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors">GitHub</a>
        </div>
        <a href="#history"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors">My Links</a>
      </nav>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-12">
        <h1 className="text-4xl font-semibold text-gray-900 text-center mb-2 tracking-tight">
          Snip your links shorter.
        </h1>
        <p className="text-center text-gray-400 text-sm mb-10">
          Fast, free URL shortener with click analytics.
        </p>

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a long URL here..."
              className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="p-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Advanced Options */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 mt-3 ml-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Advanced options
          </button>

          {showAdvanced && (
            <div className="mt-3 bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Custom alias</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-400">{BASE_URL}/</span>
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value.replace(/\s/g, ""))}
                    placeholder="my-link"
                    className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-2">Your short link</p>
            <div className="flex items-center justify-between gap-3">
              <a
                href={`${BASE_URL}/${result.shortCode}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-gray-900 hover:underline truncate"
              >
                {BASE_URL}/{result.shortCode}
              </a>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copy(`${BASE_URL}/${result.shortCode}`)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Copy"
                >
                  <Copy size={14} className="text-gray-500" />
                </button>
                <a
                  href={`${BASE_URL}/${result.shortCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Open"
                >
                  <ExternalLink size={14} className="text-gray-500" />
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">→ {result.shortCode && url}</p>
          </div>
        )}
      </div>

      {/* History Table */}
      {history.length > 0 && (
        <div id="history" className="max-w-2xl mx-auto px-4 pb-20">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Recent links</p>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {history.map((item, i) => (
              <div
                key={item._id}
                className={`flex items-center gap-4 px-5 py-3.5 ${i !== history.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={`${BASE_URL}/${item.shortCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-gray-900 hover:underline"
                  >
                    {BASE_URL}/{item.shortCode}
                  </a>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{item.originalUrl}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <BarChart2 size={12} />
                    {item.clicks}
                  </div>
                  <button
                    onClick={() => copy(`${BASE_URL}/${item.shortCode}`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Copy size={13} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
