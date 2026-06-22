import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoImg from "../../imports/CurricuCheck_Logo.png";

export function Footer() {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-[#C8E6D4] py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
            <ImageWithFallback src={logoImg} alt="CurricuCheck Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-[#085830] tracking-tight">CurricuCheck</span>
        </div>
        
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} CurricuCheck. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
