import { Link } from 'react-router';
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
    <footer className="bg-white border-t border-[#C8E6D4] py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-5">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
            <ImageWithFallback
              src={logoImg}
              alt="CurricuCheck Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <span className="font-bold text-[#085830] tracking-tight">
            CurricuCheck
          </span>
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-gray-400">
          <Link
  to="/terms-of-service"
  onClick={() => {
    sessionStorage.setItem("homeScroll", String(window.scrollY));
    sessionStorage.setItem("cameFrom", "home");
  }}
  className="hover:text-[#136537] transition-colors"
>
  Terms of Service
</Link>

          <span className="hidden sm:inline">·</span>

          <Link
  to="/privacy-notice"
  onClick={() => {
    sessionStorage.setItem("homeScroll", String(window.scrollY));
    sessionStorage.setItem("cameFrom", "home");
  }}
  className="hover:text-[#136537] transition-colors"
>
  Privacy Notice
</Link>

          <span className="hidden sm:inline">·</span>

          <a
  href="https://mail.google.com/mail/?view=cm&fs=1&to=curricucheck@gmail.com"
  target="_blank"
  rel="noopener noreferrer"
  className="hover:text-[#136537] transition-colors"
>
  Contact
</a>
        </div>

        {/* Copyright */}
        <p className="text-[11px] sm:text-xs text-center text-gray-400 leading-relaxed">
          &copy; {new Date().getFullYear()} CurricuCheck. All rights reserved.
        </p>

      </div>
    </footer>
  );
}