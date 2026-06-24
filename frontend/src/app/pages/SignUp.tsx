import { useState, useEffect } from 'react';
import { ChevronDown, Upload, Check, X } from 'lucide-react';
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

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [programId, setProgramId] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [preferredLoad, setPreferredLoad] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  const [idVerifying, setIdVerifying] = useState(false);
  const [idError, setIdError] = useState('');

  const passwordStrength = password.length === 0
    ? null
    : password.length < 8
    ? 'weak'
    : password.length < 12
    ? 'good'
    : 'strong';

  const strengthColors: Record<string, string> = {
    weak: 'bg-red-400',
    good: 'bg-yellow-400',
    strong: 'bg-green-500',
  };

  const strengthLabels: Record<string, string> = {
    weak: 'Too short (min. 8 characters)',
    good: 'Good',
    strong: 'Strong',
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      const res = await api.get('/curriculum/programs');
      setPrograms(res.data.programs);
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!programId) {
      setCurriculums([]);
      setCurriculumId('');
      return;
    }
    const fetchCurriculums = async () => {
      const res = await api.get(`/curriculum/programs/${programId}/curriculums`);
      setCurriculums(res.data.curriculums);
      setCurriculumId('');
    };
    fetchCurriculums();
  }, [programId]);

const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!studentNumber || !firstName || !lastName) {
      setIdError('Please fill in your name and student number first before uploading your ID.');
      return;
    }

    setIdVerifying(true);
    setIdVerified(false);
    setIdError('');

    try {
      const formData = new FormData();
      formData.append('id_image', file);
      formData.append('student_number', studentNumber);
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);

      const res = await api.post('/scan-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.verified) {
        setIdVerified(true);
        setIdError('');
      } else {
        setIdVerified(false);
        setIdError(res.data.error || 'Verification failed.');
      }
    } catch (err: any) {
      setIdVerified(false);
      setIdError(err.response?.data?.error || 'Could not verify ID. Please try again.');
    } finally {
      setIdVerifying(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
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
    <div className="h-screen bg-[#F5FAF7] font-['Inter'] flex overflow-hidden">

      {/* Left Panel - Branding */}
      <div className="w-72 flex-shrink-0 bg-gradient-to-b from-[#085830] to-[#A8C957] flex flex-col items-center justify-center p-8 text-white">
        <div className="w-24 h-24 mb-5">
          <ImageWithFallback src={logoImg} alt="CurricuCheck Logo" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1 text-center">CurricuCheck</h1>

        <div className="mt-10 w-full border-t border-white/20 pt-8 space-y-3">
          <p className="text-xs text-white/60 text-center">Already have an account?</p>
          <Link
            to="/login"
            className="block w-full text-center px-6 py-2.5 rounded-full border-2 border-white/40 text-white text-sm font-medium hover:bg-white/10 transition-all"
          >
            Log In
          </Link>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
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
                  <label className="text-xs font-medium text-gray-700">Middle Name <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} placeholder="Santos" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Student ID Number</label>
                  <input type="text" required value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} className={inputClass} placeholder="23-1998-610" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Password with reserved strength indicator space */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                  {/* Always reserves h-7 so layout never shifts */}
                  <div className="h-3">
                    {passwordStrength && (
                      <>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${strengthColors[passwordStrength]} ${
                            passwordStrength === 'weak' ? 'w-1/3' :
                            passwordStrength === 'good' ? 'w-2/3' : 'w-full'
                          }`} />
                        </div>
                        <p className={`text-xs font-medium mt-0.5 ${
                          passwordStrength === 'weak' ? 'text-red-500' :
                          passwordStrength === 'good' ? 'text-yellow-600' : 'text-green-600'
                        }`}>{strengthLabels[passwordStrength]}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} ${confirmPassword && confirmPassword !== password ? 'border-red-300 focus:border-red-400' : ''}`}
                    placeholder="••••••••"
                  />
                  <div className="h-3">
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>
              
                      <hr className="border-gray-100" />

              {/* Upload School ID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Upload School ID <span className="text-gray-400 font-normal">(photo or scan)</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer transition-all h-[38px] ${
                    idVerified 
                      ? 'border-[#136537] bg-[#EEF7F2]' 
                      : idError
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#136537]/40 bg-[#F5FAF7] hover:bg-[#EEF7F2]'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      idVerified ? 'bg-[#136537]' : idError ? 'bg-red-100' : 'bg-[#EEF7F2]'
                    }`}>
                      {idVerifying ? (
                        <div className="w-3 h-3 border-2 border-[#136537] border-t-transparent rounded-full animate-spin" />
                      ) : idVerified ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : idError ? (
                        <X className="w-3 h-3 text-red-500" />
                      ) : (
                        <Upload className="w-3 h-3 text-[#136537]" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${idVerified ? 'text-[#136537]' : idError ? 'text-red-500' : 'text-[#136537]'}`}>
                        {idVerifying ? 'Verifying...' : idVerified ? 'ID Verified!' : idError ? 'Verification Failed' : 'Attach ID'}
                      </p>
                      <p className="text-[10px] text-gray-400">JPG, PNG, PDF</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleIdUpload}
                    />
                  </label>
                  {idError && (
                    <p className="text-[10px] text-red-500">{idError}</p>
                  )}
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
                disabled={loading || !idVerified}
                className="w-full px-8 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}