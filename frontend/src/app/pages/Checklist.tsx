import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Trophy } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  year_level: number;
  semester: string;
  subject_type: string;
}

interface AcademicRecord {
  subject_id: string;
  grade: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

const YEAR_LABELS: Record<number, string> = {
  1: 'First Year',
  2: 'Second Year',
  3: 'Third Year',
  4: 'Fourth Year',
};

const SEMESTER_ORDER = ['First Semester', 'Second Semester', 'Summer'];

const STATUS_STYLES: Record<string, string> = {
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  inc: 'bg-yellow-100 text-yellow-700',
  not_taken: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  passed: 'Passed',
  failed: 'Failed',
  inc: 'INC',
  not_taken: 'Not Taken',
};

// Compute GWA for a group of subjects using CHED weighted average
const computeSemGWA = (
  semSubjects: Subject[],
  records: Record<string, AcademicRecord>
): string | null => {
  const graded = semSubjects.filter(s => {
    const r = records[s.id];
    if (!r || r.status !== 'passed') return false;
    const g = parseFloat(r.grade || '');
    return !isNaN(g);
  });

  if (graded.length === 0) return null;

  const totalWeighted = graded.reduce((sum, s) => {
    return sum + parseFloat(records[s.id].grade || '0') * s.units;
  }, 0);
  const totalUnits = graded.reduce((sum, s) => sum + s.units, 0);

  return (totalWeighted / totalUnits).toFixed(2);
};

// Get the most recent date from records in this semester
const getLatestSavedYear = (
  semSubjects: Subject[],
  records: Record<string, AcademicRecord>
): string | null => {
  const dates = semSubjects
    .map(s => records[s.id]?.updated_at || records[s.id]?.created_at)
    .filter(Boolean) as string[];

  if (dates.length === 0) return null;

  const latest = dates.sort().reverse()[0];
  return new Date(latest).getFullYear().toString();
};

export function Checklist() {
  const { student } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<Record<string, AcademicRecord>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!student?.curriculum_id) return;

