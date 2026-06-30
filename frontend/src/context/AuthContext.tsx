import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  program_id: string;
  curriculum_id: string;
  year_level: number;
  preferred_load: string;
  academic_standing: string;
  programs?: any;
  curriculums?: any;
}

interface AuthContextType {
  student: Student | null;
  token: string | null;
  loading: boolean;
  login: (studentNumber: string, password: string) => Promise<void>;
  logout: () => void;
  refreshStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const tryRefreshToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      return false;
    }
  };

  const fetchStudent = async () => {
    try {
      const res = await api.get('/student/me');
      setStudent(res.data.student);
    } catch (err) {
      console.log('Student fetch failed, but keeping the current session for now:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutCleanup = () => {
    setStudent(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  };

  useEffect(() => {
    if (token) {
      fetchStudent();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (studentNumber: string, password: string) => {
    const res = await api.post('/auth/login', {
      student_number: studentNumber,
      password,
    });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    setToken(res.data.token);
    setStudent(res.data.student);
  };

  const logout = () => {
    handleLogoutCleanup();
  };

  const refreshStudent = async () => {
    await fetchStudent();
  };

  return (
    <AuthContext.Provider value={{ student, token, loading, login, logout, refreshStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}