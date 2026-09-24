import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import api from '../../lib/api';
import { ChevronDown } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Curriculum {
  id: string;
  version: number;
}

export function StudentInfo() {
  const { student, refreshStudent, logout } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [curriculumsLoading, setCurriculumsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [preferredLoad, setPreferredLoad] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setProgramsLoading(true);
        const res = await api.get('/curriculum/programs');
        setPrograms(res.data.programs);
      } finally {
        setProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!student?.program_id) {
      setCurriculumsLoading(false);
      setCurriculums([]);
      return;
    }

    const fetchCurriculums = async () => {
      try {
        setCurriculumsLoading(true);
        const res = await api.get(`/curriculum/programs/${student.program_id}/curriculums`);
        setCurriculums(res.data.curriculums);
      } finally {
        setCurriculumsLoading(false);
      }
    };

    fetchCurriculums();
  }, [student?.program_id]);

  useEffect(() => {
    if (student) {
      setFirstName(student.first_name);
      setLastName(student.last_name);
      setMiddleName(student.middle_name || '');
      setYearLevel(String(student.year_level));
      setPreferredLoad(student.preferred_load);
    }
  }, [student]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.patch('/student/me/profile', {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        year_level: parseInt(yearLevel),
        preferred_load: preferredLoad,
      });
      setMessage('Profile updated successfully!');
      await refreshStudent();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/student/me');
      logout();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#136537] focus:ring-2 focus:ring-[#136537]/20 outline-none transition-all text-[#085830] bg-gray-50/50 focus:bg-white placeholder-gray-400';
  const selectClass = `${inputClass} appearance-none cursor-pointer`;
  const disabledClass = 'w-full px-4 py-3 rounded-lg border border-gray-200 text-[#085830] bg-gray-100 cursor-not-allowed';

  if (!student) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4] p-8 sm:p-10">

        <form onSubmit={handleSave}>
          {/* Personal Information */}
          <section className="mb-10">
            <h2 className="text-sm font-bold text-[#136537] tracking-widest uppercase mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F2AB50]"></div>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Middle Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Student ID Number</label>
                <input type="text" value={student.student_number} disabled className={disabledClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input type="text" value={student.email || '—'} disabled className={`w-full truncate ${disabledClass}`} />
              </div>
            </div>
          </section>

          <hr className="border-gray-100 my-8" />

          {/* Academic Information */}
          <section className="mb-10">
            <h2 className="text-sm font-bold text-[#136537] tracking-widest uppercase mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F2AB50]"></div>
              Academic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Degree Program</label>
                <input
                  type="text"
                  value={
                    programsLoading
                      ? 'Loading...'
                      : programs.find((p) => p.id === student.program_id)?.name || ''
                  }
                  disabled
                  className={`w-full truncate ${disabledClass}`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Curriculum Version</label>
                <input
                  type="text"
                  value={
                    curriculumsLoading
                      ? 'Loading...'
                      : curriculums.find((c) => c.id === student.curriculum_id)?.version || ''
                  }
                  disabled
                  className={disabledClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Year Level</label>
                <div className="relative">
                  <select value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} className={selectClass}>
                    <option value="1">First Year</option>
                    <option value="2">Second Year</option>
                    <option value="3">Third Year</option>
                    <option value="4">Fourth Year</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
  <label className="text-sm font-medium text-gray-700">Preferred Academic Load</label>
  <div className="relative">
    <select 
      value={preferredLoad} 
      onChange={(e) => setPreferredLoad(e.target.value)} 
      className={`w-full truncate pr-10 appearance-none ${selectClass}`}
    >
      <option value="light">Light (up to 12 units)</option>
      <option value="normal">Normal (up to 18 units)</option>
      <option value="heavy">Heavy (up to 24 units)</option>
    </select>
    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
</div>
            </div>
          </section>

          {message && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-[#EEF7F2] text-[#136537] text-sm font-medium">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-8 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-10 pt-8 border-t-2 border-dashed border-red-100">
          <h2 className="text-sm font-bold text-red-500 tracking-widest uppercase mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            Danger Zone
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Deleting your account is permanent and cannot be undone. All your academic records will be removed.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2.5 rounded-full border-2 border-red-300 text-red-500 text-sm font-medium hover:bg-red-50 transition-all"
            >
              Delete Account
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
              <p className="text-sm font-semibold text-red-600">
                Are you sure? This will permanently delete your account and all academic records.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="px-6 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2.5 rounded-full border-2 border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}