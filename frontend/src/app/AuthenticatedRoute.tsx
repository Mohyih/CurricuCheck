import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { student, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (student) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}