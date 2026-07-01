import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImg from '../../imports/CurricuCheck_Logo.png';
import { ChevronDown, LogOut, HelpCircle, Info, LayoutDashboard, ListChecks, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center px-6 border-b border-[#C8E6D4]">
        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate('/dashboard');
          }}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
            <ImageWithFallback src={logoImg} alt="CurricuCheck Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg text-[#085830] tracking-tight">CurricuCheck</span>
        </button>
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-1">Main</div>
        <Link to="/dashboard" className={navLinkClass('/dashboard')} onClick={() => setIsSidebarOpen(false)}>
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>

        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mt-4 mb-1">Academic</div>
        <Link to="/dashboard/checklist" className={navLinkClass('/dashboard/checklist')} onClick={() => setIsSidebarOpen(false)}>
          <ListChecks className="w-5 h-5" />
          Curriculum Checklist
        </Link>

        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mt-4 mb-1">Profile</div>
        <Link to="/dashboard/student-info" className={navLinkClass('/dashboard/student-info')} onClick={() => setIsSidebarOpen(false)}>
          <User className="w-5 h-5" />
          Student Information
        </Link>

          {/* App Info */}
          <div className="mt-auto pt-6 border-t border-[#C8E6D4]/50 mx-2">
            <div className="px-4 py-3 rounded-xl bg-[#EEF7F2] text-xs text-[#085830] space-y-1">
              <div className="font-bold mb-2">Contact Support:</div>
              <div className="text-gray-600">
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=curricucheck@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#136537]/90"
                >
                  curricucheck@gmail.com
                </a>
              </div>
            </div>
        </div>
      </nav>


    </>
  );

  return (
    <div className="min-h-screen bg-[#F5FAF7] font-['Inter'] flex">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, slide in when open */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#C8E6D4] flex flex-col transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-sm border-b border-[#C8E6D4] px-4 md:px-8 flex items-center justify-between z-20 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#EEF7F2] transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-5 h-5 text-[#085830]" /> : <Menu className="w-5 h-5 text-[#085830]" />}
          </button>

          <div className="flex-1 md:flex-none" />

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 md:gap-3 text-left focus:outline-none hover:bg-white/60 p-2 rounded-xl transition-colors"
            >
              <div className="text-right">
                <div className="text-xs md:text-sm font-bold text-[#085830]">
                  {student ? `${student.last_name}, ${student.first_name}` : 'Loading...'}
                </div>
                <div className="text-[10px] md:text-xs text-gray-500">
                  {student?.programs?.code} — {student?.curriculums?.version}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#C8E6D4] py-2 z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#EEF7F2] hover:text-[#136537] transition-colors flex items-center gap-2">
                  <Info className="w-4 h-4" /> About CurricuCheck
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#EEF7F2] hover:text-[#136537] transition-colors flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Help
                </button>
                <div className="h-px bg-gray-100 my-1"></div>
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

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}