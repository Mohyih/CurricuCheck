import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import logoImg from '../../imports/CurricuCheck_Logo.png';
import api from '../../lib/api';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState('');

    useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setAccessToken(token);
    } else {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: accessToken,
        new_password: password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#136537] focus:ring-2 focus:ring-[#136537]/20 outline-none transition-all text-[#085830] bg-gray-50/50 placeholder-gray-400';

  return (
    <div className="min-h-screen bg-[#F5FAF7] font-['Inter'] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4] p-8">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-4">
            <ImageWithFallback src={logoImg} alt="CurricuCheck" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-[#085830]">Reset Your Password</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">Enter your new password below</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="px-4 py-3 rounded-lg bg-[#EEF7F2] text-[#136537] text-sm font-medium">
              Password reset successfully! Redirecting to login...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#136537]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-red-500">Min. 8 characters</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-10 ${confirmPassword && confirmPassword !== password ? 'border-red-300' : ''}`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#136537]">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !accessToken}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}