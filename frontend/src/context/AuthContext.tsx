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

  const fetchStudent = async () => {
    try {
      const res = await api.get('/student/me');
      setStudent(res.data.student);
    } catch (err) {
      setStudent(null);
      setToken(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
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
    setToken(res.data.token);
    setStudent(res.data.student);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setStudent(null);
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