import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
// @ts-ignore
import '@xyflow/react/dist/style.css';
import { Layout } from '../components/Layout';
import api from '../../lib/api';

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string; dot: string }> = {
  passed:   { bg: '#d5e8d4', border: '#82b366', text: '#1a5c1a', label: 'Passed',   dot: '#82b366' },
  eligible: { bg: '#dae8fc', border: '#6c8ebf', text: '#1a3a6b', label: 'Eligible', dot: '#6c8ebf' },
  retake:   { bg: '#e1d5e7', border: '#9673a6', text: '#4a1a6b', label: 'Retake',   dot: '#9673a6' },
  inc:      { bg: '#fff2cc', border: '#d6b656', text: '#6b4a00', label: 'INC',      dot: '#d6b656' },
  locked:   { bg: '#f5f5f5', border: '#cccccc', text: '#888888', label: 'Locked',   dot: '#cccccc' },
  
};

const SEMESTER_ORDER = ['First Semester', 'Second Semester', 'Summer'];

function getSemesterKey(yearLevel: number, semester: string) {
  return `${yearLevel}-${semester}`;
}

const SubjectNode = ({ data }: { data: any }) => {
  const colors = STATUS_COLORS[data.status] || STATUS_COLORS.locked;
  const isSelected = data.role === 'selected';
  const isPrerequisite = data.role === 'prerequisite';
  const isUnlocks = data.role === 'unlocks';
  const isDimmed = data.role === 'dimmed';

  let bg = colors.bg;
  let border = colors.border;
  let opacity = 1;
  let boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
  let scale = 1;

  if (isSelected) {
    bg = '#ffffff';
    border = '#085830';
    boxShadow = '0 0 0 4px #085830, 0 4px 20px rgba(8,88,48,0.4)';
    scale = 1.08;
  } else if (isPrerequisite) {
    bg = '#f3dddd';
border = '#b83b3b';
boxShadow = '0 0 0 3px #b83b3b, 0 4px 12px rgba(184,59,59,0.25)';
  } else if (isUnlocks) {
    bg = '#d8eee1';
border = '#1f7a4d';
boxShadow = '0 0 0 3px #1f7a4d, 0 4px 12px rgba(31,122,77,0.25)';
  } else if (isDimmed) {
    opacity = 0.2;
    boxShadow = 'none';
  }

  return (
    <div
      style={{
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 12,
        padding: '10px 12px',
        minWidth: 130,
        maxWidth: 150,
        cursor: 'pointer',
        boxShadow,
        opacity,
        transform: `scale(${scale})`,
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      title={`${data.name}\n${data.units} units\nStatus: ${colors.label}${data.grade ? `\nGrade: ${data.grade}` : ''}`}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 8, height: 8 }} />

      {isPrerequisite && (
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#b83b3b', color: 'white', fontSize: 8, fontWeight: 'bold', padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
          Required
        </div>
      )}
      {isUnlocks && (
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#1f7a4d', color: 'white', fontSize: 8, fontWeight: 'bold', padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
          Unlocks
        </div>
      )}

      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isPrerequisite ? '#b83b3b' : isUnlocks ? '#1f7a4d' : colors.dot, position: 'absolute', top: 8, right: 8 }} />

      <div style={{ fontSize: 12, fontWeight: 'bold', color: isPrerequisite ? '#9f3030' : isUnlocks ? '#17633f' : colors.text, textAlign: 'center', marginBottom: 4 }}>
        {data.code}
      </div>
      <div style={{ fontSize: 9, textAlign: 'center', color: isPrerequisite ? '#9f3030' : isUnlocks ? '#17633f' : colors.text, opacity: 0.75, marginBottom: 4 }}>
        {data.units} units
      </div>
      {data.grade && (
        <div style={{ fontSize: 10, textAlign: 'center', fontWeight: 'bold', color: border, background: 'white', borderRadius: 6, padding: '1px 6px', marginBottom: 2 }}>
          {data.grade}
        </div>
      )}
      <div style={{ fontSize: 8, textAlign: 'center', padding: '2px 8px', borderRadius: 10, background: isPrerequisite ? '#b83b3b' : isUnlocks ? '#1f7a4d' : border, color: '#fff', fontWeight: 'bold', marginTop: 2 }}>
        {colors.label}
      </div>

            {data.standing_requirement && (
        <div style={{
          fontSize: 7,
          textAlign: 'center',
          padding: '1px 5px',
          borderRadius: 8,
          background: '#b7d682',
          color: '#fff',
          fontWeight: 'bold',
          marginTop: 3,
        }}>
          Yr {data.standing_requirement}+ Required
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 8, height: 8 }} />
    </div>
  );
};

