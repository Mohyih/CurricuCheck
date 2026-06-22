import { 
  FileText, Cpu, CheckCircle2, Lightbulb, 
  CheckCircle, XCircle, Star, Clock, UserCog,
  BatteryLow, BatteryMedium, BatteryFull,
  BookMarked, AlertTriangle
} from "lucide-react";

export function Help() {
  return (
    <section id="help" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5FAF7]">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#085830]">Help & Documentation</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#085830] to-[#A8C957] mx-auto rounded-full"></div>
        </div>

        {/* How it Works */}
        <div className="space-y-8">
          <h3 className="text-2xl font-semibold text-[#085830] text-center">How CurricuCheck Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm text-center relative">
              <div className="w-12 h-12 bg-[#EEF7F2] rounded-full flex items-center justify-center text-[#136537] mx-auto mb-4">
                <FileText size={24} />
              </div>
              <h4 className="font-semibold text-[#085830] mb-2">1. Add Records</h4>
              <p className="text-sm text-gray-600">Input your current academic records and grades.</p>
              
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm text-center relative">
              <div className="w-12 h-12 bg-[#EEF7F2] rounded-full flex items-center justify-center text-[#136537] mx-auto mb-4">
                <Cpu size={24} />
              </div>
              <h4 className="font-semibold text-[#085830] mb-2">2. Evaluation</h4>
              <p className="text-sm text-gray-600">System evaluates your prerequisite compliance.</p>
              
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm text-center relative">
              <div className="w-12 h-12 bg-[#EEF7F2] rounded-full flex items-center justify-center text-[#136537] mx-auto mb-4">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="font-semibold text-[#085830] mb-2">3. Eligibility</h4>
              <p className="text-sm text-gray-600">Eligible subjects are identified automatically.</p>
              
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
              <div className="w-12 h-12 bg-[#EEF7F2] rounded-full flex items-center justify-center text-[#136537] mx-auto mb-4">
                <Lightbulb size={24} />
              </div>
              <h4 className="font-semibold text-[#085830] mb-2">4. Recommendations</h4>
              <p className="text-sm text-gray-600">Receive structured subject recommendations.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Meaning of Results */}
          <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-xl font-semibold text-[#085830] border-b border-gray-100 pb-4">Meaning of Results</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <span className="font-medium text-[#085830]">Eligible:</span>
                  <p className="text-sm text-gray-600">All prerequisites are met. You can take this subject.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <span className="font-medium text-[#085830]">Ineligible:</span>
                  <p className="text-sm text-gray-600">Missing prerequisites or academic requirements.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Star className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <span className="font-medium text-[#085830]">Recommended:</span>
                  <p className="text-sm text-gray-600">Highly suggested based on your academic progression.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <span className="font-medium text-[#085830]">Deferred:</span>
                  <p className="text-sm text-gray-600">Subject is pushed back to prioritize missing prerequisites.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <UserCog className="text-[#136537] shrink-0 mt-0.5" size={20} />
                <div>
                  <span className="font-medium text-[#085830]">Requires Adviser Review:</span>
                  <p className="text-sm text-gray-600">Special case needing official registrar or adviser clearance.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-8">
            {/* Academic Load Options */}
            <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
              <h3 className="text-xl font-semibold text-[#085830] border-b border-gray-100 pb-4">Academic Load Options</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BatteryLow className="text-green-500" size={24} />
                  <div>
                    <span className="font-medium text-[#085830]">Light:</span>
                    <span className="text-sm text-gray-600 ml-2">Fewer units, balanced for working students.</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BatteryMedium className="text-blue-500" size={24} />
                  <div>
                    <span className="font-medium text-[#085830]">Standard:</span>
                    <span className="text-sm text-gray-600 ml-2">Regular unit load per semester.</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BatteryFull className="text-red-500" size={24} />
                  <div>
                    <span className="font-medium text-[#085830]">Heavy:</span>
                    <span className="text-sm text-gray-600 ml-2">Maximum allowed units for faster completion.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Version */}
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <BookMarked className="text-[#136537]" size={24} />
                <h3 className="text-xl font-semibold text-[#085830]">Curriculum Version</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">
                Ensure you select the correct curriculum version (e.g., 2020, 2023) corresponding to your enrollment year. Prerequisites and subjects may differ between versions.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-start">
          <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Scope Disclaimer</h4>
            <p className="text-sm text-yellow-700 leading-relaxed">
              CurricuCheck is a decision support prototype and does not replace official academic advising, registrar evaluation, or enrollment approval. Always verify your final subject lineup with your designated academic adviser.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
