import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="h-full bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#C8E6D4]/50 flex flex-col items-center justify-center p-12 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#085830] mb-4">
          Welcome to CurricuCheck!
        </h1>
        <p className="text-gray-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
          Begin encoding your completed subjects to evaluate curriculum progress and generate subject recommendations.
        </p>
        <button
          onClick={() => navigate('/dashboard/returning')}
          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          Add Academic Records
        </button>
      </div>
    </Layout>
  );
}