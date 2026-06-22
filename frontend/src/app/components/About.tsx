import { Info, Target, ShieldAlert, Users, Code2 } from "lucide-react";

export function About() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#085830]">About CurricuCheck</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#085830] to-[#A8C957] mx-auto rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#F5FAF7] p-8 rounded-2xl shadow-sm space-y-4 border border-[#C8E6D4]">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#136537] shadow-sm mb-6">
              <Info size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[#085830]">System Overview</h3>
            <p className="text-gray-600 leading-relaxed">
              CurricuCheck is a web-based academic decision support system designed to assist students in evaluating curriculum progress, checking subject eligibility, and generating subject recommendations based on academic records and curriculum requirements.
            </p>
          </div>

          <div className="bg-[#F5FAF7] p-8 rounded-2xl shadow-sm space-y-4 border border-[#C8E6D4]">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#136537] shadow-sm mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[#085830]">Purpose</h3>
            <ul className="space-y-3 text-gray-600">
  <li className="flex items-center gap-3">
    <span className="text-[#F2AB50] text-xl leading-none">•</span> 
    Supports irregular students
  </li>
  <li className="flex items-center gap-3">
    <span className="text-[#F2AB50] text-xl leading-none">•</span> 
    Reduces prerequisite confusion
  </li>
  <li className="flex items-center gap-3">
    <span className="text-[#F2AB50] text-xl leading-none">•</span> 
    Simplifies curriculum evaluation
  </li>
  <li className="flex items-center gap-3">
    <span className="text-[#F2AB50] text-xl leading-none">•</span> 
    Provides structured advising assistance
  </li>
</ul>
          </div>
        </div>

        <div className="bg-[#EEF7F2]/50 p-8 rounded-2xl border border-[#C8E6D4] flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#136537] shadow-sm shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#085830] mb-2">Scope Clarification</h3>
            <p className="text-gray-600 leading-relaxed">
              The system is intended as a decision support tool and does not replace official academic advising, registrar evaluation, or enrollment approval processes.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-[#136537]" size={28} />
              <h3 className="text-2xl font-semibold text-[#085830]">Development Team</h3>
            </div>
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <p className="text-sm font-medium text-[#136537] mb-4 uppercase tracking-wider">Bachelor of Science in Computer Engineering</p>
              <p className="text-sm text-gray-500 mb-6">Wesleyan University-Philippines</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="font-medium text-[#085830]">David Borja</span>
                  <span className="text-sm text-gray-500">System Analyst</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="font-medium text-[#085830]">Lyn Andrei Saguiguit</span>
                  <span className="text-sm text-gray-500">Frontend Developer</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="font-medium text-[#085830]">Francisco Macapagal Jr</span>
                  <span className="text-sm text-gray-500">Backend Developer</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-medium text-[#085830]">Omar Concepcion</span>
                  <span className="text-sm text-gray-500">Technical Lead</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Code2 className="text-[#136537]" size={28} />
              <h3 className="text-2xl font-semibold text-[#085830]">Technologies Used</h3>
            </div>
            <div className="flex flex-wrap gap-3">
  {['Node.js', 'Express', 'Supabase', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind CSS', 'Vite'].map((tech) => (
    <div key={tech} className="px-6 py-3 bg-[#F5FAF7] text-[#136537] rounded-full font-medium shadow-sm border border-[#C8E6D4]">
      {tech}
    </div>
  ))}
</div>
          </div>
        </div>
      </div>
    </section>
  );
}
