import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Simple wrapper that checks authentication before rendering children.
// If user is not logged in, redirects to login page preserving intended destination.
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Not logged in – send to login preserving where they wanted to go.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated; render the protected content.
  return children;
}
