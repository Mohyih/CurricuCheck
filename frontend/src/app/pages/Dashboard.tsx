import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';





export function Dashboard() {
  const navigate = useNavigate();
  const { student } = useAuth();

console.log('Dashboard student:', student);
console.log('Is admin:', student?.is_admin);

  const [curriculumDocs, setCurriculumDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  useEffect(() => {
    if (student?.is_admin) {
      const fetchDocs = async () => {
        setDocsLoading(true);

        try {
          const res = await api.get('/student/me/curriculum-documents');
          setCurriculumDocs(res.data.files);
        } catch (err) {
          console.error('Failed to fetch curriculum documents');
        } finally {
          setDocsLoading(false);
        }
      };

      fetchDocs();
    }
  }, [student?.is_admin]);

  
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
          onClick={() =>
  navigate('/dashboard/returning', {
    state: { openModal: true },
  })
}
          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#085830] to-[#A8C957] text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          Open Academic Records
        </button>
            </div>

      {/* Admin Section — only visible to admin account */}
      {student?.is_admin && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#F2AB50]"></div>

            <h2 className="text-sm font-bold text-[#085830] tracking-widest uppercase">
              Curriculum Documents
            </h2>

            <span className="px-2 py-0.5 rounded-full bg-[#F2AB50]/20 text-[#085830] text-xs font-bold">
              Admin Only
            </span>
          </div>

          {docsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : curriculumDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#C8E6D4] p-8 text-center text-gray-400 text-sm">
              No curriculum documents uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {curriculumDocs.map((doc) => (
                <button
                  key={doc.name}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-white rounded-xl border border-[#C8E6D4] overflow-hidden hover:shadow-md hover:border-[#136537] transition-all text-left group"
                >
                  <div className="aspect-video overflow-hidden bg-gray-50">
                    <img
                      src={doc.url}
                      alt={doc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-3">
                    <p className="text-xs font-semibold text-[#085830] truncate">
                      {doc.name
                        .replace('.png', '')
                        .replace('.jpg', '')
                        .replace('.jpeg', '')
                        .replace('.webp', '')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full screen image viewer */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute -top-10 right-0 text-white text-sm font-medium hover:text-gray-300"
            >
              ✕ Close
            </button>

            <img
              src={selectedDoc.url}
              alt={selectedDoc.name}
              className="w-full h-full object-contain rounded-xl"
            />

            <p className="text-white text-center text-sm mt-3 font-medium">
              {selectedDoc.name
                .replace('.png', '')
                .replace('.jpg', '')
                .replace('.jpeg', '')
                .replace('.webp', '')}
            </p>
          </div>
        </div>
      )}

    </Layout>
  );
}