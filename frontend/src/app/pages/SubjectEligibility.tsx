import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import api from '../../lib/api';
import { Check, X, Clock, AlertTriangle } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  is_retake?: boolean;
  missing_prerequisites?: string[];
  missing_reasons?: string[];
}

interface EvaluationData {
  eligible: Subject[];
  blocked: Subject[];
  deferred: Subject[];
  retakes: Subject[];
  inc_warnings: Subject[];
  nstp: Subject[];
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'Eligible':
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200 shadow-sm w-28">
          <Check className="w-3 h-3" /> Eligible
        </span>
      );
    case 'Blocked':
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200 shadow-sm w-28">
          <X className="w-3 h-3" /> Blocked
        </span>
      );
    case 'Deferred':
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 shadow-sm w-28">
          <Clock className="w-3 h-3" /> Deferred
        </span>
      );
    case 'Retake':
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 shadow-sm w-28">
          Retake
        </span>
      );
      case 'NSTP':
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-sm w-28">
          NSTP
        </span>
      );
    default:
      return null;
  }
};

export function SubjectEligibility() {
  const navigate = useNavigate();
  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [targetSemester, setTargetSemester] = useState('');

  useEffect(() => {
    const targetYearLevel = localStorage.getItem('target_year_level');
    const targetSem = localStorage.getItem('target_semester');

    if (!targetYearLevel || !targetSem) {
      navigate('/dashboard/returning');
      return;
    }

    setTargetSemester(targetSem);

    const fetchEvaluation = async () => {
      try {
        const res = await api.get('/evaluation/evaluate', {
          params: {
            target_year_level: targetYearLevel,
            target_semester: targetSem,
          },
        });
        setData(res.data.evaluation);
      } catch (err) {
        setError('Failed to load eligibility data.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">Evaluating curriculum...</div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-red-500">{error || 'No data found.'}</div>
      </Layout>
    );
  }

const allRows = [
  ...data.eligible.map((s: any) => ({ ...s, status: 'Eligible' })),
  ...data.retakes.map((s: any) => ({ ...s, status: 'Retake' })),
  ...data.blocked.map((s: any) => ({ ...s, status: 'Blocked' })),
  ...data.deferred.map((s: any) => ({ ...s, status: 'Deferred' })),
];

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto">
       {/* Progress Indicator */}
<div className="mb-10 px-2 md:px-0">
  <div className="relative max-w-4xl mx-auto">

    <div className="absolute top-[11px] left-[12.5%] right-[12.5%] h-1 bg-gray-200 rounded-full"></div>

    <div className="absolute top-[11px] left-[12.5%] w-[25%] h-1 bg-[#136537] rounded-full"></div>

    <div className="grid grid-cols-4">

      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-[#136537] flex items-center justify-center text-white z-10">
          <Check className="w-3 h-3"/>
        </div>
        <span className="mt-2 text-xs md:text-sm font-bold text-[#136537] text-center leading-tight">
          Academic<br />Records
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-[#136537] border-4 border-white ring-2 ring-[#136537]/30 z-10"></div>
        <span className="mt-2 text-xs md:text-sm font-bold text-[#136537] text-center leading-tight">
          Subject<br />Eligibility
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 z-10"></div>
        <span className="mt-2 text-xs md:text-sm text-gray-400 text-center">
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

        {/* INC Warnings */}
        {data.inc_warnings.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-orange-700 text-sm mb-1">Incomplete Grades Need Resolution</div>
              <div className="text-orange-600 text-sm">
                {data.inc_warnings.map((s) => s.code).join(', ')} must be resolved within 1 week at the start of next semester, otherwise it becomes a Failed grade (5.00).
              </div>
            </div>
          </div>
        )}

        {/* Summary Counts */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-6 overflow-x-auto pb-2">
          <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl border border-[#C8E6D4]/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-2 md:gap-3 flex-shrink-0 whitespace-nowrap">
            <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-green-500 shadow-sm"></div>
            <span className="font-semibold text-gray-600 text-xs md:text-sm">
              <span className="hidden md:inline">Eligible: </span><span className="text-green-600 font-bold">{data.eligible.length}</span>
            </span>
          </div>
          <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl border border-[#C8E6D4]/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-2 md:gap-3 flex-shrink-0 whitespace-nowrap">
            <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-red-500 shadow-sm"></div>
            <span className="font-semibold text-gray-600 text-xs md:text-sm">
              <span className="hidden md:inline">Blocked: </span><span className="text-red-600 font-bold">{data.blocked.length}</span>
            </span>
          </div>
          <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl border border-[#C8E6D4]/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-2 md:gap-3 flex-shrink-0 whitespace-nowrap">
            <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-orange-400 shadow-sm"></div>
            <span className="font-semibold text-gray-600 text-xs md:text-sm">
              <span className="hidden md:inline">Deferred: </span><span className="text-orange-500 font-bold">{data.deferred.length}</span>
            </span>
          </div>
          {data.retakes.length > 0 && (
            <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl border border-[#C8E6D4]/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-2 md:gap-3 flex-shrink-0 whitespace-nowrap">
              <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-purple-500 shadow-sm"></div>
              <span className="font-semibold text-gray-600 text-xs md:text-sm">
                <span className="hidden md:inline">Retake: </span><span className="text-purple-600 font-bold">{data.retakes.length}</span>
              </span>
            </div>
          )}
        </div>
        {data.nstp.filter((s: any) => s.status === 'eligible').length > 0 && (
            <div className="bg-white px-5 py-3 rounded-xl border border-indigo-50/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></div>
              <span className="font-semibold text-gray-600 text-sm">
                NSTP: <span className="text-blue-600 font-bold ml-1">{data.nstp.filter((s: any) => s.status === 'eligible').length}</span>
              </span>
            </div>
          )}

        {/* Subject Eligibility Table */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 bg-gray-50/30">
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-16 md:w-32">Code</th>
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm flex-1">Subject</th>
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-10 md:w-24 text-center">Units</th>
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-16 md:w-40 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No subjects found for this term.
                    </td>
                  </tr>
                ) : (
                  allRows.map((subject) => (
                    <tr key={subject.id} className="hover:bg-[#EEF7F2]/30 transition-colors border-b border-gray-50 last:border-b-0">
                      <td className="px-2 md:px-6 py-2 md:py-4 font-semibold text-[#085830] text-xs md:text-sm">{subject.code}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-600 text-xs md:text-sm">
                        <div className="line-clamp-2 md:line-clamp-none">{subject.name}</div>
                        {subject.status === 'Blocked' && subject.missing_reasons && (
                          <div className="mt-1 space-y-0.5">
                            {subject.missing_reasons.map((reason: string, i: number) => (
                              <div key={i} className="text-xs text-red-500">{reason}</div>
                            ))}
                          </div>
                        )}
                        {subject.status === 'Deferred' && subject.deferred_reason && (
                          <div className="text-xs text-orange-500 mt-1">{subject.deferred_reason}</div>
                        )}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center text-gray-600 text-xs md:text-sm">{subject.units}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm">
                        <StatusBadge status={subject.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Actions */}
<div className="mt-12 mb-8 flex flex-col items-center gap-6">
  <button
    onClick={() => navigate("/dashboard/recommendations")}
    className="px-8 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-bold shadow-md hover:shadow-lg transition-all"
  >
    Recommendations
  </button>

  <div className="w-full border-t border-[#C8E6D4]/50 pt-8 flex justify-start items-center px-4">
    <Link
      to="/dashboard/returning"
      className="text-gray-500 font-medium text-sm hover:text-[#136537] transition-colors"
    >
      &lt; Academic Records
    </Link>
  </div>
</div>
      </div>
    </Layout>
  );
}