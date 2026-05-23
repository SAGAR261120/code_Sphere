import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user?.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin', 'moderator']}>
      {children}
    </ProtectedRoute>
  );
}
