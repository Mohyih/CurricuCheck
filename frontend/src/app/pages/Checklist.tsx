import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

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

const STATUS_ICON_STYLE_MOBILE_ONLY = 'hidden sm:inline';

const STATUS_LABELS: Record<string, string> = {
  passed: 'Passed',
  failed: 'Failed',
  inc: 'INC',
  not_taken: 'Not Taken',
};

export function Checklist() {
  const { student } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<Record<string, AcademicRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.curriculum_id) return;

    const fetchData = async () => {
      try {
        const [subjectsRes, recordsRes] = await Promise.all([
          api.get(`/curriculum/subjects/${student.curriculum_id}`),
          api.get('/student/me/records'),
        ]);

        setSubjects(subjectsRes.data.subjects);

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

  // Group subjects by year level, then semester
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
        {yearLevels.map((year) => (
          <div key={year} className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden">
            {SEMESTER_ORDER.filter((sem) => grouped[year][sem]).map((semester) => {
              const semSubjects = grouped[year][semester];
              const completedCount = semSubjects.filter(
                (s) => records[s.id]?.status === 'passed'
              ).length;

              return (
                <div key={semester} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-6 py-4 bg-gray-50/50 flex justify-between items-center border-b border-gray-100">
<h2 className="font-bold text-[#085830] text-sm sm:text-base">
                      {YEAR_LABELS[year]} - {semester}
                    </h2>
<div className="text-[11.5px] sm:text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100">
                      {completedCount}/{semSubjects.length} Completed
                    </div>
                  </div>

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
                                <span
                                  className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${STATUS_STYLES[status]}`}
                                >
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