import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Check, AlertCircle, FileDown, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../../imports/CurricuCheck_Logo.png';

interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  subject_type: string;
  is_elective: boolean;
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

const ELECTIVE_OPTIONS: Record<string, string[]> = {
  BSECE: [
    'Advance Communication System Design',
    'Advance Networking ICT Infrastructure',
    'Electronics Auxiliary System',
    'Computer System Architecture',
    'Operating System & Advance Programming Language',
    'Broadcasting Production Engineering',
    'Broadcast Transmission Distribution',
    'Emerging Technologies',
  ],
  BSIT: [
    'Computer Graphics', 'White Hat Hacking', 'CISCO 3', 'CISCO 4',
    'Animation and Game Development', 'Advanced 2D Game Development',
    'Advanced 3D Game Development', 'Web Services',
    'Basic Android App Development', 'Advanced Android App Development',
    'Fundamentals of Business Analytics',
    'Fundamentals of Enterprise Data Management',
    'Descriptive Analytics (IBM Cognos)', 'Predictive Analytics (IBM SPSS)',
    'Advanced Web Technologies', 'Cross Platform Development',
    'Advanced Topic in IAS', 'Cyber Security', 'Advanced Special Topics',
  ],
  BSCpE: [
    'Software Development 1 (ELECT1)',
    'Software Development 2 (ELECT2)',
    'Software Development 3 (ELECT3)',
  ],
};

export function AdvisingSummary() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const [summaryData, setSummaryData] = useState<AdvisingSummaryData | null>(null);
  const [confirmedSubjects, setConfirmedSubjects] = useState<Subject[]>([]);
  const [sameSemesterDeferred, setSameSemesterDeferred] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const targetSemester = localStorage.getItem('target_semester') || '';
  const targetYearLevel = localStorage.getItem('target_year_level') || '';

  const [sendingEmail, setSendingEmail] = useState(false);