    const fetchData = async () => {
      try {
        const [subjectsRes, recordsRes, statsRes] = await Promise.all([
  api.get(`/curriculum/subjects/${student.curriculum_id}`),
  api.get('/student/me/records'),
  api.get('/student/me/roadmap'),
]);

        setSubjects(subjectsRes.data.subjects);

        setStats(statsRes.data.stats);

        const recordMap: Record<string, AcademicRecord> = {};
        recordsRes.data.records.forEach((r: any) => {
          recordMap[r.subject_id] = r;
        });
        setRecords(recordMap);
      } catch (err) {
        console.error('Failed to load checklist data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">Loading checklist...</div>
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

  return (
  <Layout>
    <div className="space-y-6">

      {/* Stats Bar */}
      {stats && (
        <div className="bg-white rounded-[1.25rem] border border-[#C8E6D4] shadow-sm p-4 md:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-6">

            {/* Student */}
            <div className="col-span-2 lg:col-span-2 px-2 lg:px-4 pb-4 lg:pb-0">
              <p className="text-xs text-gray-500 font-medium mb-0.5">
                Student
              </p>
              <p className="text-sm font-bold text-[#085830] leading-snug break-words">
                {stats.full_name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.student_number}
              </p>
            </div>

            {/* Program */}
            <div className="px-2 lg:px-4 pb-4 lg:pb-0 lg:border-l border-[#E1EEE6]">
              <p className="text-xs text-gray-500 font-medium mb-0.5">
                Program
              </p>
              <p className="text-sm font-bold text-[#085830]">
                {stats.program_code}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.curriculum_version} Curriculum
              </p>
            </div>

            {/* Year */}
            <div className="px-2 lg:px-4 pb-4 lg:pb-0 lg:border-l border-[#E1EEE6]">
              <p className="text-xs text-gray-500 font-medium mb-0.5">
                Year
              </p>
              <p className="text-sm font-bold text-[#085830]">
                Year {stats.year_level}
              </p>
            </div>

            {/* Standing */}
            <div className="px-2 lg:px-4 lg:border-l border-[#E1EEE6]">
              <p className="text-xs text-gray-500 font-medium mb-0.5">
                Standing
              </p>
              <p className="text-sm font-bold text-[#085830] capitalize">
                {stats.academic_standing}
              </p>
            </div>

            {/* GWA */}
            <div className="px-2 lg:px-4 lg:border-l border-[#E1EEE6]">
              <p className="text-xs text-gray-500 font-medium mb-0.5">
                GWA
              </p>
              <p className="text-sm font-bold text-[#085830]">
                {stats.gwa || '—'}
              </p>
            </div>

          </div>
        </div>
      )}

      {yearLevels.map((year) => (
          <div key={year} className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden">
            {SEMESTER_ORDER.filter((sem) => grouped[year][sem]).map((semester) => {
              const semSubjects = grouped[year][semester];
              const completedCount = semSubjects.filter(
                (s) => records[s.id]?.status === 'passed'
              ).length;

              const semGWA = computeSemGWA(semSubjects, records);
              const isDeansList = semGWA !== null && parseFloat(semGWA) <= 1.75;
              const allPassed = semSubjects.every(s => records[s.id]?.status === 'passed');
              const savedYear = getLatestSavedYear(semSubjects, records);

              return (
                <div key={semester} className="border-b border-gray-100 last:border-b-0">

                  {/* Semester Header */}
                  <div className="px-4 sm:px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex flex-wrap items-start justify-between gap-2">

                      {/* Left — title + trophy */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-[#085830] text-sm sm:text-base">
                          {YEAR_LABELS[year]} - {semester}
                        </h2>
                        {isDeansList && allPassed && (
                          <span
  title="Dean's Lister"
  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF4CC] text-[#9A6B00] text-[10px] font-bold"
>
  <Trophy className="w-3 h-3" />
  Dean's Lister
</span>
                        )}
                      </div>

                      {/* Right — stats */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Date saved */}
                        {savedYear && (
  <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
    {savedYear}
  </span>
)}

                        {/* Sem GWA */}
                        {semGWA && (
                       <span className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full bg-white text-gray-600 border border-gray-200">
  GWA {semGWA}
</span>
                        )}

                        {/* Completed count */}
                        <span className="text-[11px] sm:text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100">
                          {completedCount}/{semSubjects.length} Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-100">
                          <th className="px-1 sm:px-6 py-2 sm:py-3 font-medium w-20 sm:w-32 text-[11px] sm:text-xs">Subject Code</th>
                          <th className="px-1 sm:px-6 py-2 sm:py-3 font-medium text-[11px] sm:text-xs">Subject Name</th>
                          <th className="px-1 sm:px-6 py-2 sm:py-3 font-medium w-14 sm:w-20 text-center text-[10px] sm:text-xs">Units</th>
                          <th className="px-1 sm:px-6 py-2 sm:py-3 font-medium w-18 sm:w-32 text-center text-[10px] sm:text-xs">Grade</th>
                          <th className="px-1 sm:px-6 py-2 sm:py-3 font-medium w-18 sm:w-36 text-center text-[11px] sm:text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {semSubjects.map((subject) => {
                          const record = records[subject.id];
                          const status = record?.status || 'not_taken';

                          return (
                            <tr key={subject.id} className="hover:bg-[#EEF7F2]/30 transition-colors">
                              <td className="px-2 sm:px-6 py-2 sm:py-3 font-semibold text-[#085830] text-xs sm:text-sm">{subject.code}</td>
                              <td className="px-2 sm:px-6 py-2 sm:py-3 text-gray-600 whitespace-normal text-xs sm:text-sm">{subject.name}</td>
                              <td className="px-2 sm:px-6 py-2 sm:py-3 text-center text-gray-600 text-[10px] sm:text-sm">{subject.units}</td>
                              <td className="px-2 sm:px-6 py-2 sm:py-3 text-center text-gray-600 text-[10px] sm:text-sm">
                                {record?.grade || '-'}
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-3 text-center">
                                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${STATUS_STYLES[status]}`}>
                                  {STATUS_LABELS[status]}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Layout>
  );
}