import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Check, X, Clock, AlertCircle, ChevronDown, Pencil } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  year_level: number;
  semester: string;
  subject_type: string;
}

interface RecordEntry {
  subject_id: string;
  grade: string;
  status: string;
}

const YEAR_LABELS: Record<number, string> = {
  1: 'First Year',
  2: 'Second Year',
  3: 'Third Year',
  4: 'Fourth Year',
};

const SEMESTER_ORDER = ['First Semester', 'Second Semester', 'Summer'];

const GRADE_OPTIONS = [
  '1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00',
  '4.00', '5.00', 'INC',
];

function interpretGrade(gradeInput: string): string {
  if (!gradeInput || gradeInput === '') return 'not_taken';
  if (gradeInput === 'INC') return 'inc';
  const num = parseFloat(gradeInput);
  if (num >= 1.0 && num <= 3.0) return 'passed';
  if (num === 4.0 || num === 5.0) return 'failed';
  return 'not_taken';
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'passed':
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200 shadow-sm w-32">
          <Check className="w-3 h-3" /> Passed
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200 shadow-sm w-32">
          <X className="w-3 h-3" /> Failed
        </span>
      );
    case 'inc':
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 shadow-sm w-32">
          <Clock className="w-3 h-3" /> Incomplete
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold w-32 border border-gray-200">
          Not Taken
        </span>
      );
  }
};