const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('confirmed_subjects');
    if (stored) setConfirmedSubjects(JSON.parse(stored));

    const fetchData = async () => {
      try {
        const [summaryRes, evalRes] = await Promise.all([
          api.get('/evaluation/advising-summary', {
            params: { target_year_level: targetYearLevel, target_semester: targetSemester },
          }),
          api.get('/evaluation/evaluate', {
            params: { target_year_level: targetYearLevel, target_semester: targetSemester },
          }),
        ]);

        setSummaryData(summaryRes.data);

        const deferred = evalRes.data.evaluation.deferred || [];
        setSameSemesterDeferred(deferred.filter((s: any) =>
          s.same_semester === true || s.is_retake === true
        ));
      } catch (err) {
        console.error('Failed to load advising summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const confirmedUnits = confirmedSubjects
    .filter((s) => s.subject_type !== 'nstp')
    .reduce((sum, s) => sum + s.units, 0);

  const getLoadLabel = (units: number) => {
    if (units <= 12) return 'Light';
    if (units <= 18) return 'Normal';
    return 'Heavy';
  };

  const hasElectives = confirmedSubjects.some((s) => s.is_elective);
  const programCode = student?.programs?.code || '';
  const sessionLoad = localStorage.getItem('session_load') || student?.preferred_load || '';

  // ── PDF HELPERS ──
  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN = 14;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const HEADER_H = 18;
  const FOOTER_H = 14;
  const CONTENT_TOP = MARGIN + HEADER_H + 4;
  const CONTENT_BOTTOM = PAGE_HEIGHT - FOOTER_H - 8;

const addHeader = (doc: jsPDF, pageNum: number) => {
  // Green header bar
  doc.setFillColor(19, 101, 55);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_H, 'F');

  // Logo
  const logoWidth = 11;
  const logoHeight = 11;
  doc.addImage(logoImg, 'PNG', MARGIN, 4, logoWidth, logoHeight);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CurricuCheck', MARGIN + 15, 11.5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Advising Summary', MARGIN + 60, 11.5);

  // Page Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Page ${pageNum}`, PAGE_WIDTH - MARGIN, 11.5, {
    align: 'right',
  });
};

  const addFooter = (doc: jsPDF) => {
    // Footer line
    doc.setDrawColor(19, 101, 55);
    doc.line(MARGIN, PAGE_HEIGHT - FOOTER_H, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - FOOTER_H);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'CurricuCheck',
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - FOOTER_H + 5,
      { align: 'center' }
    );
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - FOOTER_H + 10,
      { align: 'center' }
    );
  };

  const checkNewPage = (doc: jsPDF, yPos: number, pageNum: { value: number }, neededSpace = 10): number => {
    if (yPos + neededSpace > CONTENT_BOTTOM) {
      addFooter(doc);
      doc.addPage();
      pageNum.value += 1;
      addHeader(doc, pageNum.value);
      return CONTENT_TOP;
    }
    return yPos;
  };

  const buildPDF = () => {
    const doc = new jsPDF();
    const pageNum = { value: 1 };

    // ── PAGE 1 HEADER ──
    addHeader(doc, pageNum.value);
    let yPos = CONTENT_TOP;

    autoTable(doc, {
  startY: yPos,
  theme: 'grid',
  head: [['Student Information', '']],
  body: [
    ['Student Name', `${student?.last_name}, ${student?.first_name}`],
    ['Degree Program', `${student?.programs?.code} - Curriculum ${student?.curriculums?.version}`],
    ['Term', targetSemester],
    ['Academic Standing', student?.academic_standing || ''],
    ['Preferred Load', sessionLoad],
  ],
  headStyles: {
    fillColor: [19, 101, 55],
    textColor: 255,
    fontStyle: 'bold',
    halign: 'left',
  },
  styles: {
    font: 'helvetica',
    fontSize: 9,
    textColor: [8, 88, 48],
    cellPadding: 3,
  },
  columnStyles: {
    0: {
      cellWidth: 50,
      fontStyle: 'bold',
      fillColor: [238, 247, 242],
    },
    1: {
      cellWidth: CONTENT_WIDTH - 50,
    },
  },
  margin: {
    left: MARGIN,
    right: MARGIN,
  },
});

yPos = (doc as any).lastAutoTable.finalY + 12;

    // ── CONFIRMED SUBJECTS TABLE ──
    const tableData = confirmedSubjects.map((s) => [s.code, s.name, s.units.toString()]);
    tableData.push(['', 'Total Units:', confirmedUnits.toString()]);

    autoTable(doc, {
      startY: yPos,
      head: [['Subject Code', 'Subject Name', 'Units']],
      body: tableData,
      headStyles: { fillColor: [19, 101, 55], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [238, 247, 242] },
      styles: { font: 'helvetica', fontSize: 9, textColor: [8, 88, 48] },
      columnStyles: { 0: { cellWidth: 35 }, 2: { cellWidth: 20, halign: 'center' } },
      margin: { left: MARGIN, right: MARGIN },
      didParseCell: (data: any) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [200, 230, 212];
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 18;

    // ── ADVISING SUMMARY NOTES HEADER ──
    yPos = checkNewPage(doc, yPos, pageNum, 20);
    doc.setFillColor(19, 101, 55);
    doc.rect(MARGIN, yPos, CONTENT_WIDTH, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Advising Summary Notes', MARGIN + 3, yPos + 5.5);
    yPos += 12;

    // ── GENERATED FOR ──
    yPos = checkNewPage(doc, yPos, pageNum, 12);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const generatedText = `This advising summary was generated for ${student?.last_name}, ${student?.first_name} (${student?.programs?.code} - Curriculum ${student?.curriculums?.version}) for ${targetSemester}.`;
    const generatedLines = doc.splitTextToSize(generatedText, CONTENT_WIDTH);
    doc.text(generatedLines, MARGIN, yPos);
    yPos += generatedLines.length * 5 + 8;

    // ── ACADEMIC RECORD OVERVIEW ──
    yPos = checkNewPage(doc, yPos, pageNum, 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(19, 101, 55);
    doc.text('Academic Record Overview:', MARGIN, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`\u2022 Passed Subjects: ${summaryData?.summary.passed_count || 0}`, MARGIN + 4, yPos); yPos += 5;
    doc.text(`\u2022 Failed Subjects: ${summaryData?.summary.failed_count || 0}`, MARGIN + 4, yPos); yPos += 5;
    if ((summaryData?.summary.inc_count || 0) > 0) {
      const incText = `\u2022 INC Subjects: ${summaryData?.summary.inc_count} (must be resolved within 1 week at start of next semester)`;
      const incLines = doc.splitTextToSize(incText, CONTENT_WIDTH - 4);
      doc.text(incLines, MARGIN + 4, yPos);
      yPos += incLines.length * 5;
    }
    yPos += 8;

    // ── CONFIRMED ENROLLMENT ──
    yPos = checkNewPage(doc, yPos, pageNum, 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(19, 101, 55);
    doc.text('Confirmed Enrollment:', MARGIN, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`\u2022 ${confirmedSubjects.length} subjects confirmed for enrollment`, MARGIN + 4, yPos); yPos += 5;
    doc.text(`\u2022 Total Units: ${confirmedUnits} (${getLoadLabel(confirmedUnits)} load)`, MARGIN + 4, yPos); yPos += 5;
    doc.text(`\u2022 Preferred Load: ${sessionLoad}`, MARGIN + 4, yPos); yPos += 14;

    // ── SUBJECTS FOR ADVISER CONSULTATION ──
    if (sameSemesterDeferred.length > 0) {
      yPos = checkNewPage(doc, yPos, pageNum, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(19, 101, 55);
      doc.text('Subjects for Adviser Consultation:', MARGIN, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const consultNote = 'The following subjects are offered this semester but belong to a different year level or were previously failed. These are not included in your confirmed enrollment - please consult your academic adviser.';
      const consultLines = doc.splitTextToSize(consultNote, CONTENT_WIDTH);
      doc.text(consultLines, MARGIN, yPos);
      yPos += consultLines.length * 4 + 4;

      sameSemesterDeferred.forEach((s: any) => {
        yPos = checkNewPage(doc, yPos, pageNum, 8);
        const label = s.same_semester
          ? 'Available this semester'
          : 'Previously failed - not offered this semester';
        const line = `\u2022 ${s.code} - ${s.name} (${s.units} units · ${label})`;
        const lines = doc.splitTextToSize(line, CONTENT_WIDTH - 4);
        doc.text(lines, MARGIN + 4, yPos);
        yPos += lines.length * 5;
      });
      yPos += 5;
    }

    // ── ELECTIVE DISCLAIMER (only if has electives) ──
    if (hasElectives) {
      yPos = checkNewPage(doc, yPos, pageNum, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(19, 101, 55);
      doc.text('Elective Subjects:', MARGIN, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const electiveNote = 'Please consult your academic adviser or program coordinator for available elective subjects this term. Below are the recommended professional elective courses for your program:';
      const electiveNoteLines = doc.splitTextToSize(electiveNote, CONTENT_WIDTH);
      doc.text(electiveNoteLines, MARGIN, yPos);
      yPos += electiveNoteLines.length * 4 + 4;

      const options = ELECTIVE_OPTIONS[programCode] || [];
      options.forEach((opt) => {
        yPos = checkNewPage(doc, yPos, pageNum, 6);
        doc.text(`\u2022 ${opt}`, MARGIN + 4, yPos);
        yPos += 5;
      });
      yPos += 5;
    }

    // ── SCOPE DISCLAIMER ──
    yPos = checkNewPage(doc, yPos, pageNum, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(19, 101, 55);
    doc.text('Scope Disclaimer:', MARGIN, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const disclaimer = 'CurricuCheck is a decision support prototype and does not replace official academic advising, registrar evaluation, or enrollment approval. Always verify your final subject lineup with your designated academic adviser.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, CONTENT_WIDTH);
    doc.text(disclaimerLines, MARGIN, yPos);

    // ── FOOTER ON ALL PAGES ──
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc);
    }

    return doc;
  };
    const handleExportPDF = () => {
    const doc = buildPDF();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } else {
      doc.save('CurricuCheck_Advising_Summary.pdf');
    }
  };
    

    
  const handleSendToEmail = async () => {
    setSendingEmail(true);

    try {
      const doc = buildPDF();
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      await api.post('/student/me/send-advising-pdf', {
        pdf_base64: pdfBase64,
        target_semester: targetSemester,
      });

      setEmailSent(true);
    } catch (err) {
      console.error('Failed to send PDF to email:', err);
    } finally {
      setSendingEmail(false);
    }
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
                  {sessionLoad}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmed Subjects Table */}
<div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 overflow-hidden mb-6">
  <div className="px-8 py-6 border-b border-gray-100">
    <h3 className="text-lg font-bold text-[#085830]">
      Confirmed Subject Enrollment
    </h3>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-gray-500 border-b border-gray-100 bg-gray-50/30">
          <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-16 md:w-32">
            Code
          </th>
          <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm flex-1">
            Subject
          </th>
          <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-xs md:text-sm w-10 md:w-24 text-center">
            Units
          </th>
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
                <td className="px-2 md:px-6 py-2 md:py-4 font-semibold text-[#085830] text-xs md:text-sm">
                  {s.code}
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 text-gray-600 text-xs md:text-sm">
                  <div className="line-clamp-2 md:line-clamp-none">
                    {s.name}
                  </div>
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 text-center text-gray-600 text-xs md:text-sm">
                  {s.units}
                </td>
              </tr>
            ))}

            <tr className="bg-[#EEF7F2]/50 border-t-2 border-[#A8D5BB]">
              <td
                className="px-2 md:px-6 py-2 md:py-4 font-bold text-[#085830] text-xs md:text-sm"
                colSpan={2}
              >
                Total Units:
              </td>
              <td className="px-2 md:px-6 py-2 md:py-4 text-center font-bold text-[#136537] text-xs md:text-sm">
                {confirmedUnits}
              </td>
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
              This advising summary was generated for {student?.last_name}, {student?.first_name} ({student?.programs?.code} - Curriculum {student?.curriculums?.version}) for {targetSemester}.
            </p>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#136537] mb-3">Academic Record Overview:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A8C957] mt-1.5 flex-shrink-0"></div>
                  <span><span className="font-semibold text-gray-700">Passed Subjects:</span> {summaryData?.summary.passed_count || 0}</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A8C957] mt-1.5 flex-shrink-0"></div>
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
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A8C957] mt-1.5 flex-shrink-0"></div>
                  <span>{confirmedSubjects.length} subjects confirmed for enrollment</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A8C957] mt-1.5 flex-shrink-0"></div>
                  <span><span className="font-semibold text-gray-700">Total Units:</span> {confirmedUnits} ({getLoadLabel(confirmedUnits)} load)</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A8C957] mt-1.5 flex-shrink-0"></div>
                  <span><span className="font-semibold text-gray-700">Preferred Load:</span> <span className="capitalize">{sessionLoad}</span></span>
                </li>
              </ul>
            </div>

            {/* Subjects for Adviser Consultation */}
            {sameSemesterDeferred.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-[#136537] mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Subjects for Adviser Consultation:
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-amber-700">
                    The following subjects are offered this semester but belong to a different year level or were previously failed.
                    These are not included in your confirmed enrollment - please consult your academic adviser to determine if you are eligible to enroll in them this term.
                  </p>
                  <ul className="space-y-2">
                    {sameSemesterDeferred.map((s: any) => (
                      <li key={s.id} className="flex items-start gap-2 text-xs text-amber-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1"></div>
                        <span>
                          <span className="font-semibold">{s.code}</span> - {s.name}
                          <span className="text-amber-500 ml-1">
                            ({s.units} units ·{' '}
                            {s.same_semester
                              ? 'Available this semester'
                              : 'Previously failed - not offered this semester'}
                            )
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Elective Subjects — only if has electives */}
            {hasElectives && (
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-[#136537] mb-3">Elective Subjects:</h3>
                <div className="bg-[#EEF7F2] border border-[#C8E6D4] rounded-xl p-4 space-y-3">
                  <p className="text-xs text-[#085830]">
                    Please consult your academic adviser or program coordinator for available elective subjects this term. Below are the recommended professional elective courses for your program:
                  </p>
                  <ul className="space-y-1.5">
                    {(ELECTIVE_OPTIONS[programCode] || []).map((elective) => (
                      <li key={elective} className="flex items-center gap-2 text-xs text-[#085830]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F2AB50] flex-shrink-0"></div>
                        {elective}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#136537] mb-3">Scope Disclaimer:</h3>
              <p className="text-xs italic text-gray-500 leading-relaxed">
                CurricuCheck is a decision support prototype and does not replace official academic advising, registrar evaluation, or enrollment approval. Always verify your final subject lineup with your designated academic adviser.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-8 mt-12 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <button
              onClick={handleExportPDF}
              className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <FileDown className="w-5 h-5" />
              <span className="hidden md:inline">Download PDF</span>
              <span className="md:hidden">View PDF</span>
            </button>
            <button
  onClick={handleSendToEmail}
  disabled={sendingEmail}
  className="w-[220px] sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
>
  <Mail className="w-5 h-5" />
  {sendingEmail
    ? 'Sending...'
    : emailSent
    ? 'Sent to Email ✓'
    : 'Send to My Email'}
</button>
          </div>
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