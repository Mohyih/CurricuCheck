import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoImg from "../../imports/CurricuCheck_Logo.png";
import { useNavigate } from "react-router";

export function Navbar() {
  const navigate = useNavigate();
  const scrollTo = (id: string) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#C8E6D4] shadow-sm">
      <div className="w-full px-10 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('home')}>
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
            <ImageWithFallback src={logoImg} alt="CurricuCheck Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg text-[#085830] tracking-tight">CurricuCheck</span>
        </div>
        
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1E1E2E]">
          <button onClick={() => scrollTo('home')} className="hover:text-[#136537] transition-colors">Home</button>
          <button onClick={() => scrollTo('about')} className="hover:text-[#136537] transition-colors">About</button>
          <button onClick={() => scrollTo('help')} className="hover:text-[#136537] transition-colors">Help</button>
          <div className="flex items-center gap-3 ml-4">
            <button onClick={() => navigate('/login')} className="text-[#136537] hover:text-[#A8C957] transition-colors font-semibold">Log In</button>
            <button onClick={() => navigate('/signup')} className="px-4 py-2 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-sm hover:shadow transition-all">Sign Up</button>
          </div>
        </div>

        {/* Mobile nav buttons */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => navigate('/login')} className="px-3 py-1.5 text-sm text-[#136537] font-semibold">Log In</button>
          <button onClick={() => navigate('/signup')} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white text-sm font-medium">Sign Up</button>
        </div>
      </div>
    </nav>
  );
}