export function ReturningDashboard() {
  const navigate = useNavigate();
  const { student, refreshStudent } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [yearLevel, setYearLevel] = useState(student?.year_level || 1);
  const [editingYear, setEditingYear] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('');

  useEffect(() => {
    if (student) setYearLevel(student.year_level);
  }, [student]);

  useEffect(() => {
    if (!student?.curriculum_id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [subjectsRes, recordsRes] = await Promise.all([
          api.get(`/curriculum/subjects/${student.curriculum_id}`),
          api.get('/student/me/records'),
        ]);

        const relevantSubjects = subjectsRes.data.subjects.filter(
          (s: Subject) => s.year_level <= yearLevel
        );
        setSubjects(relevantSubjects);

        const gradeMap: Record<string, string> = {};
        recordsRes.data.records.forEach((r: any) => {
          gradeMap[r.subject_id] = r.grade || (r.status === 'inc' ? 'INC' : '');
        });
        setGrades(gradeMap);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student, yearLevel]);

  const handleGradeChange = (subjectId: string, value: string) => {
    setGrades((prev) => ({ ...prev, [subjectId]: value }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Save year level if changed
      if (yearLevel !== student?.year_level) {
        await api.patch('/student/me/year-level', { year_level: yearLevel });
      }

      // Build records payload - include subjects the user explicitly touched (including "-" / empty => Not Taken)
      const records = subjects
        .filter((s) => grades[s.id] !== undefined)
        .map((s) => ({
          subject_id: s.id,
          grade: grades[s.id] === 'INC' || grades[s.id] === '' ? null : grades[s.id],
          status: interpretGrade(grades[s.id] ?? ''),
        }));

      if (records.length > 0) {
        const now = new Date();
        const academicYear = `${now.getFullYear()}-${now.getFullYear() + 1}`;
        await api.post('/student/me/records', {
          academic_year: academicYear,
          term: 'First Semester', // historical record term; refined later if needed
          records,
        });
      }

      await refreshStudent();
      setShowTermModal(true);
    } catch (err) {
      console.error('Failed to save records', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmTerm = () => {
    if (!selectedTerm) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    let targetYear = currentYear;
    let targetSemester = selectedTerm;

    if (selectedTerm === '1st Semester') {
      targetYear = currentYear + 1;
      targetSemester = 'First Semester';
    } else if (selectedTerm === '2nd Semester') {
      targetSemester = 'Second Semester';
    } else if (selectedTerm === 'Summer') {
      targetSemester = 'Summer';
    }

    localStorage.setItem('target_year_level', String(yearLevel));
    localStorage.setItem('target_semester', targetSemester);
    localStorage.setItem('target_academic_year', String(targetYear));

    setShowTermModal(false);
    navigate('/dashboard/eligibility');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">Loading records...</div>
      </Layout>
    );
  }

  const grouped: Record<number, Record<string, Subject[]>> = {};
  subjects.forEach((s) => {
    if (!grouped[s.year_level]) grouped[s.year_level] = {};
    if (!grouped[s.year_level][s.semester]) grouped[s.year_level][s.semester] = [];
    grouped[s.year_level][s.semester].push(s);
  });

  const yearLevels = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const hasSummerTerm = subjects.some(
  (s) => s.year_level === yearLevel && s.semester === 'Summer'
);

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto">
        {/* Year Level Confirmation */}
        <div className="mb-8 bg-white rounded-2xl border border-[#C8E6D4]/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#136537]">Current Year Level</div>
            {editingYear ? (
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(Number(e.target.value))}
                className="mt-1 px-4 py-2 rounded-lg border border-gray-200 text-[#085830] bg-gray-50/50 focus:bg-white outline-none"
              >
                <option value={1}>First Year</option>
                <option value={2}>Second Year</option>
                <option value={3}>Third Year</option>
                <option value={4}>Fourth Year</option>
              </select>
            ) : (
              <div className="text-lg font-bold text-[#085830]">{YEAR_LABELS[yearLevel]}</div>
            )}
          </div>
          <button
            onClick={() => setEditingYear(!editingYear)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#136537] hover:bg-[#EEF7F2] transition-all"
          >
            <Pencil className="w-4 h-4" />
            {editingYear ? 'Done' : 'Edit'}
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#136537] border-4 border-white shadow-sm ring-2 ring-[#136537]/20"></div>
              <span className="text-xs md:text-sm font-bold text-[#136537] text-center w-20">Academic Records</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300"></div>
              <span className="text-xs md:text-sm font-medium text-gray-400 text-center w-20">Subject Eligibility</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300"></div>
              <span className="text-xs md:text-xs font-medium text-gray-400 text-center w-16">Recommendations</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300"></div>
              <span className="text-xs md:text-sm font-medium text-gray-400 text-center w-20">Advising Summary</span>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden mb-8">
          {yearLevels.map((year) =>
            SEMESTER_ORDER.filter((sem) => grouped[year][sem]).map((semester) => {
              const semSubjects = grouped[year][semester];
              const completedCount = semSubjects.filter(
                (s) => interpretGrade(grades[s.id] || '') === 'passed'
              ).length;

              return (
                <div key={`${year}-${semester}`} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-6 py-4 bg-gray-50/50 flex justify-between items-center border-b border-gray-100">
                    <h2 className="font-bold text-[#085830]">
                      {YEAR_LABELS[year]} - {semester}
                    </h2>
                    <div className="text-sm font-bold text-[#136537] bg-[#EEF7F2] px-4 py-1.5 rounded-full shadow-sm border border-[#C8E6D4]">
                      {completedCount}/{semSubjects.length} Completed
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-100">
                          <th className="px-2 md:px-6 py-2 md:py-3 font-medium text-xs md:text-sm w-16 md:w-32">Code</th>
                          <th className="px-2 md:px-6 py-2 md:py-3 font-medium text-xs md:text-sm flex-1">Subject</th>
                          <th className="px-2 md:px-6 py-2 md:py-3 font-medium text-xs md:text-sm w-10 md:w-20 text-center">Units</th>
                          <th className="px-2 md:px-6 py-2 md:py-3 font-medium text-xs md:text-sm w-20 md:w-36 text-center">Grade</th>
                          <th className="px-2 md:px-6 py-2 md:py-3 font-medium text-xs md:text-sm w-16 md:w-40 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {semSubjects.map((subject) => {
                          const gradeValue = grades[subject.id] || '';
                          const status = interpretGrade(gradeValue);

                          return (
                            <tr key={subject.id} className="hover:bg-[#EEF7F2]/30 transition-colors border-b border-gray-50 last:border-b-0">
                              <td className="px-2 md:px-6 py-2 md:py-3 font-semibold text-[#085830] text-xs md:text-sm">{subject.code}</td>
                              <td className="px-2 md:px-6 py-2 md:py-3 text-gray-600 text-xs md:text-sm"><div className="line-clamp-2 md:line-clamp-none">{subject.name}</div></td>
                              <td className="px-2 md:px-6 py-2 md:py-3 text-center text-gray-600 text-xs md:text-sm">{subject.units}</td>
                              <td className="px-2 md:px-6 py-2 md:py-3">
                                <div className="relative w-20 md:w-28 mx-auto">
                                  <select
                                    value={gradeValue}
                                    onChange={(e) => handleGradeChange(subject.id, e.target.value)}
                                    className="w-full appearance-none px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-gray-200 focus:border-[#F2AB50] focus:ring-2 focus:ring-[#F2AB50]/20 outline-none transition-all text-[#085830] bg-gray-50/50 focus:bg-white text-xs md:text-sm text-center"
                                  >
                                    <option value="">-</option>
                                    {GRADE_OPTIONS.map((g) => (
                                      <option key={g} value={g}>{g}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                </div>
                              </td>
                              <td className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm">
                                <StatusBadge status={status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col items-center gap-8 mb-8">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-10 py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {showTermModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.25rem] shadow-[0_20px_60px_rgb(0,0,0,0.3)] border border-[#C8E6D4]/50 p-8 max-w-md w-full">
            <h2 className="text-xl font-bold text-[#085830] mb-6 text-center">
              What term are you planning to enroll?
            </h2>

            <div className="space-y-3 mb-8">
  {['1st Semester', '2nd Semester', ...(hasSummerTerm ? ['Summer'] : [])].map((term) => (
    <button
      key={term}
      onClick={() => setSelectedTerm(term)}
      className={`w-full px-6 py-3.5 rounded-full font-medium transition-all ${
        selectedTerm === term
          ? 'bg-gradient-to-r from-[#085830] to-[#A8C957] text-white shadow-md'
          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#136537]'
      }`}
    >
      {term}
    </button>
  ))}
</div>

            <button
              onClick={handleConfirmTerm}
              disabled={!selectedTerm}
              className={`w-full px-8 py-3.5 rounded-full font-bold shadow-md transition-all ${
                selectedTerm
                  ? 'bg-gradient-to-r from-[#085830] to-[#A8C957] text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}