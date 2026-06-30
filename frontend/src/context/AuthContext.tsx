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

const persistAuthSession = (nextToken: string | null, nextRefreshToken: string | null, nextStudent: Student | null) => {
  if (nextToken) {
    localStorage.setItem('token', nextToken);
  } else {
    localStorage.removeItem('token');
  }

  if (nextRefreshToken) {
    localStorage.setItem('refresh_token', nextRefreshToken);
  } else {
    localStorage.removeItem('refresh_token');
  }

  if (nextStudent) {
    localStorage.setItem('student', JSON.stringify(nextStudent));
  } else {
    localStorage.removeItem('student');
  }
};

const readStoredStudent = (): Student | null => {
  try {
    const storedStudent = localStorage.getItem('student');
    return storedStudent ? JSON.parse(storedStudent) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(() => readStoredStudent());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const tryRefreshToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
      persistAuthSession(res.data.token, res.data.refresh_token, student);
      setToken(res.data.token);
      return true;
    } catch (err) {
      return false;
    }
  };

  const fetchStudent = async () => {
    try {
      const res = await api.get('/student/me');
      const nextStudent = res.data.student;
      setStudent(nextStudent);
      persistAuthSession(localStorage.getItem('token'), localStorage.getItem('refresh_token'), nextStudent);
    } catch (err) {
      console.log('First fetch failed, trying refresh...');
      const refreshed = await tryRefreshToken();
      console.log('Refresh result:', refreshed);
      if (refreshed) {
        try {
          const res = await api.get('/student/me');
          const nextStudent = res.data.student;
          setStudent(nextStudent);
          persistAuthSession(localStorage.getItem('token'), localStorage.getItem('refresh_token'), nextStudent);
          console.log('Second fetch succeeded');
        } catch (err2) {
          console.log('Second fetch also failed, keeping session for now:', err2);
        }
      } else {
        console.log('Refresh failed, keeping existing session for now');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutCleanup = () => {
    setStudent(null);
    setToken(null);
    persistAuthSession(null, null, null);
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
    persistAuthSession(res.data.token, res.data.refresh_token, res.data.student);
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