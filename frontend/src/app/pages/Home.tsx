import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { About } from "../components/About";
import { Help } from "../components/Help";
import { Footer } from "../components/Footer";

export function Home() {
  return (
    <div className="font-['Inter'] min-h-screen bg-[#F5FAF7] text-[#085830]">
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
