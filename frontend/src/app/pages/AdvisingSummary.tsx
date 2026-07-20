import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Check, AlertCircle, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  subject_type: string;
}

interface AdvisingSummaryData {
  summary: {
    total_units_passed: number;
    passed_count: number;
    failed_count: number;
    inc_count: number;
    passed_subjects: { code: string; name: string; units: number; grade: string }[];
    failed_subjects: { code: string; name: string; grade: string }[];
    inc_subjects: { code: string; name: string }[];
  };
}

export function AdvisingSummary() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const [summaryData, setSummaryData] = useState<AdvisingSummaryData | null>(null);
const [confirmedSubjects, setConfirmedSubjects] = useState<Subject[]>([]);
const [loading, setLoading] = useState(true);
const [sameSemesterDeferred, setSameSemesterDeferred] = useState<any[]>([]);

  const targetSemester = localStorage.getItem('target_semester') || '';
  const targetYearLevel = localStorage.getItem('target_year_level') || '';

  useEffect(() => {
    // Load confirmed subjects from localStorage
    const stored = localStorage.getItem('confirmed_subjects');
    if (stored) setConfirmedSubjects(JSON.parse(stored));

    // Fetch advising summary from backend
    const fetchSummary = async () => {
  try {
    const [summaryRes, evalRes] = await Promise.all([
      api.get('/evaluation/advising-summary', {
        params: {
          target_year_level: targetYearLevel,
          target_semester: targetSemester,
        },
      }),
      api.get('/evaluation/evaluate', {
        params: {
          target_year_level: targetYearLevel,
          target_semester: targetSemester,
        },
      }),
    ]);

    setSummaryData(summaryRes.data);

    const deferred = evalRes.data.evaluation.deferred || [];
    setSameSemesterDeferred(
      deferred.filter((s: any) => s.same_semester === true)
    );

  } catch (err) {
    console.error('Failed to load advising summary', err);
  } finally {
    setLoading(false);
  }
};

fetchSummary();
  }, []);

  const confirmedUnits = confirmedSubjects
    .filter((s) => s.subject_type !== 'nstp')
    .reduce((sum, s) => sum + s.units, 0);

  const getLoadLabel = (units: number) => {
    if (units <= 12) return 'Light';
    if (units <= 18) return 'Normal';
    return 'Heavy';
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(19, 101, 55);
    doc.text('CurricuCheck', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Advising Summary', 14, 29);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 34, 196, 34);

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 46);

    doc.setFont('helvetica', 'bold');
    doc.text('Student Name:', 14, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(`${student?.last_name}, ${student?.first_name}`, 45, 44);

    doc.setFont('helvetica', 'bold');
    doc.text('Degree Program:', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${student?.programs?.code} — Curriculum ${student?.curriculums?.version}`, 48, 50);

    doc.setFont('helvetica', 'bold');
    doc.text('Term:', 14, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(targetSemester, 28, 56);

    doc.setFont('helvetica', 'bold');
    doc.text('Academic Standing:', 110, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(student?.academic_standing || '', 148, 44);

    doc.setFont('helvetica', 'bold');
    doc.text('Preferred Load:', 110, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(localStorage.getItem('session_load') || student?.preferred_load || '', 141, 50);

    const tableData = confirmedSubjects.map((s) => [s.code, s.name, s.units.toString()]);
    tableData.push(['', 'Total Units:', confirmedUnits.toString()]);

    autoTable(doc, {
      startY: 64,
      head: [['Subject Code', 'Subject Name', 'Units']],
      body: tableData,
      headStyles: { fillColor: [19, 101, 55], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [238, 247, 242] },
      styles: { font: 'helvetica', fontSize: 10, textColor: [30, 30, 46] },
      didParseCell: (data: any) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 65;
    let yPos = finalY + 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(19, 101, 55);
    doc.text('Confirmed Enrollment:', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`\u2022 ${confirmedSubjects.length} subjects confirmed | ${confirmedUnits} units (${getLoadLabel(confirmedUnits)} load)`, 18, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const disclaimer = 'CurricuCheck is a decision support prototype and does not replace official academic advising, registrar evaluation, or enrollment approval. Always verify your final subject lineup with your designated academic adviser.';
    doc.text(doc.splitTextToSize(disclaimer, 182), 14, yPos);

    doc.save('CurricuCheck_Advising_Summary.pdf');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-500">Loading summary...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1000px] mx-auto">
       {/* Progress Indicator */}
<div className="mb-10 px-2 md:px-0">
  <div className="relative max-w-4xl mx-auto">

    <div className="absolute top-3 left-[12.5%] right-[12.5%] h-1 bg-gray-200 rounded-full z-0"></div>

    <div className="absolute top-3 left-[12.5%] w-[75%] h-1 bg-[#136537] rounded-full z-0"></div>

    <div className="grid grid-cols-4 relative z-10">

      {["Academic Records","Subject Eligibility","Recommendation"].map(label=>(
        <div key={label} className="flex flex-col items-center">
          <div className="w-6 h-6 rounded-full bg-[#136537] flex items-center justify-center text-white">
            <Check className="w-3 h-3"/>
          </div>

          <span className="mt-2 text-xs md:text-sm font-bold text-[#136537] text-center leading-tight">
            {label==="Academic Records" && <>Academic<br/>Records</>}
            {label==="Subject Eligibility" && <>Subject<br/>Eligibility</>}
            {label==="Recommendation" && <>Recommendation</>}
          </span>
        </div>
      ))}

      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-[#136537] border-4 border-white ring-2 ring-[#136537]/30"></div>

        <span className="mt-2 text-xs md:text-sm font-bold text-[#136537] text-center leading-tight">
          Advising<br/>Summary
        </span>
      </div>

    </div>
  </div>
</div>

        {/* Student Profile Card */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 p-8 mb-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Student Name</p>
                <p className="text-sm font-semibold text-[#085830]">{student?.last_name}, {student?.first_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Degree Program</p>
                <p className="text-sm font-semibold text-[#085830]">{student?.programs?.code}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Curriculum Version</p>
                <p className="text-sm font-semibold text-[#085830]">{student?.curriculums?.version}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Target Term</p>
                <p className="text-sm font-semibold text-[#085830]">{targetSemester}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Academic Standing</p>
                <p className="text-sm font-semibold text-[#085830] capitalize">{student?.academic_standing}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Preferred Academic Load</p>
                <p className="text-sm font-semibold text-[#085830] capitalize">
                  {localStorage.getItem('session_load') || student?.preferred_load}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmed Subjects Table */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden mb-6">
          <div className="px-8 py-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-[#085830]">Confirmed Subject Enrollment</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 bg-gray-50/30">
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-16 md:w-32">Code</th>
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm flex-1">Subject</th>
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-10 md:w-24 text-center">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {confirmedSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-2 md:px-6 py-4 md:py-8 text-center text-gray-400 text-xs md:text-sm">
                      No subjects confirmed.
                    </td>
                  </tr>
                ) : (
                  <>
                    {confirmedSubjects.map((s) => (
                      <tr key={s.id} className="hover:bg-[#EEF7F2]/30 transition-colors border-b border-gray-50 last:border-b-0">
                        <td className="px-2 md:px-6 py-2 md:py-4 font-semibold text-[#085830] text-xs md:text-sm">{s.code}</td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-gray-600 text-xs md:text-sm"><div className="line-clamp-2 md:line-clamp-none">{s.name}</div></td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-center text-gray-600 text-xs md:text-sm">{s.units}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#EEF7F2]/50 border-t-2 border-[#A8D5BB]">
                      <td className="px-2 md:px-6 py-2 md:py-4 font-bold text-[#085830] text-xs md:text-sm" colSpan={2}>Total Units:</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center font-bold text-[#136537] text-xs md:text-sm">{confirmedUnits}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advising Summary Notes */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 p-8 mb-6">
          <h2 className="text-lg font-bold text-[#085830] mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#136537]" />
            Advising Summary Notes
          </h2>
          <div className="space-y-6">
            <p className="text-sm italic text-gray-600 leading-relaxed">
              This advising summary was generated for {student?.last_name}, {student?.first_name} ({student?.programs?.code} — Curriculum {student?.curriculums?.version}) for {targetSemester}.
            </p>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#136537] mb-3">Academic Record Overview:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] mt-1.5 flex-shrink-0"></div>
                  <span><span className="font-semibold text-gray-700">Passed Subjects:</span> {summaryData?.summary.passed_count || 0}</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] mt-1.5 flex-shrink-0"></div>
                  <span><span className="font-semibold text-gray-700">Failed Subjects:</span> {summaryData?.summary.failed_count || 0}</span>
                </li>
                {(summaryData?.summary.inc_count || 0) > 0 && (
                  <li className="flex items-start gap-2.5 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></div>
                    <span><span className="font-semibold text-gray-700">INC Subjects:</span> {summaryData?.summary.inc_count} (must be resolved within 1 week at start of next semester)</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#136537] mb-3">Confirmed Enrollment:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] mt-1.5 flex-shrink-0"></div>
                  <span>{confirmedSubjects.length} subjects confirmed for enrollment</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] mt-1.5 flex-shrink-0"></div>
                  <span><span className="font-semibold text-gray-700">Total Units:</span> {confirmedUnits} ({getLoadLabel(confirmedUnits)} load)</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A8C957] mt-1.5 flex-shrink-0"></div>
                  <span><span className="font-semibold text-gray-700">Preferred Load:</span> <span className="capitalize">{localStorage.getItem('session_load') || student?.preferred_load}</span></span>
                </li>
              </ul>
            </div>

            {sameSemesterDeferred.length > 0 && (
  <div className="pt-6 border-t border-gray-100">
    <h3 className="text-sm font-bold text-[#136537] mb-3 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 text-amber-500" />
      Subjects for Adviser Consultation:
    </h3>

    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <p className="text-xs text-amber-700">
        The following subjects are offered this semester but belong to a
        different year level. These are not included in your confirmed
        enrollment — please consult your academic adviser to determine if
        you are eligible to enroll in them this term.
      </p>

      <ul className="space-y-2">
        {sameSemesterDeferred.map((s: any) => (
          <li
            key={s.id}
            className="flex items-start gap-2 text-xs text-amber-700"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1"></div>

            <span>
              <span className="font-semibold">{s.code}</span> — {s.name}

              <span className="text-amber-500 ml-1">
                ({s.units} units · {s.deferred_reason})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#136537] mb-3">Scope Disclaimer:</h3>
              <p className="text-xs text-gray-500 mt-2 italic">
          Please consult your academic adviser or program coordinator for available elective subjects this term. Below are the recommended professional elective courses for your program:
        </p>
        {student?.programs?.code === 'BSECE' && (
          <ul className="mt-2 space-y-1">
            {[
              'Advance Communication System Design',
              'Advance Networking ICT Infrastructure',
              'Electronics Auxiliary System',
              'Computer System Architecture',
              'Operating System & Advance Programming Language',
              'Broadcasting Production Engineering',
              'Broadcast Transmission Distribution',
              'Emerging Technologies',
            ].map((elective) => (
              <li key={elective} className="text-xs text-[#085830] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] flex-shrink-0"></div>
                {elective}
              </li>
            ))}
          </ul>
        )}
        {student?.programs?.code === 'BSIT' && (
          <ul className="mt-2 space-y-1">
            {[
              'Computer Graphics',
              'White Hat Hacking',
              'CISCO 3',
              'CISCO 4',
              'Animation and Game Development',
              'Advanced 2D Game Development',
              'Advanced 3D Game Development',
              'Web Services',
              'Basic Android App Development',
              'Advanced Android App Development',
              'Fundamentals of Business Analytics',
              'Fundamentals of Enterprise Data Management',
              'Descriptive Analytics (IBM Cognos)',
              'Predictive Analytics (IBM SPSS)',
              'Advanced Web Technologies',
              'Cross Platform Development',
              'Advanced Topic in IAS',
              'Cyber Security',
              'Advanced Special Topics',
            ].map((elective) => (
              <li key={elective} className="text-xs text-[#085830] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] flex-shrink-0"></div>
                {elective}
              </li>
            ))}
          </ul>
        )}
        {student?.programs?.code === 'BSCpE' && (
          <ul className="mt-2 space-y-1">
            {[
              'Software Development 1 (ELECT1)',
              'Software Development 2 (ELECT2)',
              'Software Development 3 (ELECT3)',
            ].map((elective) => (
              <li key={elective} className="text-xs text-[#085830] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] flex-shrink-0"></div>
                {elective}
              </li>
            ))}
          </ul>
        )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-8 mt-12 mb-8">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-3 px-10 py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <FileDown className="w-5 h-5" />
            Export to PDF
          </button>
          <div className="w-full border-t border-[#C8E6D4]/50 pt-8 flex justify-between items-center px-4">
            <Link to="/dashboard/recommendations" className="text-gray-500 font-medium text-sm hover:text-[#136537] transition-colors">
              &lt; Recommendations
            </Link>
            <Link to="/dashboard" className="text-gray-500 font-medium text-sm hover:text-[#136537] transition-colors">
              Return to Dashboard &gt;
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}