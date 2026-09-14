import { useNavigate } from "react-router";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section id="home" className="min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#085830] to-[#A8C957]">
            Access Your Curriculum Evaluation
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Evaluate curriculum progress, check subject eligibility, and receive subject recommendations based on your academic records.
        </p>

        <div className="flex items-center justify-center pt-4">
          <button
            onClick={() => navigate('/signup')}
            className="w-[190px] sm:w-auto px-6 sm:px-10 py-3 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium text-center shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}