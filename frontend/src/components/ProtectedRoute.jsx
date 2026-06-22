import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  return user ? children : <Navigate to="/login" replace />;
}