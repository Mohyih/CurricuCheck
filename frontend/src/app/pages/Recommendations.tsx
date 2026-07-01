import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Check, Lightbulb, AlertCircle, ChevronDown } from 'lucide-react';

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
  heavy: { label: 'Heavy', range: 'up to 21 units', max: 21 },
};

const PriorityBadge = ({ category }: { category: string }) => {
  if (category === 'recommended') {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF7F2] text-[#136537] text-xs font-bold border border-[#A8D5BB] shadow-sm w-32">
        <Check className="w-3 h-3" /> Recommended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 shadow-sm w-32">
      <Lightbulb className="w-3 h-3" /> Optional
    </span>
  );
};

export function Recommendations() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState(student?.preferred_load || 'normal');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchRecommendations = async (load: string) => {
    const targetYearLevel = localStorage.getItem('target_year_level');
    const targetSemester = localStorage.getItem('target_semester');
    if (!targetYearLevel || !targetSemester) {
      navigate('/dashboard/returning');
      return;
    }
    try {
      const res = await api.get('/recommendation/recommend', {
        params: { target_year_level: targetYearLevel, target_semester: targetSemester, load },
      });
      setData(res.data);
      // Auto-select all recommended subjects
      const recommendedIds = new Set(
        res.data.recommended.map((s: Subject) => s.id)
      );
      setSelectedIds(recommendedIds);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(selectedLoad);
  }, []);

  const handleLoadChange = (load: string) => {
    setSelectedLoad(load);
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
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[66%] h-1 bg-indigo-200 rounded-full z-0"></div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#136537] border-2 border-[#136537] shadow-sm flex items-center justify-center text-white">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-[#136537] text-center w-20">Academic Records</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#136537] border-2 border-[#136537] shadow-sm flex items-center justify-center text-white">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-[#136537] text-center w-20">Subject Eligibility</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#136537] border-4 border-[#F5FAF7] shadow-sm ring-2 ring-[#136537]/30"></div>
              <span className="text-[0.625rem] md:text-[0.625rem] font-bold text-[#136537] text-center w-14 leading-tight">Recommendations</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300"></div>
              <span className="text-xs md:text-sm font-medium text-gray-400 text-center w-20">Advising Summary</span>
            </div>
          </div>
        </div>

        {/* Load Selector */}
        <div className="mb-6 bg-white rounded-2xl border border-[#C8E6D4]/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 flex items-center justify-between">
          <div className="text-sm font-bold text-[#085830]">Academic Load</div>
          <div className="relative w-48">
            <select
              value={selectedLoad}
              onChange={(e) => handleLoadChange(e.target.value)}
              className="w-full appearance-none px-4 py-2 rounded-lg border border-gray-200 focus:border-[#F2AB50] outline-none text-sm text-[#085830] bg-gray-50/50 pr-8"
            >
              <option value="light">Light (up to 12 units)</option>
              <option value="normal">Normal (up to 18 units)</option>
              <option value="heavy">Heavy (up to 21 units)</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-10 md:w-24 text-center">✓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No subjects available for this term and load.
                    </td>
                  </tr>
                ) : (
                  allSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-[#EEF7F2]/30 transition-colors border-b border-gray-50 last:border-b-0">
                      <td className="px-2 md:px-6 py-2 md:py-4 font-semibold text-[#085830] text-xs md:text-sm">{subject.code}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-600 text-xs md:text-sm">
                        <div className="line-clamp-2 md:line-clamp-none">
                          {subject.name}
                          {subject.subject_type === 'nstp' && (
                            <span className="block text-xs text-[#F2AB50]">(0u)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center text-gray-600 text-xs md:text-sm">{subject.units}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm">
                        <div className="flex justify-center"><PriorityBadge category={subject.category} /></div>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(subject.id)}
                          onChange={() => toggleSubject(subject.id)}
                          className="w-4 h-4 text-[#136537] bg-white border-gray-300 rounded focus:ring-2 focus:ring-[#136537]/20 cursor-pointer"
                        />
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
                  const isActive = getLoadLabel(selectedUnits).toLowerCase() === load;
                  return (
                    <div
                      key={load}
                      className={`flex-1 px-4 py-3 rounded-xl border text-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#085830] to-[#A8C957] text-white border-transparent shadow-md'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      <p className="text-xs font-medium mb-0.5">{info.label}</p>
                      <p className="text-[10px] opacity-80">{info.range}</p>
                    </div>
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
                  <p className="text-sm font-semibold text-[#085830] capitalize">{student?.preferred_load} ({LOAD_LIMITS[student?.preferred_load || 'normal'].range})</p>
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
              <p className="text-gray-700 font-semibold mb-3 text-sm">Why these subjects were recommended:</p>
              <ul className="space-y-2.5">
                {data.recommended.slice(0, 3).map((s) => (
                  <li key={s.id} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] mt-1.5 flex-shrink-0"></div>
                    <span><span className="font-medium text-gray-700">{s.code}</span> — {s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-12 mb-8 flex flex-col items-center gap-6">
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
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