import { ReactNode, useState, useEffect  } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImg from '../../imports/CurricuCheck_Logo.png';
import { ChevronDown, LogOut, LayoutDashboard, ListChecks, User, Menu, X, Map } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';



export function Layout({ children }: { children: ReactNode }) {
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnsavedGrades, setHasUnsavedGrades] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { student, logout } = useAuth();

  const [incNotification, setIncNotification] = useState<any[]>([]);
const [showIncNotif, setShowIncNotif] = useState(false);
  

const [isOnline, setIsOnline] = useState(navigator.onLine);


useEffect(() => {
  const fetchIncGrades = async () => {
    try {
      const res = await api.get('/student/me/records');
      const records = res.data.records || [];

      const incRecords = records.filter(
        (r: any) => r.status === 'inc'
      );

      if (incRecords.length > 0) {
        setIncNotification(incRecords);

        const dismissed = sessionStorage.getItem(
          'incNotificationDismissed'
        );

        if (!dismissed) {
          setShowIncNotif(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch records for INC check');
    }
  };

  if (student) {
    fetchIncGrades();
  }
}, [student]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);



  useEffect(() => {
    const syncUnsavedGradeState = () => {
      const nextState = sessionStorage.getItem('curricucheck:hasUnsavedGrades') === 'true';
      setHasUnsavedGrades(nextState);
    };

    syncUnsavedGradeState();

    const handleUnsavedGradeChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setHasUnsavedGrades(Boolean(customEvent.detail));
    };

    window.addEventListener('curricucheck:unsaved-grades', handleUnsavedGradeChange);

    return () => {
      window.removeEventListener('curricucheck:unsaved-grades', handleUnsavedGradeChange);
    };
  }, []);

  const handleLogout = () => {
    if (hasUnsavedGrades) {
      setShowLogoutWarning(true);
      return;
    }

    logout();
    navigate('/');
  };

  const confirmLogout = () => {
    setShowLogoutWarning(false);
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
        {student?.is_admin ? (
          // Admin nav — minimal
          <>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-1">
              Admin
            </div>

            <Link
              to="/dashboard"
              className={navLinkClass('/dashboard')}
              onClick={() => setIsSidebarOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
          </>
        ) : (
          // Student nav — full
          <>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-1">
              Main
            </div>

            <Link
              to="/dashboard"
              className={navLinkClass('/dashboard')}
              onClick={() => setIsSidebarOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>

            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mt-4 mb-1">
              Academic
            </div>

            <Link
              to="/dashboard/checklist"
              className={navLinkClass('/dashboard/checklist')}
              onClick={() => setIsSidebarOpen(false)}
            >
              <ListChecks className="w-5 h-5" />
              Curriculum Checklist
            </Link>

            <Link
              to="/dashboard/roadmap"
              className={navLinkClass('/dashboard/roadmap')}
              onClick={() => setIsSidebarOpen(false)}
            >
              <Map className="w-5 h-5" />
              Curriculum Roadmap
            </Link>

            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mt-4 mb-1">
              Profile
            </div>

            <Link
              to="/dashboard/student-info"
              className={navLinkClass('/dashboard/student-info')}
              onClick={() => setIsSidebarOpen(false)}
            >
              <User className="w-5 h-5" />
              Student Information
            </Link>
          </>
        )}

{/* INC Notification */}
{showIncNotif && incNotification.length > 0 && (
  <div className="fixed bottom-4 left-4 right-4 md:right-auto z-50 max-w-xs w-auto md:w-80 bg-white border-2 border-amber-400 rounded-[1rem] shadow-2xl p-4 animate-fade-in">
    
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center gap-2">
        
        <p className="text-sm font-bold text-amber-700">
          INC Grade{incNotification.length > 1 ? 's' : ''} Reminder
        </p>
      </div>

      <button
        onClick={() => {
          sessionStorage.setItem(
            'incNotificationDismissed',
            'true'
          );
          setShowIncNotif(false);
        }}
        className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>

    <p className="text-xs text-amber-600 mb-2">
      You have {incNotification.length} incomplete grade
      {incNotification.length > 1 ? 's' : ''} that must be
      resolved within 1 week at the start of next semester:
    </p>

    <div className="space-y-1">
      {incNotification.map((record: any) => (
        <div
          key={record.id}
          className="flex items-center gap-2 text-xs"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />

          <span className="font-medium text-amber-800">
            {record.subjects?.code || 'Unknown'} - Year{' '}
            {record.subjects?.year_level}, {record.subjects?.semester}
          </span>
        </div>
      ))}
    </div>

    <button
      onClick={() => {
        sessionStorage.setItem(
          'incNotificationDismissed',
          'true'
        );
        setShowIncNotif(false);
      }}
      className="mt-3 w-full py-1.5 rounded-full bg-amber-400 text-white text-xs font-bold hover:bg-amber-500 transition-all"
    >
      Got it
    </button>

  </div>
)}
                


        

          {/* App Info */}
          <div className="mt-auto mx-2">
  <button
    onClick={handleLogout}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-full transition-all"
  >
    <LogOut className="w-4 h-4" />
    Logout
  </button>

  <div className="border-t border-[#C8E6D4]/50 my-4"></div>

  <div className="px-4 py-3 rounded-xl bg-[#EEF7F2] text-xs text-[#085830]">
    <div className="font-bold mb-2">Contact Support:</div>

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
      </nav>


    </>
  );

  return (
    <div className="min-h-screen bg-[#F5FAF7] font-['Inter'] flex">

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-500 text-white text-center text-xs py-2 font-medium">
          You are offline. Some features may not work until you reconnect.
        </div>
      )}

      {showLogoutWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.25rem] shadow-[0_20px_60px_rgb(0,0,0,0.3)] border border-[#C8E6D4] p-6 sm:p-8 max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-bold text-[#085830] text-center mb-2">
              Unsaved Grades
            </h2>

            <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
              You have unsaved grades. Logging out will discard your changes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutWarning(false)}
                className="flex-1 px-5 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
              >
                Stay on Page
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 px-5 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-bold shadow-md hover:shadow-lg transition-all"
              >
                Log Out Anyway
              </button>
            </div>
          </div>
        </div>
      )}

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

                    {/* User info — different for admin */}
          <div className="flex items-center p-2 pr-0">
            {student?.is_admin ? (
              // Admin header
              <span className="px-3 py-1 rounded-full bg-[#F2AB50]/20 text-[#085830] text-xs font-bold border border-[#F2AB50]">
                Admin
              </span>
            ) : (
              // Student header
              <div className="text-right">
                <div className="text-xs md:text-sm font-bold text-[#085830]">
                  {student ? `${student.last_name}, ${student.first_name}` : 'Loading...'}
                </div>

                <div className="text-[10px] md:text-xs text-gray-500">
                  {student?.programs?.code} - {student?.curriculums?.version}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}