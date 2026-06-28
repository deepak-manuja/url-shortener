import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import { ArrowLeft, MousePointerClick, Globe, Monitor, Chrome } from "lucide-react";
import { getAnalytics } from "../api";

const DEVICE_COLORS = {
  desktop: "#111827",
  mobile: "#6366f1",
  tablet: "#f59e0b",
};

const BAR_COLOR = "#111827";

// Skeleton block
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

function StatCard({ icon, label, value, loading }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-gray-100 rounded-xl text-gray-600">{icon}</div>
      <div>
        {loading ? (
          <>
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics(code)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [code]);

  // Pie chart data from deviceBreakdown
  const pieData = data
    ? Object.entries(data.deviceBreakdown)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-10 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
        <span className="text-gray-300">|</span>
        <p className="text-sm font-medium text-gray-900">
          Analytics — <span className="text-gray-500 font-normal">{code}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<MousePointerClick size={18} />}
          label="Total clicks"
          value={data?.totalClicks ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Globe size={18} />}
          label="Countries reached"
          value={data?.topCountries?.length ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Monitor size={18} />}
          label="Top device"
          value={
            data
              ? Object.entries(data.deviceBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
              : "—"
          }
          loading={loading}
        />
      </div>

      {/* Clicks Over Time */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm mb-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Clicks — last 30 days</p>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.clicksOverTime || []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(d) => d.slice(5)} // MM-DD
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                labelStyle={{ color: "#374151" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#111827"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Device + Countries row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">

        {/* Device Pie */}
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-4">Device breakdown</p>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : pieData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={DEVICE_COLORS[entry.name] || "#d1d5db"} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(v) => <span className="text-gray-600 capitalize">{v}</span>}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(v, n) => [v, <span className="capitalize">{n}</span>]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Countries Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-4">Top countries</p>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : !data?.topCountries?.length ? (
            <p className="text-xs text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={data.topCountries}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                layout="vertical"
              >
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: "#6b7280" }} width={80} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Bar dataKey="count" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Browsers */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm mb-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Top browsers</p>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : !data?.topBrowsers?.length ? (
          <p className="text-xs text-gray-400 text-center py-6">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.topBrowsers} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="browser" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Clicks Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Recent clicks</p>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : !data?.recentClicks?.length ? (
          <p className="text-xs text-gray-400 text-center py-10">No clicks recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Country</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Device</th>
                  <th className="px-5 py-3 font-medium">Browser</th>
                </tr>
              </thead>
              <tbody>
                {data.recentClicks.map((click, i) => (
                  <tr
                    key={i}
                    className={`${i !== data.recentClicks.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{click.country}</td>
                    <td className="px-5 py-3 text-gray-500">{click.city}</td>
                    <td className="px-5 py-3">
                      <span className={`capitalize px-2 py-0.5 rounded-full font-medium
                        ${click.device === "mobile" ? "bg-indigo-50 text-indigo-600" :
                          click.device === "tablet" ? "bg-amber-50 text-amber-600" :
                          "bg-gray-100 text-gray-600"}`}>
                        {click.device}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{click.browser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
