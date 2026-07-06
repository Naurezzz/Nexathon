import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, getUserRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole) {
    const userRole = getUserRole();
    if (userRole !== requiredRole) {
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center">
          <div className="glass-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-white/60 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
}

export default ProtectedRoute;
