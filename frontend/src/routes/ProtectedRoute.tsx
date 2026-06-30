import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  const hasStoredSession = Boolean(
    localStorage.getItem('token') ||
    localStorage.getItem('refresh_token') ||
    localStorage.getItem('student')
  );

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!token && !hasStoredSession) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}