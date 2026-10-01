import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import api from '../../lib/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Session {
  id: string;
  target_year_level: number;
  target_semester: string;
  preferred_load: string;
  confirmed_subjects: any[];
  eligible: any[];
  blocked: any[];
  deferred: any[];
  retakes: any[];
  recommended: any[];
  optional: any[];
  total_units: number;
  created_at: string;
}

const YEAR_LABELS: Record<number, string> = {
  1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth',
};

const LoadBadge = ({ load }: { load: string }) => {
  const colors: Record<string, string> = {
    light: 'bg-blue-50 text-blue-700 border-blue-200',
    normal: 'bg-green-50 text-green-700 border-green-200',
    heavy: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border capitalize ${colors[load] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {load}
    </span>
  );
};

const StatusBadge = ({ status, count }: { status: string; count: number }) => {
  const styles: Record<string, string> = {
    eligible:  'bg-green-50 text-green-700 border-green-200',
    blocked:   'bg-red-50 text-red-700 border-red-200',
    deferred:  'bg-orange-50 text-orange-700 border-orange-200',
    retakes:   'bg-purple-50 text-purple-700 border-purple-200',
    recommended: 'bg-blue-50 text-blue-700 border-blue-200',
    optional:  'bg-gray-50 text-gray-600 border-gray-200',
  };
  const labels: Record<string, string> = {
    eligible: 'Eligible', blocked: 'Blocked', deferred: 'Deferred',
    retakes: 'Retake', recommended: 'Recommended', optional: 'Optional',
  };
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${styles[status]}`}>
      <span className="font-bold">{count}</span>
      <span>{labels[status]}</span>
    </div>
  );
};

export function AdvisingHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/student/me/advising-sessions');
        setSessions(res.data.sessions);
      } catch (err) {
        console.error('Failed to load advising history');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading advising history...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#085830]">Advising History</h1>
          <p className="text-sm text-gray-500 mt-1">
            A record of your past advising sessions and evaluation snapshots.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-[1.25rem] border border-[#C8E6D4] p-12 text-center">
            
            <p className="text-sm font-medium text-gray-600 mb-1">No advising sessions yet</p>
            <p className="text-xs text-gray-400">
              Complete the 4-stage advising flow to see your history here.
            </p>
          </div>
        ) : (
          sessions.map((session, index) => {
            const isExpanded = expandedId === session.id;
            const date = new Date(session.created_at).toLocaleDateString('en-PH', {
              year: 'numeric', month: 'long', day: 'numeric',
            });
            const time = new Date(session.created_at).toLocaleTimeString('en-PH', {
              hour: '2-digit', minute: '2-digit',
            });

            return (
              <div
                key={session.id}
                className="bg-white rounded-[1.25rem] border border-[#C8E6D4] shadow-sm overflow-hidden"
              >
                {/* Session Header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full px-4 md:px-6 py-4 flex items-start justify-between gap-3 hover:bg-[#EEF7F2]/30 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">
                        Session #{sessions.length - index}
                      </span>
                      <LoadBadge load={session.preferred_load} />
                    </div>
                    <p className="text-sm font-bold text-[#085830]">
                      {YEAR_LABELS[session.target_year_level]} Year - {session.target_semester}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {date} · {time}
                    </p>
                  </div>

                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs font-bold text-[#085830] bg-[#EEF7F2] px-2 py-1 rounded-lg border border-[#C8E6D4]">
                      {session.total_units} units
                    </span>
                    <span className="text-xs text-gray-400">
                      {session.confirmed_subjects?.length || 0} subjects
                    </span>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    }
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 md:px-6 py-4 space-y-5">

                    {/* Evaluation Snapshot */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Evaluation Snapshot
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status="eligible" count={session.eligible?.length || 0} />
                        <StatusBadge status="blocked" count={session.blocked?.length || 0} />
                        <StatusBadge status="deferred" count={session.deferred?.length || 0} />
                        <StatusBadge status="retakes" count={session.retakes?.length || 0} />
                      </div>
                    </div>

                    {/* Recommendation Snapshot */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Recommendation Snapshot
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status="recommended" count={session.recommended?.length || 0} />
                        <StatusBadge status="optional" count={session.optional?.length || 0} />
                      </div>
                    </div>

                    {/* Confirmed Subjects */}
                    {session.confirmed_subjects?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Confirmed Subjects
                        </p>
                        <div className="bg-[#EEF7F2] rounded-xl border border-[#C8E6D4] overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-[#C8E6D4] text-gray-500">
                                <th className="px-3 py-2 font-medium">Code</th>
                                <th className="px-3 py-2 font-medium">Subject</th>
                                <th className="px-3 py-2 font-medium text-center">Units</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#C8E6D4]/50">
                              {session.confirmed_subjects.map((s: any) => (
                                <tr key={s.id} className="bg-white/60">
                                  <td className="px-3 py-2 font-semibold text-[#085830]">{s.code}</td>
                                  <td className="px-3 py-2 text-gray-600">{s.name}</td>
                                  <td className="px-3 py-2 text-center text-gray-600">{s.units}</td>
                                </tr>
                              ))}
                              <tr className="bg-[#EEF7F2]">
                                <td className="px-3 py-2 font-bold text-[#085830]" colSpan={2}>
                                  Total Units
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-[#085830]">
                                  {session.total_units}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}