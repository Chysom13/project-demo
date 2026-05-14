import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import IDCard3D from '@/components/IDCard3D';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import Navbar from '@/components/Navbar';

const IDCardPage = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toPDF, targetRef } = usePDF({ 
    filename: `MTU_ID_CARD_${student?.matric_number || 'STUDENT'}.pdf`,
    page: { margin: 20 }
  });

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          toast.error('Student record not found');
          navigate('/');
          return;
        }
        setStudent(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load student data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Digital Identity <ShieldCheck className="h-8 w-8 text-[#12bca2]" />
            </h1>
            <p className="text-slate-400 mt-2">View and manage your official university identity card</p>
          </div>
          
          <Button 
            onClick={() => toPDF()}
            className="bg-[#12bca2] hover:bg-[#0fa891] text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-[#12bca2]/20 transition-all active:scale-95"
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Card Display Area */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="id-card-responsive-wrapper">
              <div className="id-card-scaler">
                <IDCard3D student={student} />
              </div>
            </div>
            
            <p className="mt-8 text-sm text-slate-500 font-medium italic">
              Click the card to flip and view the back side
            </p>
          </div>

          {/* Info Area */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-2 h-8 bg-[#6d15df] rounded-full" />
                Student Information
              </h2>
              
              <div className="space-y-4">
                <InfoItem label="Full Name" value={student.name} />
                <InfoItem label="Matric Number" value={student.matric_number} />
                <InfoItem label="Department" value={student.department} />
                <InfoItem label="Level" value={student.level} />
                <InfoItem label="Status" value="Active Student" status="active" />
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 leading-relaxed">
                  This digital ID is a valid representation of your student status at Mountain Top University. 
                  You can use the QR code on the back for quick verification at campus entry points.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Container for PDF Capture */}
        <div className="fixed left-[-2000px] top-0" id="pdf-capture-area">
          <div ref={targetRef} className="p-10 flex flex-col gap-10 items-center" style={{ backgroundColor: '#ffffff' }}>
            <div className="flex flex-col gap-8">
               <div className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                  <IDCard3D student={student} forceSide="front" />
               </div>
               <div className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                  <IDCard3D student={student} forceSide="back" />
               </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-[14px] font-bold text-[#1e293b]">Mountain Top University Official Student ID</p>
              <p className="text-[12px] text-[#64748b]">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const InfoItem = ({ label, value, status }: { label: string, value: string, status?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
    {status === 'active' ? (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-white font-bold">{value}</span>
      </div>
    ) : (
      <span className="text-white font-bold">{value}</span>
    )}
  </div>
);

export default IDCardPage;