const nodeTypes = { subject: SubjectNode };

// ── Inner component that uses useReactFlow hook ──
function RoadmapInner({
  nodes, edges, onNodesChange, onEdgesChange,
  handleNodeClick, handlePaneClick, stats, allSubjects,
  selectedSubject, setSelectedSubject, setNodes, baseNodes,
  setSelectedSubjectId,
}: any) {
  const { fitView } = useReactFlow();

  const onClickNode = useCallback((event: any, node: any) => {
    handleNodeClick(event, node, (nodeIds: string[]) => {
      // After state updates, fit view to include selected + related nodes
      setTimeout(() => {
        fitView({
          nodes: nodeIds.map(id => ({ id })),
          duration: 600,
          padding: 0.35,
        });
      }, 50);
    });
  }, [handleNodeClick, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onClickNode}
      onPaneClick={handlePaneClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      nodesConnectable={false}
      edgesFocusable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#f5faf7" gap={20} />
      <Controls />
        {window.innerWidth >= 768 && (
              <MiniMap
                nodeColor={(node) => {
                  const status = node.data?.status as string;
                  const role = node.data?.role as string;
                  if (role === 'selected') return '#085830';
                  if (role === 'prerequisite') return '#b83b3b';
                  if (role === 'unlocks') return '#1f7a4d';
                  if (role === 'dimmed') return '#eeeeee';
                  return STATUS_COLORS[status]?.border || '#aaaaaa';
                }}
                maskColor="rgba(255,255,255,0.7)"
                style={{ width: 120, height: 80 }}
              />
            )}
    </ReactFlow>
  );
}

export function CurriculumRoadmap() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [baseNodes, setBaseNodes] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await api.get('/student/me/roadmap');
        const { stats, subjects } = res.data;
        setStats(stats);
        setAllSubjects(subjects);
        buildGraph(subjects);
      } catch (err) {
        console.error('Failed to load roadmap', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  const buildGraph = (subjects: any[]) => {
    const semesterMap: Record<string, any[]> = {};
    subjects.forEach(s => {
      const key = getSemesterKey(s.year_level, s.semester);
      if (!semesterMap[key]) semesterMap[key] = [];
      semesterMap[key].push(s);
    });

    const sortedKeys = Object.keys(semesterMap).sort((a, b) => {
      const yearA = parseInt(a.split('-')[0]);
      const semA = a.substring(a.indexOf('-') + 1);
      const yearB = parseInt(b.split('-')[0]);
      const semB = b.substring(b.indexOf('-') + 1);
      if (yearA !== yearB) return yearA - yearB;
      return SEMESTER_ORDER.indexOf(semA) - SEMESTER_ORDER.indexOf(semB);
    });

    const newNodes: any[] = [];
    const COL_WIDTH = 280;
    const ROW_HEIGHT = 160;
    const X_OFFSET = 60;
    const Y_OFFSET = 80;

    sortedKeys.forEach((key, colIndex) => {
      const yearLevel = key.split('-')[0];
      const semester = key.substring(key.indexOf('-') + 1);
      const x = X_OFFSET + colIndex * COL_WIDTH;

      newNodes.push({
        id: `header-${key}`,
        type: 'default',
        position: { x, y: 0 },
        selectable: false,
        draggable: false,
        data: { label: `Year ${yearLevel} · ${semester}` },
        style: {
          background: '#085830', color: '#ffffff', fontWeight: 'bold',
          fontSize: 10, borderRadius: 8, border: 'none', width: 150,
          textAlign: 'center', padding: '6px 4px', pointerEvents: 'none',
        },
      });

      semesterMap[key].forEach((subject, rowIndex) => {
        newNodes.push({
          id: subject.id,
          type: 'subject',
          position: { x, y: Y_OFFSET + rowIndex * ROW_HEIGHT },
          data: { ...subject, role: 'normal' },
        });
      });
    });

    setBaseNodes(newNodes);
    setNodes(newNodes);
    setEdges([]);
  };

  const handleNodeClick = useCallback((
    _: any,
    node: any,
    onFitCallback?: (ids: string[]) => void
  ) => {
    if (node.type !== 'subject') return;

    if (selectedSubjectId === node.id) {
      setSelectedSubjectId(null);
      setSelectedSubject(null);
      setNodes(baseNodes.map(n => ({ ...n, data: { ...n.data, role: 'normal' } })));
      return;
    }

    setSelectedSubjectId(node.id);
    setSelectedSubject(node.data);

    const clickedSubject = allSubjects.find(s => s.id === node.id);
    const prereqIds = new Set(
      clickedSubject?.prerequisites?.map((p: any) => p.required_subject_id) || []
    );
    const unlocksIds = new Set(
      allSubjects
        .filter(s => s.prerequisites?.some((p: any) => p.required_subject_id === node.id))
        .map(s => s.id)
    );

    const relatedIds = [node.id, ...Array.from(prereqIds), ...Array.from(unlocksIds)];

    setNodes(baseNodes.map(n => {
      if (n.type !== 'subject') return n;
      let role = 'dimmed';
      if (n.id === node.id) role = 'selected';
      else if (prereqIds.has(n.id)) role = 'prerequisite';
      else if (unlocksIds.has(n.id)) role = 'unlocks';
      return { ...n, data: { ...n.data, role } };
    }));

    if (onFitCallback) onFitCallback(relatedIds as string[]);
  }, [selectedSubjectId, allSubjects, baseNodes]);

  const handlePaneClick = useCallback(() => {
    setSelectedSubjectId(null);
    setSelectedSubject(null);
    setNodes(baseNodes.map(n => ({ ...n, data: { ...n.data, role: 'normal' } })));
  }, [baseNodes]);

  const progressPercent = stats
    ? Math.round((stats.total_units_taken / stats.total_units_required) * 100)
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading curriculum roadmap...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full gap-3">

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
        {/* Overall Progress Bar */}
        {stats && (
          <div className="bg-white rounded-xl border border-[#C8E6D4] px-4 md:px-5 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#085830]">Curriculum Progress</span>
              <span className="text-xs font-bold text-[#085830]">
                {stats.total_units_taken} / {stats.total_units_required} units · {progressPercent}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                
                 style={{
width: `${progressPercent}%`,
background: 'linear-gradient(90deg, #085830 0%, #4F823F 50%, #A8C957 100%)',
}}


              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">0 units</span>
              <span className="text-[10px] text-gray-400">{stats.total_units_required} units</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-xl border border-[#C8E6D4] px-4 md:px-5 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Legend:</span>
            {Object.entries(STATUS_COLORS).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div style={{ width: 12, height: 12, borderRadius: 4, background: colors.bg, border: `2px solid ${colors.border}` }} />
                <span className="text-xs text-gray-600">{colors.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div style={{ width: 12, height: 12, borderRadius: 4, background: '#fde8e8', border: '2px solid #e05c5c' }} />
              <span className="text-xs text-gray-600">Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 12, height: 12, borderRadius: 4, background: '#d5f5e3', border: '2px solid #1f7a4d' }} />
              <span className="text-xs text-gray-600">Unlocks</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 italic hidden md:block">
            Click any subject to see its prerequisites and what it unlocks
          </p>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 bg-white rounded-[1.25rem] border border-[#C8E6D4] overflow-hidden" style={{ minHeight: '500px' }}>
          <ReactFlowProvider>
            <RoadmapInner
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              handleNodeClick={handleNodeClick}
              handlePaneClick={handlePaneClick}
              stats={stats}
              allSubjects={allSubjects}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              setNodes={setNodes}
              baseNodes={baseNodes}
              setSelectedSubjectId={setSelectedSubjectId}
            />
          </ReactFlowProvider>
        </div>

        {/* Detail Panel — responsive */}
                {selectedSubject && (
          <div className="fixed top-[5rem] right-3 md:top-[6rem] md:right-5 rounded-[1.25rem] border-2 border-[#085830] shadow-2xl p-3 md:p-4 w-56 md:w-72 z-50 max-h-[70vh] overflow-y-auto" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 mr-2">
                              <p className="text-sm font-bold text-[#085830]">{selectedSubject.code}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{selectedSubject.name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedSubjectId(null);
                  setSelectedSubject(null);
                  setNodes(baseNodes.map(n => ({ ...n, data: { ...n.data, role: 'normal' } })));
                }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>

                        <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Units</span>
                <span className="font-medium text-[#085830]">{selectedSubject.units}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Year Level</span>
                <span className="font-medium text-[#085830]">Year {selectedSubject.year_level}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Semester</span>
                <span className="font-medium text-[#085830]">{selectedSubject.semester}</span>
              </div>

              {selectedSubject.standing_requirement && (
                <div className="flex justify-between text-xs items-center">
                  <span className="text-gray-500">Required Year</span>
                  <span
                    className="font-bold px-2 py-0.5 rounded-full text-xs text-white"
                    style={{ background: '#b7d682' }}
                  >
                    Year {selectedSubject.standing_requirement}+
                  </span>
                </div>
              )}


              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-500">Status</span>
                <span
                  className="font-bold capitalize px-2 py-0.5 rounded-full text-xs text-white"
                  style={{ background: STATUS_COLORS[selectedSubject.status]?.border || '#aaa' }}
                >
                  {STATUS_COLORS[selectedSubject.status]?.label}
                </span>
              </div>
                            {selectedSubject.grade && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Grade</span>
                  <span className="font-bold text-[#085830]">{selectedSubject.grade}</span>
                </div>
              )}
            </div>

            {selectedSubject.prerequisites?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
             <p className="text-xs font-bold text-[#C25757] mb-2">Requires:</p>   
                <div className="space-y-1">
                  {selectedSubject.prerequisites.map((p: any) => {
                    const prereqSubject = allSubjects.find(s => s.id === p.required_subject_id);
                    return prereqSubject ? (
                      <div key={p.required_subject_id} className="flex items-center justify-between text-xs">
                       <span className="font-medium text-[#C25757]">{prereqSubject.code}</span> 
                        <span className="px-2 py-0.5 rounded-full text-white text-xs" style={{ background: STATUS_COLORS[prereqSubject.status]?.border || '#aaa' }}>
                          {STATUS_COLORS[prereqSubject.status]?.label}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {(() => {
              const unlocks = allSubjects.filter(s =>
                s.prerequisites?.some((p: any) => p.required_subject_id === selectedSubject.id)
              );
              return unlocks.length > 0 ? (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-[#28613D] mb-2">Unlocks:</p>
                  <div className="space-y-1">
                    {unlocks.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#28613D]">{s.code}</span>
                        <span className="px-2 py-0.5 rounded-full text-white text-xs" style={{ background: STATUS_COLORS[s.status]?.border || '#aaa' }}>
                          {STATUS_COLORS[s.status]?.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </Layout>
  );
}