import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImg from '../../imports/CurricuCheck_Logo.png';
import { ChevronDown, LogOut, HelpCircle, Info, LayoutDashboard, ListChecks, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { student, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-all ${
      location.pathname === path
        ? 'bg-gradient-to-r from-[#085830] to-[#A8C957] text-white shadow-sm'
        : 'text-gray-600 hover:bg-[#EEF7F2] hover:text-[#136537]'
    }`;

  return (
    <div className="min-h-screen bg-[#F5FAF7] font-['Inter'] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#C8E6D4]/50 shadow-[4px_0_24px_rgb(0,0,0,0.02)] flex flex-col z-10 flex-shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
              <ImageWithFallback src={logoImg} alt="CurricuCheck Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg text-[#085830] tracking-tight">CurricuCheck</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <Link to="/dashboard" className={navLinkClass('/dashboard')}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/dashboard/checklist" className={navLinkClass('/dashboard/checklist')}>
            <ListChecks className="w-5 h-5" />
            Curriculum Checklist
          </Link>
          <Link to="/dashboard/student-info" className={navLinkClass('/dashboard/student-info')}>
            <User className="w-5 h-5" />
            Student Information
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <header className="h-20 bg-white/50 backdrop-blur-sm border-b border-[#C8E6D4]/50 px-8 flex items-center justify-end z-20 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 text-left focus:outline-none hover:bg-white/60 p-2 rounded-xl transition-colors"
            >
              <div className="text-right">
                <div className="text-sm font-bold text-[#085830]">
                  {student ? `${student.last_name}, ${student.first_name}` : 'Loading...'}
                </div>
                <div className="text-xs text-gray-500">
                  {student?.programs?.code} — Curriculum {student?.curriculums?.version}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#C8E6D4]/50 py-2 z-50">
                {!student && (
                  <>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#EEF7F2] hover:text-[#136537] transition-colors flex items-center gap-2">
                      <Info className="w-4 h-4" /> About CurricuCheck
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#EEF7F2] hover:text-[#136537] transition-colors flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" /> Help
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}