import { Link, useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import logoImg from '../../imports/CurricuCheck_Logo.png';
import { useEffect } from 'react';



export function PrivacyNotice() {
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
  className="inline-flex items-center text-[#136537] font-medium hover:text-[#085830] transition-colors text-xl sm:text-2xl leading-none"
  aria-label="Go back"
>
  ←
</button>

  </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4] p-8 md:p-12">
          <h1 className="text-2xl font-bold text-[#085830] mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Last Updated: July 30, 2026</p>

          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
            <p>This Privacy Policy explains how CurricuCheck collects, uses, stores, and protects your personal data in accordance with the <strong className="text-[#085830]">Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Philippines.</p>
            <p>CurricuCheck is a thesis research prototype developed by students of the College of Engineering and Computer Technology at Wesleyan University-Philippines. This Notice applies to all users who create an account or use the system.</p>

            <Section title="1. Data Controller">
              <p>The personal information you provide is collected and processed by:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>David Joshua N. Borja</strong></li>
                <li><strong>Francisco M. Macapagal Jr.</strong></li>
                <li><strong>Lyn Andrei B. Saguiguit</strong></li>
                <li><strong>Omar H. Concepcion</strong></li>
              </ul>
              <p>Students of the College of Engineering and Computer Technology, Wesleyan University-Philippines ("the Researchers").</p>
              <p>Contact: <a href="mailto:curricucheck@gmail.com" className="text-[#136537] hover:underline">curricucheck@gmail.com</a></p>
            </Section>

            <Section title="2. Information We Collect">
              <p>When you register and use CurricuCheck, we collect the following:</p>
              <p><strong className="text-[#085830]">Account Information:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full name (last name, first name, middle name)</li>
                <li>Student ID number</li>
                <li>WUP email address</li>
                <li>Password (stored in encrypted form via Supabase Auth - the Researchers cannot view your password)</li>
              </ul>
              <p className="mt-2"><strong className="text-[#085830]">Academic Information:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Degree program and curriculum version</li>
                <li>Year level and preferred academic load</li>
                <li>Subject grades and academic records you input into the system</li>
                <li>Academic standing (computed from your records)</li>
              </ul>
              <p className="mt-2"><strong className="text-[#085830]">Usage Data:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Evaluation results (eligible, blocked, deferred subjects)</li>
                <li>Recommended and confirmed subject selections</li>
                <li>Advising summary exports (generated locally on your device - not stored on our servers)</li>
              </ul>
            </Section>

            <Section title="3. Purposes of Data Collection">
              <p>We collect your data solely for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide curriculum evaluation and subject recommendation features</li>
                <li>To authenticate your account and secure your session</li>
                <li>To generate your advising summary</li>
                <li>To fulfill the research objectives of the undergraduate thesis</li>
              </ul>
              <p>We do not use your data for commercial purposes, advertising, or any purpose beyond the scope of this thesis.</p>
            </Section>

            <Section title="4. Legal Basis for Processing">
              <p>We process your personal data based on:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Your consent</strong> - given when you check "I agree to the Terms of Service and Privacy Policy" during sign-up</li>
                <li><strong>Legitimate research interest</strong> - as part of an undergraduate thesis study conducted under academic supervision</li>
              </ul>
            </Section>

            <Section title="5. Where Your Data Is Stored">
              <p>Your data is stored on <strong className="text-[#085830]">Supabase</strong>, a cloud database platform hosted in Singapore. Supabase applies industry-standard security practices including encryption at rest and in transit.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Passwords are never stored in plaintext - they are managed by Supabase Auth using secure hashing.</li>
                <li>Access to the database is restricted to the Researchers only.</li>
                <li>Authentication uses JSON Web Tokens (JWT) to secure your session.</li>
              </ul>
              <p>While we take reasonable steps to protect your data, no system is completely secure. We encourage you to use a strong, unique password.</p>
            </Section>

            <Section title="6. Who Has Access to Your Data">
              <p>We do not sell, rent, or share your personal data with third parties, except:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supabase</strong> - as our database and authentication provider (data processor)</li>
                <li><strong>Anthropic (Claude API)</strong> - when you use the AI Grade Scanner feature, your uploaded grade table image is sent to Claude for processing. The image is not stored by us after processing. Please refer to Anthropic's Privacy Policy for how they handle API data.</li>
                <li><strong>Brevo (email service)</strong> - used to send OTP verification emails and advising summary PDFs to your registered email address</li>
              </ul>
              <p>We do not share your data with Wesleyan University-Philippines administrators, faculty, or staff.</p>
            </Section>

            <Section title="7. Data Retention and Deletion">
              <p>Your data will be retained only for the duration of the thesis evaluation period. After this period concludes, all student accounts and associated academic records will be permanently deleted from our database.</p>
              <p>You may also request deletion of your account at any time through the Student Information page within the system.</p>
            </Section>

            <Section title="8. Your Rights">
              <p>Under the Data Privacy Act of 2012, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Access</strong> - request a copy of the personal data we hold about you</li>
                <li><strong>Correction</strong> - update inaccurate information through the Student Information page</li>
                <li><strong>Erasure</strong> - delete your account and all associated data through the Student Information page</li>
                <li><strong>Withdraw Consent</strong> - stop using the system and request account deletion at any time</li>
                <li><strong>Lodge a Complaint</strong> - file a complaint with the National Privacy Commission (NPC) if you believe your rights have been violated</li>
              </ul>
              <p>To exercise your rights, contact us at <a href="mailto:curricucheck@gmail.com" className="text-[#136537] hover:underline">curricucheck@gmail.com</a>.</p>
            </Section>

            <Section title="9. Cookies and Local Storage">
              <p>CurricuCheck uses browser <strong>localStorage</strong> (not cookies) to temporarily store:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your authentication token (to keep you logged in)</li>
                <li>Your selected enrollment term and confirmed subjects (for the advising flow)</li>
              </ul>
              <p>This data is stored only on your device and is cleared when you log out or clear your browser storage.</p>
            </Section>

            <Section title="10. Changes to This Notice">
              <p>We may update this Privacy Policy as the system develops. Any material changes will be communicated through the system interface or via the contact email on file.</p>
            </Section>

            <Section title="11. Contact Us">
              <p>For any privacy-related concerns or requests, please contact us at:</p>
              <p><a href="mailto:curricucheck@gmail.com" className="text-[#136537] hover:underline font-medium">curricucheck@gmail.com</a></p>
            </Section>

            <div className="mt-8 p-4 bg-[#EEF7F2] rounded-xl border border-[#C8E6D4]">
              <p className="text-sm text-[#085830] font-medium">By using CurricuCheck, you acknowledge that you have read and understood this Privacy Policy and consent to the collection and processing of your personal data as described herein.</p>
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
      <h2 className="text-lg md:text-xl font-bold text-[#085830] mb-3">
  {title}
</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}