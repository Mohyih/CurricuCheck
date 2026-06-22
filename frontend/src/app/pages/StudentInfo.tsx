import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
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
  const { student, refreshStudent } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [preferredLoad, setPreferredLoad] = useState(student?.preferred_load || 'normal');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPrograms = async () => {
      const res = await api.get('/curriculum/programs');
      setPrograms(res.data.programs);
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!student?.program_id) return;
    const fetchCurriculums = async () => {
      const res = await api.get(`/curriculum/programs/${student.program_id}/curriculums`);
      setCurriculums(res.data.curriculums);
    };
    fetchCurriculums();
  }, [student?.program_id]);

  useEffect(() => {
    if (student) setPreferredLoad(student.preferred_load);
  }, [student]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Note: only preferred_load is currently editable via backend.
      // Program/curriculum changes would require a dedicated endpoint (not in current scope).
      await api.patch('/student/me/preferred-load', { preferred_load: preferredLoad });
      setMessage('Changes saved successfully!');
      await refreshStudent();
    } catch (err) {
      setMessage('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 p-8 sm:p-10">
        <form onSubmit={handleSave}>
          {/* Personal Information Section */}
          <section className="mb-10">
            <h2 className="text-sm font-bold text-[#136537] tracking-widest uppercase mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F2AB50]"></div>
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={student.last_name}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-[#085830] bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={`${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-[#085830] bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium text-gray-700">Student ID Number</label>
                <input
                  type="text"
                  value={student.student_number}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-[#085830] bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-100 my-8" />

          {/* Academic Information Section */}
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
                  value={programs.find((p) => p.id === student.program_id)?.name || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-[#085830] bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Curriculum Version</label>
                <input
                  type="text"
                  value={curriculums.find((c) => c.id === student.curriculum_id)?.version || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-[#085830] bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium text-gray-700">Preferred Academic Load</label>
                <div className="relative">
                  <select
                    value={preferredLoad}
                    onChange={(e) => setPreferredLoad(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F2AB50] focus:ring-2 focus:ring-[#F2AB50]/20 outline-none transition-all text-[#085830] bg-gray-50/50 focus:bg-white appearance-none pr-10"
                  >
                    <option value="light">Light (up to 12 units)</option>
                    <option value="normal">Normal (up to 18 units)</option>
                    <option value="heavy">Heavy (up to 21 units)</option>
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

          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}