import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Check, X, Clock, AlertCircle, ChevronDown, Pencil } from 'lucide-react';
import SSModalImg  from '../../imports/SS_Modal.png';

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
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200 shadow-sm whitespace-nowrap max-sm:px-1 max-sm:py-[0px] max-sm:text-[8px]">
          Passed
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200 shadow-sm whitespace-nowrap max-sm:px-1 max-sm:py-[0px] max-sm:text-[8px]">
          Failed
        </span>
      );
    case 'inc':
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-bold border border-orange-200 shadow-sm whitespace-nowrap max-sm:px-1 max-sm:py-[0px] max-sm:text-[8px]">
          INC
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold border border-gray-200 whitespace-nowrap max-sm:px-1 max-sm:py-[0px] max-sm:text-[8px]">
          Not Taken
        </span>
      );
  }
};

export function ReturningDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { student, refreshStudent } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [yearLevel, setYearLevel] = useState(student?.year_level || 1);
  const [editingYear, setEditingYear] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingChanges, setSavingChanges] = useState(false);
const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('');

// Encoding method modal
  const [showEncodingModal, setShowEncodingModal] = useState(false);
  const [encodingMethod, setEncodingMethod] = useState<'manual' | 'ai' | null>(null);

  // AI Scan states
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanImages, setScanImages] = useState<{file: File, preview: string}[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanPreview, setShowScanPreview] = useState(false);

  const suggestedScreenshots = student?.year_level || 1;

  const [showSampleImage, setShowSampleImage] = useState(false);

  useEffect(() => {
  if (location.state?.openModal) {
    setShowEncodingModal(true);

    // Clear the state so it won't reopen when returning
    window.history.replaceState({}, "");
  }
}, []);


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

  const handleSaveChanges = async (proceedToEligibility: boolean = false) => {
  if (proceedToEligibility) {
    setCheckingEligibility(true);
  } else {
    setSavingChanges(true);
  }

  try {
    if (yearLevel !== student?.year_level) {
      await api.patch('/student/me/year-level', { year_level: yearLevel });
    }

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
        term: 'First Semester',
        records,
      });
    }

    await refreshStudent();

    if (proceedToEligibility) {
      setShowTermModal(true);
    }

  } catch (err) {
    console.error('Failed to save records', err);
  } finally {
    setSavingChanges(false);
    setCheckingEligibility(false);
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
        <div className="mb-8 bg-white rounded-2xl border border-[#C8E6D4]/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#136537]">Target Year Level</div>
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
              <div className="text-base sm:text-lg font-bold text-[#085830]">{YEAR_LABELS[yearLevel]}</div>
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

        <div className="mb-10 px-2 md:px-0">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute top-[11px] left-[12.5%] right-[12.5%] h-1 bg-gray-200 rounded-full"></div>

            <div className="grid grid-cols-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#136537] border-4 border-white ring-2 ring-[#136537]/20 z-10"></div>
                <span className="mt-2 text-xs md:text-sm font-bold text-[#136537] text-center leading-tight">
                  Academic<br />Records
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 z-10"></div>
                <span className="mt-2 text-xs md:text-sm text-gray-400 text-center leading-tight">
                  Subject<br />Eligibility
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 z-10"></div>
                <span className="mt-2 text-xs md:text-sm text-gray-400 text-center leading-tight">
                  Recommendation
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 z-10"></div>
                <span className="mt-2 text-xs md:text-sm text-gray-400 text-center leading-tight">
                  Advising<br />Summary
                </span>
              </div>
            </div>
          </div>
        </div>

{/* Optional AI Scan button */}
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => { setScanImages([]); setScanResults([]); setShowScanModal(true); }}
            className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[#136537] bg-[#EEF7F2] px-2 sm:px-3 py-1 rounded-full border border-[#C8E6D4] shadow-sm hover:bg-[#E4F3EA] transition-all"
          >
            Scan More Grades
          </button>
        </div>


        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden mb-8">
          {yearLevels.map((year) =>
            SEMESTER_ORDER.filter((sem) => grouped[year][sem]).map((semester) => {
              const semSubjects = grouped[year][semester];
              const completedCount = semSubjects.filter(
                (s) => interpretGrade(grades[s.id] || '') === 'passed'
              ).length;

              return (
                <div key={`${year}-${semester}`} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 sm:px-6 py-4 bg-gray-50/50 flex items-center justify-between gap-3 border-b border-gray-100">
                    <h2 className="font-bold text-[#085830] text-[13.5px] sm:text-lg flex-1">
                      {YEAR_LABELS[year]} - {semester}
                    </h2>
                    <div className="shrink-0 text-[11px] sm:text-sm font-bold text-[#136537] bg-[#EEF7F2] px-2 sm:px-3 py-1 rounded-full border border-[#C8E6D4] shadow-sm whitespace-nowrap">
                      {completedCount}/{semSubjects.length} Completed
                    </div>
                  </div>

                  <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-100">
                          <th className="px-1.5 md:px-6 py-1.5 md:py-3 font-medium text-[10px] md:text-sm w-16 md:w-32">Code</th>
                          <th className="px-1.5 md:px-6 py-1.5 md:py-3 font-medium text-[10px] md:text-sm flex-1">Subject</th>
                          <th className="px-1.5 md:px-6 py-1.5 md:py-3 font-medium text-[10px] md:text-sm w-10 md:w-20 text-center">Units</th>
                          <th className="px-1.5 md:px-6 py-1.5 md:py-3 font-medium text-[10px] md:text-sm w-20 md:w-36 text-center">Grade</th>
                          <th className="px-1.5 md:px-6 py-1.5 md:py-3 font-medium text-[10px] md:text-sm w-16 md:w-40 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {semSubjects.map((subject) => {
                          const gradeValue = grades[subject.id] || '';
                          const status = interpretGrade(gradeValue);

                          return (
                            <tr
                              key={subject.id}
                              className="hover:bg-[#EEF7F2]/30 transition-colors border-b border-gray-50 last:border-b-0"
                            >
                              <td className="px-2 md:px-6 py-2 md:py-3 font-semibold text-[#085830] text-xs md:text-sm">{subject.code}</td>
                              <td className="px-2 md:px-6 py-2 md:py-3 text-gray-600 text-xs md:text-sm">
                                <div className="whitespace-normal break-words md:whitespace-normal">
  {subject.name}
</div>
                              </td>
                              <td className="px-2 md:px-6 py-2 md:py-3 text-center text-gray-600 text-xs md:text-sm">{subject.units}</td>
                              <td className="px-2 md:px-6 py-2 md:py-3">
                                <div className="relative w-12 md:w-28 mx-auto">
                                  <select
                                    value={gradeValue}
                                    onChange={(e) => handleGradeChange(subject.id, e.target.value)}
                                    className="w-full appearance-none px-1.5 md:px-3 py-1 md:py-1.5 rounded-md border border-gray-200 focus:border-[#F2AB50] focus:ring-2 focus:ring-[#F2AB50]/20 outline-none transition-all text-[#085830] bg-gray-50/50 focus:bg-white text-[10px] md:text-sm text-center"
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

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
  {/* Save Only */}
  <button
    type="button"
    onClick={() => handleSaveChanges(false)}
    disabled={savingChanges || checkingEligibility}
    className="w-[240px] sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {savingChanges ? 'Saving...' : 'Save Changes'}
  </button>

  {/* Save + Check Eligibility */}
  <button
    type="button"
    onClick={() => handleSaveChanges(true)}
    disabled={savingChanges || checkingEligibility}
    className="w-[240px] sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {checkingEligibility ? 'Checking...' : 'Check Subject Eligibility'}
  </button>
</div>
      </div>

      {showTermModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.25rem] shadow-[0_20px_60px_rgb(0,0,0,0.3)] border border-[#C8E6D4]/50 p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold text-[#085830] mb-2 text-center">
              What term are you planning to enroll?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {yearLevel === 1 ? 'First' : yearLevel === 2 ? 'Second' : yearLevel === 3 ? 'Third' : 'Fourth'} Year
            </p>
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





{/* Soft dev 3 effect */}




{/* Encoding Method Modal */}
      {showEncodingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.25rem] shadow-[0_20px_60px_rgb(0,0,0,0.3)] border border-[#C8E6D4] p-5 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg sm:text-xl font-bold text-[#085830] mb-2 text-center">
              How would you like to encode your grades?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 text-center mb-8">
              Choose how you want to input your academic records
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Scan Option */}
              <button
                type="button"
                onClick={() => { setShowEncodingModal(false); setShowScanModal(true); }}
                className="flex flex-col items-center gap-4 p-4 sm:p-6 rounded-xl border-2 border-[#C8E6D4] hover:border-[#136537] hover:bg-[#EEF7F2] transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] flex items-center justify-center">
                  <span className="text-2xl">𖠌</span>
                </div>
                <div>
                  <p className="font-bold text-[#085830] text-center mb-1">AI Grade Scanner</p>
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    Take a screenshot of your WUP Automate grade table and let AI automatically fill in your grades
                  </p>
                </div>
               {/* Sample image */}
<div className="w-full bg-[#EEF7F2] rounded-lg p-3 border border-[#C8E6D4]">
  <p className="text-xs text-[#136537] font-medium text-center mb-2">
     Screenshot Example
  </p>

  <img
    src={SSModalImg}
    alt="Sample WUP Automate Grades"
    className="w-full rounded-lg border border-[#C8E6D4] shadow-sm object-contain cursor-pointer"
    onClick={(e) => {
      e.stopPropagation();
      setShowSampleImage(true);
    }}
  />

  <p className="text-[11px] text-center text-gray-500 mt-2">
    Click image to enlarge
  </p>
</div>
                
              </button>

              {/* Manual Option */}
              <button
                type="button"
                onClick={() => { setShowEncodingModal(false); setEncodingMethod('manual'); }}
                className="flex flex-col items-center gap-4 p-4 sm:p-6 rounded-xl border-2 border-[#C8E6D4] hover:border-[#136537] hover:bg-[#EEF7F2] transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] flex items-center justify-center">
                  <span className="text-2xl">✎</span>
                </div>
                <div>
                  <p className="font-bold text-[#085830] text-center mb-1">Manual Encoding</p>
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    Manually select your grade for each subject using the dropdown menus
                  </p>
                </div>
                <div className="w-full bg-[#EEF7F2] rounded-lg p-3 border border-[#C8E6D4]">
                  <p className="text-xs text-[#136537] font-medium text-center mb-1">How it works:</p>
                  <div className="space-y-1 text-[10px] text-gray-500">
                    <p>1. Find each subject in the table</p>
                    <p>2. Select your grade from dropdown</p>
                    <p>3. Status updates automatically</p>
                    <p>4. Save when done</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-medium">Best for entering grades one by one</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.25rem] shadow-[0_20px_60px_rgb(0,0,0,0.3)] border border-[#C8E6D4] p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base sm:text-lg font-bold text-[#085830]">AI Grade Scanner</h2>
              <button
                onClick={() => { setShowScanModal(false); setEncodingMethod('manual'); }}
                className="text-gray-400 hover:text-gray-600 text-xs sm:text-sm"
              >
                Encode Manually
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 mb-6">
  <p className="text-xs sm:text-sm font-semibold text-amber-800 mb-2">
    Screenshot Guidelines
  </p>

  <p className="text-xs text-amber-700 leading-relaxed mb-4">
    In <strong>WUP Automate</strong>, capture a screenshot that includes the
    <strong> semester header (term and school year)</strong> together with the
    <strong> complete grade table</strong>. If all of your grades don't fit in
    one screenshot, you may upload <strong>multiple screenshots</strong> (one
    for each semester or section).
  </p>

  <div className="bg-[#fff2eb] rounded-lg border border-amber-200 p-3">
  <p className="text-xs font-medium text-amber-800 text-center mb-2">
      Screenshot Example
    </p>

    <img
      src={SSModalImg}
      alt="Sample WUP Automate Grades"
      className="w-full rounded-lg border border-[#C8E6D4] shadow-sm object-contain cursor-pointer transition hover:scale-[1.01]"
      onClick={(e) => {
        e.stopPropagation();
        setShowSampleImage(true);
      }}
    />

    <p className="text-[11px] text-center text-gray-500 mt-2 italic">
      Click image to enlarge
    </p>
  </div>
</div>

            {/* Upload Area */}
            <div className="space-y-3 mb-6">
              <label className="flex flex-col items-center justify-center gap-3 px-4 py-5 sm:py-6 rounded-xl border-2 border-dashed border-[#136537]/40 bg-[#F5FAF7] cursor-pointer hover:bg-[#EEF7F2] transition-all">
                
                  
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-[#136537]">Upload Grade Screenshot</p>
                  <p className="text-xs text-gray-400">JPG, PNG - include header + full table</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newImages = files.map(file => ({
                      file,
                      preview: URL.createObjectURL(file)
                    }));
                    setScanImages(prev => [...prev, ...newImages]);
                  }}
                />
              </label>

              {/* Image previews */}
              {scanImages.length > 0 && (
                <div className="space-y-2">
                  {scanImages.map((img, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3 p-3 bg-[#EEF7F2] rounded-lg border border-[#C8E6D4]">
                      <img src={img.preview} alt={`Screenshot ${index + 1}`} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-[#085830]">Screenshot {index + 1}</p>
                        <p className="text-xs text-gray-400">{img.file.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setScanImages(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scan Button */}
            <button
              type="button"
              disabled={scanImages.length === 0 || scanning}
              onClick={async () => {
                setScanning(true);
                const allResults: any[] = [];

                for (const img of scanImages) {
                  const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = reader.result as string;
                      resolve(result.split(',')[1]);
                    };
                    reader.readAsDataURL(img.file);
                  });

                  const mediaType = img.file.type;

                  try {
                    const res = await api.post('/scan-grades', {
                      image_base64: base64,
                      media_type: mediaType,
                      curriculum_id: student?.curriculum_id,
                    });

                    allResults.push(res.data);
                  } catch (err) {
                    console.error('Scan failed for image:', img.file.name, err);
                  }
                }

                setScanResults(allResults);
                setScanning(false);
                setShowScanPreview(true);
                setShowScanModal(false);
              }}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {scanning
                ? `Scanning ${scanImages.length} screenshot${scanImages.length > 1 ? 's' : ''}...`
                : `Scan ${scanImages.length} Screenshot${scanImages.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Scan Preview Modal */}
      {showScanPreview && scanResults.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.25rem] shadow-[0_20px_60px_rgb(0,0,0,0.3)] border border-[#C8E6D4] p-5 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-base sm:text-lg font-bold text-[#085830] mb-2">Review Extracted Grades</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              Review the grades AI extracted from your screenshots. Click Confirm to auto-fill the grade table.
            </p>

            {scanResults.map((result, resultIndex) => (
              <div key={resultIndex} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#A8C957]"></div>
                  <p className="text-xs sm:text-sm font-bold text-[#085830]">
                    Screenshot {resultIndex + 1}
                    {result.semester_detected && ` - ${result.semester_detected}`}
                    {result.school_year_detected && ` (${result.school_year_detected})`}
                  </p>
                </div>

                {/* Matched grades */}
                {result.matched_grades?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-green-600 mb-2"> {result.matched_grades.length} subjects matched:</p>
                    <div className="space-y-1">
                      {result.matched_grades.map((g: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg border border-green-100 text-xs">
                          <span className="font-medium text-[#085830]">{g.subject_code}</span>
                          <span className="text-gray-500 flex-1 mx-3 truncate">{g.subject_name}</span>
                          <span className="font-bold text-green-700">{g.grade}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unmatched grades */}
                {result.unmatched_grades?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-600 mb-2">⚠️ {result.unmatched_grades.length} subjects not found in curriculum:</p>
                    <div className="space-y-1">
                      {result.unmatched_grades.map((g: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                          <span className="font-medium text-amber-700">{g.extracted_code}</span>
                          <span className="text-gray-500 flex-1 mx-3 truncate">{g.subject_name}</span>
                          <span className="font-bold text-amber-700">{g.grade}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  // Apply all matched grades to the grades state
                  const newGrades = { ...grades };
                  scanResults.forEach(result => {
                    result.matched_grades?.forEach((g: any) => {
                      // Normalize grade to match dropdown format
                      // e.g. "1.5" → "1.50", "1.0" → "1.00", "INC" stays "INC"
                      let normalizedGrade = g.grade;
                      if (g.grade && g.grade !== 'INC') {
                        const num = parseFloat(g.grade);
                        if (!isNaN(num)) {
                          normalizedGrade = num.toFixed(2);
                        }
                      }
                      newGrades[g.subject_id] = normalizedGrade;
                    });
                  });
                  setGrades(newGrades);
                  setShowScanPreview(false);
                  setEncodingMethod('manual');
                }}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-bold transition-all"
              >
                Confirm & Auto-Fill Grades
              </button>
              <button
                type="button"
                onClick={() => { setShowScanPreview(false); setEncodingMethod('manual'); }}
                className="px-6 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-xs sm:text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

{showSampleImage && (
  <div
    className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-6"
    onClick={() => setShowSampleImage(false)}
  >
    <div
      className="relative w-full max-w-5xl max-h-[90vh] overflow-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowSampleImage(false);
        }}
        className="absolute -top-3 -right-3 bg-white rounded-full w-10 h-10 shadow-lg text-base sm:text-lg sm:text-xl hover:bg-gray-100"
      >
        ×
      </button>

      <img
        src={SSModalImg}
        alt="Sample WUP Automate Grades"
        className="w-full h-auto rounded-xl shadow-2xl"
      />
    </div>
  </div>
)}


    </Layout>
  );
}

