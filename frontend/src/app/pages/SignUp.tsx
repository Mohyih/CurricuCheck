import { useState, useEffect } from 'react';
import { ChevronDown, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import logoImg from '../../imports/CurricuCheck_Logo.png';
import api from '../../lib/api';

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Curriculum {
  id: string;
  version: number;
}

export function SignUp() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [programId, setProgramId] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [preferredLoad, setPreferredLoad] = useState('');

  // Password reveal
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    const fetchPrograms = async () => {
      const res = await api.get('/curriculum/programs');
      setPrograms(res.data.programs);
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!programId) { setCurriculums([]); setCurriculumId(''); return; }
    const fetchCurriculums = async () => {
      const res = await api.get(`/curriculum/programs/${programId}/curriculums`);
      setCurriculums(res.data.curriculums);
      setCurriculumId('');
    };
    fetchCurriculums();
  }, [programId]);

  const handleSendOTP = async () => {
    setOtpError('');
    if (!email) { setOtpError('Please enter your WUP email first.'); return; }
    setSendingOtp(true);
    try {
      await api.post('/otp/send', { email, first_name: firstName || 'Student' });
      setOtpSent(true);
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError('');
    if (!otpCode) { setOtpError('Please enter the OTP code.'); return; }
    setVerifyingOtp(true);
    try {
      await api.post('/otp/verify', { email, otp_code: otpCode });
      setEmailVerified(true);
      setOtpError('');
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailVerified) { setError('Please verify your WUP email before submitting.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!programId || !curriculumId || !yearLevel || !preferredLoad) {
      setError('Please fill in all academic information fields.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        student_number: studentNumber,
        password,
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        program_id: programId,
        curriculum_id: curriculumId,
        year_level: parseInt(yearLevel),
        preferred_load: preferredLoad,
        email_address: email,
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#136537] focus:ring-2 focus:ring-[#136537]/20 outline-none transition-all text-[#085830] bg-gray-50/50 focus:bg-white placeholder-gray-400 text-sm';
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div className="h-screen bg-[#F5FAF7] font-['Inter'] flex flex-col md:flex-row overflow-hidden">

      {/* Left Panel */}
      <div className="w-full md:w-72 flex-shrink-0 bg-gradient-to-b from-[#085830] to-[#A8C957] flex flex-col items-center justify-center p-6 md:p-8 text-white">
        <div className="w-24 h-24 mb-5">
          <ImageWithFallback src={logoImg} alt="CurricuCheck Logo" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1 text-center">CurricuCheck</h1>
        <div className="mt-10 w-full border-t border-white/20 pt-8 space-y-3">
          <p className="text-xs text-white/60 text-center">Already have an account?</p>
          <Link to="/login" className="block w-full text-center px-6 py-2.5 rounded-full border-2 border-white/40 text-white text-sm font-medium hover:bg-white/10 transition-all">
            Log In
          </Link>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-hidden">
        <div className="bg-white w-full max-w-xl rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4] p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>

            {error && (
              <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* PERSONAL INFORMATION */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-gray-100 pb-2">
                Personal Information
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Last Name</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Dela Cruz" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">First Name</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Juan" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Middle Name <span className="text-gray-400">(optional)</span></label>
                  <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} placeholder="Santos" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Student ID Number</label>
                  <input type="text" required value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} className={inputClass} placeholder="23-1998-610" />
                </div>
              </div>

              {/* WUP Email + OTP */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">WUP Email Address</label>
                {!emailVerified ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setOtpSent(false); setOtpCode(''); setOtpError(''); }}
                        className={`${inputClass} flex-1`}
                        placeholder="lastname.firstname@wesleyan.edu.ph"
                        disabled={otpSent}
                      />
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={sendingOtp || !email}
                        className="px-3 py-2 rounded-lg bg-[#136537] text-white text-xs font-medium hover:bg-[#085830] transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    </div>

                    {otpSent && (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className={`${inputClass} flex-1 tracking-widest text-center font-bold`}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={verifyingOtp || !otpCode}
                          className="px-3 py-2 rounded-lg bg-[#136537] text-white text-xs font-medium hover:bg-[#085830] transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                          {verifyingOtp ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    )}

                    {otpError && (
                      <p className="text-xs text-red-500 mt-1">{otpError}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EEF7F2] border border-[#C8E6D4]">
                    <CheckCircle className="w-4 h-4 text-[#136537] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#136537]">{email}</span>
                    <span className="text-xs text-[#136537]/60 ml-auto">Verified ✓</span>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-8`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#136537]">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="h-4">
                    {password.length > 0 && password.length < 8 && (
                      <p className="text-xs text-red-500">Min. 8 characters</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pr-8 ${confirmPassword && confirmPassword !== password ? 'border-red-300' : ''}`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#136537]">
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="h-4">
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ACADEMIC INFORMATION */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-gray-100 pb-2">
                Academic Information
              </h2>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Degree Program</label>
                <div className="relative">
                  <select required value={programId} onChange={(e) => setProgramId(e.target.value)} className={selectClass}>
                    <option value="" disabled>Select Degree Program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Curriculum Version</label>
                  <div className="relative">
                    <select required value={curriculumId} onChange={(e) => setCurriculumId(e.target.value)} disabled={!programId} className={`${selectClass} disabled:opacity-50`}>
                      <option value="" disabled>{programId ? 'Select Version' : 'Select program*'}</option>
                      {curriculums.map((c) => (
                        <option key={c.id} value={c.id}>{c.version} Curriculum</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Year Level</label>
                  <div className="relative">
                    <select required value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} className={selectClass}>
                      <option value="" disabled>Select</option>
                      <option value="1">First Year</option>
                      <option value="2">Second Year</option>
                      <option value="3">Third Year</option>
                      <option value="4">Fourth Year</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Preferred Load</label>
                  <div className="relative">
                    <select required value={preferredLoad} onChange={(e) => setPreferredLoad(e.target.value)} className={selectClass}>
                      <option value="" disabled>Select</option>
                      <option value="light">Light (≤12)</option>
                      <option value="normal">Normal (≤18)</option>
                      <option value="heavy">Heavy (≤21)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !emailVerified}
                className="w-full px-8 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Creating Account...' : !emailVerified ? 'Verify Email to Continue' : 'Create Account'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}