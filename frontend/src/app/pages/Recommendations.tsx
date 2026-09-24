import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Check, Lightbulb, AlertCircle } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  subject_type: string;
  category: string;
  reason: string;
}

interface RecommendationData {
  recommended: Subject[];
  optional: Subject[];
  max_units: number;
  preferred_load: string;
  current_units_recommended: number;
}

const LOAD_LIMITS: Record<string, { label: string; range: string; max: number }> = {
  light: { label: 'Light', range: 'up to 12 units', max: 12 },
  normal: { label: 'Normal', range: 'up to 18 units', max: 18 },
  heavy: { label: 'Heavy', range: 'up to 24 units', max: 24 },
};

const PriorityBadge = ({ category }: { category: string }) => {
  if (category === 'recommended') {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#EEF7F2] text-[#136537] text-[10px] font-bold border border-[#A8D5BB] shadow-sm whitespace-nowrap">
        Recommended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-bold border border-orange-200 shadow-sm whitespace-nowrap">
      Optional
    </span>
  );
};

export function Recommendations() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const [data, setData] = useState<RecommendationData | null>(null);
const [loading, setLoading] = useState(true);
const [selectedLoad, setSelectedLoad] = useState(student?.preferred_load || 'normal');
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>());
const [sameSemesterDeferred, setSameSemesterDeferred] = useState<any[]>([]);


  const fetchRecommendations = async (load: string) => {
  const targetYearLevel = localStorage.getItem('target_year_level');
  const targetSemester = localStorage.getItem('target_semester');

  if (!targetYearLevel || !targetSemester) {
    navigate('/dashboard/returning');
    return;
  }

  try {
    const [recRes, evalRes] = await Promise.all([
      api.get('/recommendation/recommend', {
        params: {
          target_year_level: targetYearLevel,
          target_semester: targetSemester,
          load,
        },
      }),
      api.get('/evaluation/evaluate', {
        params: {
          target_year_level: targetYearLevel,
          target_semester: targetSemester,
        },
      }),
    ]);

    setData(recRes.data);

    const recommendedIds = new Set<string>(
      recRes.data.recommended.map((s: Subject) => s.id)
    );
    setSelectedIds(recommendedIds);

    // Filter deferred subjects that are offered this semester
    // Include both same-semester deferred AND failed-wrong-term deferred
      const deferred = evalRes.data.evaluation.deferred || [];
      setSameSemesterDeferred(deferred.filter((s: any) =>
        s.same_semester === true || s.is_retake === true
      ));
  } catch (err) {
    console.error('Failed to load recommendations', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    localStorage.setItem('session_load', selectedLoad);
    fetchRecommendations(selectedLoad);
  }, []);

  const handleLoadChange = (load: string) => {
    setSelectedLoad(load);
    localStorage.setItem('session_load', load);
    setLoading(true);
    fetchRecommendations(load);
  };

  const toggleSubject = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const allSubjects = data ? [...data.recommended, ...data.optional] : [];
  const selectedSubjects = allSubjects.filter((s) => selectedIds.has(s.id));
  const selectedUnits = selectedSubjects
    .filter((s) => s.subject_type !== 'nstp')
    .reduce((sum, s) => sum + s.units, 0);

  const getLoadLabel = (units: number): string => {
    if (units <= 12) return 'Light';
    if (units <= 18) return 'Normal';
    return 'Heavy';
  };

  const handleConfirm = () => {
    localStorage.setItem(
      'confirmed_subjects',
      JSON.stringify(selectedSubjects)
    );
    navigate('/dashboard/advising');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading recommendations...
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-red-500">
          Failed to load recommendations.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1000px] mx-auto">
        {/* Progress Indicator */}
        <div className="mb-10 px-2 md:px-0">
  <div className="relative max-w-4xl mx-auto">

    <div className="absolute top-[11px] left-[12.5%] right-[12.5%] h-1 bg-gray-200 rounded-full z-0"></div>

    <div className="absolute top-[11px] left-[12.5%] w-[49.2%] h-1 bg-[#136537] rounded-full z-0"></div>

    <div className="relative z-10 grid grid-cols-4">

      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-[#136537] flex items-center justify-center text-white">
          <Check className="w-3 h-3"/>
        </div>
        <span className="mt-2 text-xs md:text-sm font-bold text-[#136537] text-center">
          Academic<br/>Records
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-[#136537] flex items-center justify-center text-white">
          <Check className="w-3 h-3"/>
        </div>
        <span className="mt-2 text-xs md:text-sm font-bold text-[#136537] text-center">
          Subject<br/>Eligibility
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-[#136537] border-4 border-white ring-2 ring-[#136537]/30"></div>
        <span className="mt-2 text-xs md:text-sm font-bold text-[#136537] text-center">
          Recommendation
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300"></div>
        <span className="mt-2 text-xs md:text-sm text-gray-400 text-center leading-tight">
          Advising<br/>Summary
        </span>
      </div>

    </div>
  </div>
</div>

        

        {/* Summary Counts */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-white px-5 py-3 rounded-xl border border-[#C8E6D4]/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#136537] shadow-sm"></div>
            <span className="font-semibold text-gray-600 text-sm">
              Recommended: <span className="text-[#136537] font-bold ml-1">{data.recommended.length}</span>
            </span>
          </div>
          {data.optional.length > 0 && (
            <div className="bg-white px-5 py-3 rounded-xl border border-[#C8E6D4]/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm"></div>
              <span className="font-semibold text-gray-600 text-sm">
                Optional: <span className="text-orange-500 font-bold ml-1">{data.optional.length}</span>
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-3 px-1">
  Click a subject row to select or remove it from your subjects.
</p>

        {/* Table */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 bg-gray-50/30">
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-16 md:w-32">Code</th>
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm flex-1">Subject</th>
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-10 md:w-24 text-center">Units</th>
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-16 md:w-40 text-center">Priority</th>
                  
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No subjects available for this term and load.
                    </td>
                  </tr>
                ) : (
                  allSubjects.map((subject) => (
                    <tr
  key={subject.id}
  onClick={() => toggleSubject(subject.id)}
  className={`cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${
    selectedIds.has(subject.id)
  ? 'bg-[#EEF7F2]/60 border-l-4 border-l-[#136537]'
  : 'hover:bg-[#EEF7F2]/30'
  }`}
>
                      <td className="px-2 md:px-6 py-2 md:py-4 font-semibold text-[#085830] text-xs md:text-sm">{subject.code}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-600 text-xs md:text-sm">
                        <div className="line-clamp-2 md:line-clamp-none">
                          {subject.name}
                          {subject.subject_type === 'nstp' && (
                            <span className="block text-xs text-[#F2AB50]">(excluded from the academic-unit total)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center text-gray-600 text-xs md:text-sm">{subject.units}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm">
                        <div className="flex justify-center"><PriorityBadge category={subject.category} /></div>
                      </td>
                      
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Load Summary */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 p-8 mb-6">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Selected Units</p>
              <p className="text-3xl font-bold text-[#136537]">{selectedUnits}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-3">Academic Load</p>
              <div className="flex gap-3">
                {['light', 'normal', 'heavy'].map((load) => {
                  const info = LOAD_LIMITS[load];
                  const isSelected = selectedLoad === load;
                  return (
                    <button
                      key={load}
                      type="button"
                      onClick={() => handleLoadChange(load)}
                      className={`flex-1 px-4 py-3 rounded-xl border text-center transition-all outline-none ${
  isSelected
    ? 'bg-gradient-to-r from-[#085830] to-[#A8C957] text-white border-0 shadow-md'
    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#136537] hover:text-[#136537] cursor-pointer'
}`}   
                    >
                      <p className="text-xs font-medium mb-0.5">{info.label}</p>
                      <p className="text-[10px] opacity-80">{info.range}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Preferred load: <span className="font-medium capitalize">{student?.preferred_load}</span>. Currently selected: <span className="font-medium">{selectedUnits} units ({getLoadLabel(selectedUnits)})</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Recommendation Summary */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 p-8 mb-6">
          <h2 className="text-lg font-bold text-[#085830] mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#136537]" />
            Recommendation Summary
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Based on your academic records and curriculum evaluation:
            </p>
            <div className="bg-[#EEF7F2]/50 border border-[#C8E6D4] rounded-xl p-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Target Term</p>
                  <p className="text-sm font-semibold text-[#085830]">{localStorage.getItem('target_semester')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Preferred Load</p>
                  <p className="text-sm font-semibold text-[#085830] capitalize">{selectedLoad} ({LOAD_LIMITS[selectedLoad].range})</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Selected Units</p>
                  <p className="text-sm font-semibold text-[#085830]">{selectedUnits} units ({getLoadLabel(selectedUnits)})</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Subjects Selected</p>
                  <p className="text-sm font-semibold text-[#085830]">{selectedIds.size}</p>
                </div>
              </div>
            </div>
            <div>
              
            </div>
          </div>
        </div>

        {/* Same Semester Deferred Info Banner */}
{sameSemesterDeferred.length > 0 && (
  <div className="bg-amber-50 border border-amber-200 rounded-[1.25rem] p-6 mb-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />

      <div>
        <p className="text-sm font-bold text-amber-700 mb-2">
          Subjects Available This Semester - Adviser Confirmation Required
        </p>

        <p className="text-xs text-amber-600 mb-3">
          The following deferred subjects have satisfied all prerequisite requirements and are offered this semester. Depending on departmental policies and adviser approval, these subjects may also be considered for enrollment.
        </p>

        <div className="space-y-2">
  {sameSemesterDeferred.map((s: any) => (
    <div
      key={s.id}
      className="flex items-start gap-2 text-xs text-amber-700"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></div>

      <p className="leading-5 break-words">
        <span className="font-medium">{s.code}</span>
        {" - "}
        <span className="text-amber-600">{s.name}</span>
        <span className="text-amber-500">
          {" "}
          ({s.units} units ·{" "}
          {s.same_semester
            ? "Available this semester"
            : "Previously failed"}
          )
        </span>
      </p>
    </div>
  ))}
</div>
      </div>
    </div>
  </div>
)}

        {/* Bottom Actions */}
        <div className="mt-12 mb-8 flex flex-col items-center gap-6">
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="w-[220px] sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Confirm My Subjects
          </button>
          <div className="w-full border-t border-[#C8E6D4]/50 pt-8 flex justify-start items-center px-4">
            <Link to="/dashboard/eligibility" className="text-gray-500 font-medium text-sm hover:text-[#136537] transition-colors">
              &lt; Subject Eligibility
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}