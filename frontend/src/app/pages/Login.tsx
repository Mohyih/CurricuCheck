import { useState, useEffect  } from 'react';
import { Link, useNavigate } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import logoImg from "../../imports/CurricuCheck_Logo.png";
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [showSlowLogin, setShowSlowLogin] = useState(false);
  

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  setShowSlowLogin(false);

  const slowLoginTimer = setTimeout(() => {
    setShowSlowLogin(true);
  }, 7000);

  try {
    await login(studentNumber, password);
    navigate('/dashboard', { replace: true });
  } catch (err: any) {
    setError(err.response?.data?.error || 'Login failed. Please try again.');
  } finally {
    clearTimeout(slowLoginTimer);
    setLoading(false);
    setShowSlowLogin(false);
  }
};

const handleForgotPassword = async () => {
  setForgotLoading(true);
  setForgotError('');

  try {
    const res = await api.post('/auth/forgot-password', {
      email: forgotEmail
    });

    setForgotMessage(res.data.message);
  } catch (err: any) {
    setForgotError(
      err.response?.data?.error || 'Something went wrong.'
    );
  } finally {
    setForgotLoading(false);
  }
};

  return (

  
    <div className="min-h-screen bg-[#F5FAF7] font-['Inter'] flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-0 left-0 w-full h-16 px-5 lg:px-8 flex items-center">

{/* Back Button */}
    <button
      type="button"
      onClick={() => navigate('/')}
      className="absolute top-4 right-4 inline-flex items-center text-[#085830] hover:text-[#136537] transition-colors text-2xl sm:text-2xl leading-none p-1 rounded-lg hover:bg-[#EEF7F2]"
      aria-label="Go back"
    >
      ←
    </button>

        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
            <ImageWithFallback src={logoImg} alt="CurricuCheck Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg text-[#085830] tracking-tight">CurricuCheck</span>
        </Link>
      </div>

{/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-500 text-white text-center text-xs py-2 font-medium">
          You are offline. Some features may not work until you reconnect.
        </div>
      )}


      {/* Slow Login Indicator */}
{showSlowLogin && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
    <div className="bg-white border border-[#C8E6D4] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl px-4 py-3 text-center">
      <p className="text-sm font-semibold text-[#085830]">
        This is taking a little longer...
      </p>
      <p className="text-xs text-gray-500 mt-1">
        The server may be waking up. Please wait while we complete your login.
      </p>
    </div>
  </div>
)}


      <div className="w-full max-w-md">
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-[#C8E6D4]/50">
          <form className="space-y-6 mt-4" onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Student ID Number or Email</label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F2AB50] focus:ring-2 focus:ring-[#F2AB50]/20 outline-none transition-all text-[#085830] bg-gray-50/50 focus:bg-white placeholder-gray-400"
                placeholder="ID Number or Email" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F2AB50] focus:ring-2 focus:ring-[#F2AB50]/20 outline-none transition-all text-[#085830] bg-gray-50/50 focus:bg-white placeholder-gray-400"
                placeholder="••••••••"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-[#136537] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

                    {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.25rem] shadow-[0_20px_60px_rgb(0,0,0,0.3)] border border-[#C8E6D4] p-8 max-w-md w-full">
            <h2 className="text-lg font-bold text-[#085830] mb-2">Reset Password</h2>
            

            {forgotMessage ? (
              <div className="px-4 py-3 rounded-lg bg-[#EEF7F2] text-[#136537] text-sm font-medium mb-4">
                {forgotMessage}
              </div>
            ) : (
                            <div className="space-y-4">
                {forgotError && (
                  <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                    {forgotError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#136537] focus:ring-2 focus:ring-[#136537]/20 outline-none transition-all text-[#085830] bg-gray-50/50 placeholder-gray-400"
                                        placeholder="your@email.com"
                  />
                </div>
                <button
  type="button"
  onClick={handleForgotPassword}
  disabled={forgotLoading}
  className="w-full py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium disabled:opacity-60"
>
  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
</button>
                            </div>
            )}

            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setForgotMessage(''); setForgotError(''); }}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}



            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-base disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Access Dashboard'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#136537] hover:text-[#F2AB50] transition-colors font-semibold">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}