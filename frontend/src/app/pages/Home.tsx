import { useState, useEffect } from "react"; // 1. Added React hooks
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { About } from "../components/About";
import { Help } from "../components/Help";
import { Footer } from "../components/Footer";

export function Home() {
  // 2. Added the online/offline state logic
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const savedScroll = sessionStorage.getItem("homeScroll");

    
    if (savedScroll) {
  requestAnimationFrame(() => {
    window.scrollTo({
      top: Number(savedScroll),
      behavior: "instant" as ScrollBehavior,
    });

    sessionStorage.removeItem("homeScroll");
  });
}

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="font-['Inter'] min-h-screen bg-[#F5FAF7] text-[#085830]">
      {/* 3. Added the Offline Banner (using bottom-0 so it stays at the bottom) */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-500 text-white text-center text-xs py-2 font-medium">
          You are offline. Some features may not work until you reconnect.
        </div>
      )}

      <Navbar />
      <main>
        <Hero />
        <About />
        <Help />
      </main>
      <Footer />
    </div>
  );
}