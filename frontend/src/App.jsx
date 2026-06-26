import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Copy, ExternalLink, BarChart2, ChevronDown, ChevronUp, ArrowRight, LogOut, User } from "lucide-react";
import { shortenUrl, getAllUrls } from "./api";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

const BASE_URL = import.meta.env.DEV 
  ? "http://localhost:5174"  // Development
  : "https://www.spliter.xyz";  // Production

function Home() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchHistory();
    else setHistory([]);
  }, [user]);

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
      const res = await shortenUrl(
      url.trim(),
      customAlias.trim() || undefined,
      expiryDays || null
      );
      setResult(res.data);
      if (user) await fetchHistory();
      toast.success("Link shortened!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-20 pb-12">
      <h1 className="text-4xl font-semibold text-gray-900 text-center mb-2 tracking-tight">
        Snip your links shorter.
      </h1>
      <p className="text-center text-gray-400 text-sm mb-10">
        Fast, free URL shortener with click analytics.
      </p>

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
    
    <label className="text-xs text-gray-400 mb-1 block">
      Custom alias
    </label>

    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
      <span className="text-xs text-gray-400">
        {BASE_URL}/
      </span>

      <input
        type="text"
        value={customAlias}
        onChange={(e) =>
          setCustomAlias(e.target.value.replace(/\s/g, ""))
        }
        placeholder="my-link"
        className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-300"
      />
    </div>

    <div className="mt-3">
      <label className="text-xs text-gray-400 mb-1 block">
        Expiry (Days)
      </label>

      <input
        type="number"
        min="1"
        value={expiryDays}
        onChange={(e) => setExpiryDays(e.target.value)}
        placeholder="e.g. 7"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
      />
    </div>

  </div>
)}
        
      </form>

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
            <div className="mt-6 flex flex-col items-center">

            <img
            src={result.qrCode}
            alt="QR Code"
            className="w-40 h-40 rounded-lg border"
             />

            <a
            href={result.qrCode}
            download={`${result.shortCode}.png`}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
            Download QR
            </a>

            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copy(`${BASE_URL}/${result.shortCode}`)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Copy size={14} className="text-gray-500" />
              </button>
              <a
                href={`${BASE_URL}/${result.shortCode}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 truncate">→ {url}</p>
        </div>
      )}

      {user && history.length > 0 && (
        <div id="history" className="mt-12">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">My Links</p>
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
                  {item.expiresAt && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${new Date() > new Date(item.expiresAt) ? "bg-red-50 text-red-400" : "bg-amber-50 text-amber-500"}`}>
                      {new Date() > new Date(item.expiresAt)
                        ? "Expired"
                        : `Exp: ${new Date(item.expiresAt).toLocaleDateString()}`}
                    </span>
                  )}
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

      {!user && (
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400">
            <Link to="/login" className="text-gray-900 font-medium hover:underline">Log in</Link>
            {" "}to save and manage your links.
          </p>
        </div>
      )}
    </div>
  );
}

function LinkExpired() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      {/* Doodle SVG */}
      <svg
        width="180"
        height="160"
        viewBox="0 0 180 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-8 opacity-80"
      >
        {/* Scissors body */}
        <circle cx="60" cy="60" r="14" stroke="#d1d5db" strokeWidth="3" fill="none" />
        <circle cx="100" cy="60" r="14" stroke="#d1d5db" strokeWidth="3" fill="none" />
        <circle cx="60" cy="60" r="5" fill="#e5e7eb" />
        <circle cx="100" cy="60" r="5" fill="#e5e7eb" />
        {/* Scissors blades */}
        <line x1="70" y1="53" x2="130" y2="20" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="67" x2="130" y2="100" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
        {/* Cut line (dashed) */}
        <line x1="130" y1="60" x2="175" y2="60" stroke="#d1d5db" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />
        {/* Small cut pieces falling */}
        <rect x="138" y="74" width="16" height="6" rx="3" fill="#e5e7eb" transform="rotate(15 138 74)" />
        <rect x="152" y="85" width="10" height="5" rx="2.5" fill="#f3f4f6" transform="rotate(-10 152 85)" />
        {/* Clock face */}
        <circle cx="90" cy="125" r="22" stroke="#d1d5db" strokeWidth="3" fill="white" />
        <circle cx="90" cy="125" r="3" fill="#9ca3af" />
        {/* Clock hands */}
        <line x1="90" y1="125" x2="90" y2="108" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="90" y1="125" x2="104" y2="132" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        {/* Clock ticks */}
        <line x1="90" y1="105" x2="90" y2="108" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <line x1="90" y1="142" x2="90" y2="145" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <line x1="68" y1="125" x2="71" y2="125" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <line x1="109" y1="125" x2="112" y2="125" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        {/* Sad X on clock */}
        <line x1="83" y1="118" x2="97" y2="132" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
        <line x1="97" y1="118" x2="83" y2="132" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">This link has expired</h1>
      <p className="text-sm text-gray-400 mb-8 max-w-xs">
        Looks like this snip had a time limit and it's already past its expiry date.
      </p>
      <Link
        to="/"
        className="text-sm bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
      >
        Create a new link
      </Link>
    </div>
  );
}

function Redirect() {
  const { code } = useParams();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!code) return;

    const backendUrl = import.meta.env.DEV
      ? "http://localhost:5000"
      : "https://url-shortener-backend-9drd.onrender.com";

    // Check stats first to detect expiry before navigating away
    fetch(`${backendUrl}/api/stats/${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
          setExpired(true);
        } else {
          window.location.replace(`${backendUrl}/${code}`);
        }
      })
      .catch(() => {
        // If stats fetch fails, try the redirect anyway
        window.location.replace(`${backendUrl}/${code}`);
      });
  }, [code]);

  if (expired) return <LinkExpired />;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
      <p className="text-sm font-medium">Redirecting you to your destination...</p>
    </div>
  );
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] font-sans">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "14px" } }} />

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold tracking-tight text-gray-900">✂ Snip</Link>
          <a
            href="https://github.com/deepak-manuja"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            GitHub
          </a>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <User size={14} />
                <span>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                Log in
              </Link>
              <Link
                to="/signup"
                className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/:code" element={<Redirect />} />
      </Routes>
    </div>
  );
}