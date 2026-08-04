import { Link, useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import logoImg from '../../imports/CurricuCheck_Logo.png';
import { useEffect } from 'react';






export function TermsOfService() {
  const navigate = useNavigate();
  useEffect(() => {
  window.scrollTo(0, 0);
}, []);

  return (
    <div className="min-h-screen bg-[#F5FAF7] font-['Inter']">
  {/* Nav */}
  <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#C8E6D4] px-4 sm:px-6 py-4 flex items-center justify-between">
    
    {/* Logo - Go Back instead of Home */}
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 hover:opacity-90 transition-opacity"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden">
        <ImageWithFallback
          src={logoImg}
          alt="CurricuCheck Logo"
          className="w-full h-full object-cover"
        />
      </div>
      <span className="font-bold text-base sm:text-lg text-[#085830] tracking-tight">
        CurricuCheck
      </span>
    </button>

    {/* Back Button */}
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="text-sm text-[#136537] font-medium hover:underline"
    >
      ←
    </button>

  </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4] p-8 md:p-12">
          <h1 className="text-2xl font-bold text-[#085830] mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-8">Last Updated: July 30, 2026</p>

          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
            <p>Welcome to CurricuCheck. Please read these Terms of Service ("Terms") carefully before creating an account or using this system.</p>
            <p>CurricuCheck is a thesis research prototype developed by <strong className="text-[#085830]">David Joshua N. Borja, Francisco M. Macapagal Jr., Lyn Andrei B. Saguiguit, and Omar H. Concepcion</strong> ("the Researchers," "we," "us," "our"), students of the College of Engineering and Computer Technology at Wesleyan University-Philippines, in fulfillment of their undergraduate thesis requirements.</p>
            <p>By creating an account or using CurricuCheck, you agree to be bound by these Terms. If you do not agree, please do not use the system.</p>

            <Section title="1. Nature of the System">
              <p>CurricuCheck is an academic decision support system for curriculum evaluation and subject recommendation. It is currently a working prototype developed for thesis evaluation purposes and is not an official system of Wesleyan University-Philippines. The university does not currently have administrative access to, or control over, the system or the data it collects.</p>
              <p>CurricuCheck evaluates student academic records using rule-based logic to classify subject eligibility (Eligible, Blocked, Deferred) and generate subject recommendations. Outputs from the system are advisory only and do not constitute an official academic record, official enrollment decision, or substitute for consultation with your program coordinator or the university registrar.</p>
            </Section>

            <Section title="2. Eligibility to Use">
              <p>CurricuCheck is intended for use by students participating in this thesis study. By signing up, you confirm that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are voluntarily providing your information for the purpose of evaluating this system.</li>
                <li>The academic information you provide is accurate to the best of your knowledge.</li>
                <li>You understand this system is a prototype and its outputs are for research and demonstration purposes.</li>
              </ul>
            </Section>

            <Section title="3. Account Responsibilities">
              <p>You are responsible for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Providing accurate information (name, student number, email, and academic records) when creating an account.</li>
                <li>Keeping your password confidential. The Researchers will never ask for your password.</li>
                <li>Notifying us at <a href="mailto:curricucheck@gmail.com" className="text-[#136537] hover:underline">curricucheck@gmail.com</a> if you suspect unauthorized access to your account.</li>
              </ul>
            </Section>

            <Section title="4. Data Handling">
              <p>Your use of CurricuCheck is also governed by our <Link to="/privacy-notice" className="text-[#136537] hover:underline font-medium">Privacy Notice</Link>, which explains what data we collect, how it is stored, how long it is kept, and your rights over it under the Data Privacy Act of 2012 (RA 10173). Please review it before signing up.</p>
            </Section>

            <Section title="5. No Warranty">
              <p>CurricuCheck is provided "as is," as a research prototype. The Researchers make no guarantee that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The system will be available at all times without interruption or error.</li>
                <li>Eligibility classifications or recommendations are free of error or omission.</li>
                <li>The system will remain accessible after the conclusion of the thesis evaluation period.</li>
              </ul>
              <p>You should always verify subject eligibility and enrollment decisions with your official program coordinator or registrar.</p>
            </Section>

            <Section title="6. Limitation of Liability">
              <p>To the extent permitted by law, the Researchers shall not be held liable for any decision made, or action taken, solely on the basis of outputs generated by CurricuCheck, including but not limited to enrollment planning decisions.</p>
            </Section>

            <Section title="7. Data Retention and Deletion">
              <p>Data submitted to CurricuCheck is retained only for the duration of the thesis evaluation period. Once this period concludes, all student data will be permanently deleted from our database, as described in our Privacy Notice.</p>
            </Section>

            <Section title="8. Changes to These Terms">
              <p>Because CurricuCheck is an active thesis project, these Terms may be updated as the system develops. Material changes will be communicated through the system or through the contact email on file.</p>
            </Section>

            <Section title="9. Contact">
              <p>For questions, concerns, or requests related to these Terms, please contact:</p>
              <p><a href="mailto:curricucheck@gmail.com" className="text-[#136537] hover:underline font-medium">curricucheck@gmail.com</a></p>
            </Section>

            <div className="mt-8 p-4 bg-[#EEF7F2] rounded-xl border border-[#C8E6D4]">
              <p className="text-sm text-[#085830] font-medium">By checking "I agree to the Terms of Service and Privacy Notice" during sign-up, you acknowledge that you have read, understood, and agreed to this Terms of Service.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-[#085830] mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}