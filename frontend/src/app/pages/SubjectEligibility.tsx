import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import api from '../../lib/api';
import { Check, X, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  is_retake?: boolean;
  missing_prerequisites?: string[];
  missing_reasons?: string[];
  deferred_reason?: string;
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
        <span className="inline-flex items-center justify-center gap-1 px-2 md:px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200 shadow-sm w-20 md:w-28">
          <Check className="w-3 h-3" /> Eligible
        </span>
      );
    case 'Blocked':
      return (
        <span className="inline-flex items-center justify-center gap-1 px-2 md:px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200 shadow-sm w-20 md:w-28">
          <X className="w-3 h-3" /> Blocked
        </span>
      );
    case 'Deferred':
      return (
        <span className="inline-flex items-center justify-center gap-1 px-2 md:px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 shadow-sm w-20 md:w-28">
          <Clock className="w-3 h-3" /> Deferred
        </span>
      );
   case 'Retake':
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="inline-flex items-center justify-center gap-1 px-2 md:px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200 shadow-sm w-20 md:w-28">
        <Check className="w-3 h-3" /> Eligible
      </span>
      <span className="w-20 md:w-28 text-center translate-x-1 text-[10px] text-purple-600 font-medium">
  Retake
</span>
    </div>
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
  const [showDeferred, setShowDeferred] = useState(false);

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

  // Main table — only this term's relevant subjects
  const mainRows = [
    ...data.eligible.map((s) => ({ ...s, status: 'Eligible' })),
    ...data.retakes.map((s) => ({ ...s, status: 'Retake' })),
    ...data.blocked.map((s) => ({ ...s, status: 'Blocked' })),
  ];

  // Deferred — separate collapsible section
  const deferredRows = data.deferred.map((s) => ({ ...s, status: 'Deferred' }));

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
          <div className="mb-4 md:mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
<div className="font-bold text-orange-700 text-xs md:text-sm mb-1">Incomplete Grades Need Resolution</div>
              <div className="text-orange-600 text-xs md:text-sm">
                {data.inc_warnings.map((s) => s.code).join(', ')} — must be resolved within 1 week at the start of next semester, otherwise it becomes a Failed grade (5.00).
              </div>
            </div>
          </div>
        )}

        {/* Summary Counts */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-xl border border-[#C8E6D4]/50 shadow-sm flex items-center gap-2 md:gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="font-semibold text-gray-600 text-xs md:text-sm">
              Eligible: <span className="text-green-600 font-bold ml-1">{data.eligible.length}</span>
            </span>
          </div>
          <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-xl border border-[#C8E6D4]/50 shadow-sm flex items-center gap-2 md:gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="font-semibold text-gray-600 text-xs md:text-sm">
              Blocked: <span className="text-red-600 font-bold ml-1">{data.blocked.length}</span>
            </span>
          </div>
          {data.retakes.length > 0 && (
            <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-xl border border-[#C8E6D4]/50 shadow-sm flex items-center gap-2 md:gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="font-semibold text-gray-600 text-xs md:text-sm">
                Retake: <span className="text-purple-600 font-bold ml-1">{data.retakes.length}</span>
              </span>
            </div>
          )}
          {deferredRows.length > 0 && (
            <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-xl border border-[#C8E6D4]/50 shadow-sm flex items-center gap-2 md:gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span className="font-semibold text-gray-600 text-xs md:text-sm">
                Deferred: <span className="text-orange-500 font-bold ml-1">{deferredRows.length}</span>
              </span>
            </div>
          )}
        </div>

        {/* Main Table — this term only */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 bg-gray-50/30">
                  <th className="px-2 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm w-24 md:w-32">Code</th>
                  <th className="px-2 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">Subject</th>
                  <th className="px-2 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm w-16 md:w-24 text-center">Units</th>
                  <th className="px-2 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm w-24 md:w-40 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {mainRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No subjects found for this term.
                    </td>
                  </tr>
                ) : (
                  mainRows.map((subject) => (
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
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center text-gray-600 text-xs md:text-sm">{subject.units}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                        <StatusBadge status={subject.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deferred Section — collapsible */}
        {deferredRows.length > 0 && (
          <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-100 overflow-hidden mb-4">
            <button
              onClick={() => setShowDeferred(!showDeferred)}
              className="w-full px-4 md:px-6 py-4 flex items-center justify-between text-left hover:bg-orange-50/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-orange-500" />
<span className="text-sm font-bold text-orange-700">
                {deferredRows.length} Deferred Subject{deferredRows.length > 1 ? 's' : ''} — Subjects from other terms, consult your adviser
              </span>
              </div>
              {showDeferred
                ? <ChevronUp className="w-4 h-4 text-orange-400" />
                : <ChevronDown className="w-4 h-4 text-orange-400" />
              }
            </button>

            {showDeferred && (
              <div className="overflow-x-auto border-t border-orange-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100 bg-orange-50/20">
                      <th className="px-2 md:px-6 py-3 font-medium text-xs md:text-sm w-24 md:w-32">Code</th>
                      <th className="px-2 md:px-6 py-3 font-medium text-xs md:text-sm">Subject</th>
                      <th className="px-2 md:px-6 py-3 font-medium text-xs md:text-sm w-16 md:w-24 text-center">Units</th>
                      <th className="px-2 md:px-6 py-3 font-medium text-xs md:text-sm w-24 md:w-40 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deferredRows.map((subject) => (
                      <tr key={subject.id} className="hover:bg-orange-50/20 transition-colors border-b border-gray-50 last:border-b-0">
                        <td className="px-2 md:px-6 py-2 md:py-4 font-semibold text-[#085830] text-xs md:text-sm">{subject.code}</td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-gray-600 text-xs md:text-sm">
                          <div className="line-clamp-2 md:line-clamp-none">{subject.name}</div>
                          {subject.deferred_reason && (
                            <div className="text-xs text-gray-600 mt-1">{subject.deferred_reason}</div>
                          )}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-center text-gray-600 text-xs md:text-sm">{subject.units}</td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                          <StatusBadge status={subject.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-6 md:mt-12 mb-8">
          <div className="w-full border-t border-[#C8E6D4]/50 pt-6 md:pt-8 flex justify-between items-center px-2 md:px-4">
            <Link
              to="/dashboard/returning"
              className="text-gray-500 font-medium text-xs md:text-sm flex items-center gap-1 hover:text-[#136537] transition-colors"
            >
              &lt; Academic Records
            </Link>
            <Link
              to="/dashboard/recommendations"
              className="text-gray-500 font-medium text-xs md:text-sm flex items-center gap-1 hover:text-[#136537] transition-colors"
            >
              Recommendations &gt;
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}