import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getIDStatus } from '@/lib/idStatus';
import IDCard3D from '@/components/IDCard3D';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import Navbar from '@/components/Navbar';
import ReceiptModal from '@/components/ReceiptModal';
import { formatReceiptDate } from '@/lib/receipt';

const IDCardPage = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [receipt, setReceipt] = useState<{
    receiptNumber: string;
    receipt: {
      matric_number: string;
      name: string;
      requested_at: string;
      expires_at: string;
    };
    expiresAt: string;
    daysRemaining: number;
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [expiryInfo, setExpiryInfo] = useState<{ expires_at: string; days_remaining: number; status_label: string } | null>(null);
  const navigate = useNavigate();
  const { toPDF, targetRef } = usePDF({ 
    filename: `MTU_ID_CARD_${student?.matric_number || 'STUDENT'}.pdf`,
    page: { margin: 20 }
  });

  const checkStatus = useCallback(async (matricNumber: string) => {
    const status = await getIDStatus(matricNumber);

    if (status.status_label === 'not_found') {
      toast.error('No active ID found.');
      navigate('/');
      return;
    }

    if (status.status_label === 'pending') {
      toast.info('Your ID is awaiting admin verification.');
      navigate('/');
      return;
    }

    if (status.status_label === 'waitlisted') {
      toast.error(`Your account is on hold: ${status.waitlist_reason || 'No reason provided'}.`);
      navigate('/');
      return;
    }

    setExpiryInfo({
      expires_at: status.expires_at,
      days_remaining: status.days_remaining,
      status_label: status.status_label,
    });

    if (status.status_label === 'expired') {
      if (!status.is_valid) {
        toast.error('Your ID access has been revoked by an administrator.');
      } else {
        toast.error(`Your ID expired on ${formatReceiptDate(status.expires_at)}. Please renew.`);
      }
      navigate('/');
      return;
    }

  }, [navigate]);

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

        await checkStatus(data.matric_number);

        // Fetch latest successful receipt and replacement data
        const { data: tx } = await supabase
          .from('payment_transactions')
          .select('receipt_number')
          .eq('matric_number', data.matric_number)
          .eq('status', 'success')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (tx) {
          const { data: replacement } = await supabase
            .from('id_replacements')
            .select('requested_at, expires_at')
            .eq('matric_number', data.matric_number)
            .single();

          if (replacement) {
            setReceipt({
              receiptNumber: tx.receipt_number,
              receipt: {
                matric_number: data.matric_number,
                name: data.name,
                requested_at: replacement.requested_at,
                expires_at: replacement.expires_at,
              },
              expiresAt: replacement.expires_at,
              daysRemaining: Math.ceil((new Date(replacement.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            });
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load student data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [id, navigate, checkStatus]);

  // Re-check status on window focus (e.g. after midnight)
  useEffect(() => {
    const onFocus = () => {
      if (student?.matric_number) {
        checkStatus(student.matric_number);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [student?.matric_number, checkStatus]);

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
      {showReceipt && receipt && (
        <ReceiptModal
          receipt={receipt.receipt}
          receiptNumber={receipt.receiptNumber}
          expiresAt={receipt.expiresAt}
          daysRemaining={receipt.daysRemaining}
          onClose={() => setShowReceipt(false)}
        />
      )}


      <Navbar onViewReceipt={receipt ? () => setShowReceipt(true) : () => toast.error('No receipt found')} />
        {/* Early warning system */}
      {/* {showExpiryWarning && expiryInfo && (
        <div className="max-w-6xl mx-auto px-4 pt-20">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
              <p className="text-yellow-200 text-sm">
                ⚠️ Your ID expires in {expiryInfo.days_remaining} days. Renew now to avoid losing access.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/')}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs px-4 py-2 rounded-lg transition-all"
              >
                Renew Now
              </button>
              <button onClick={() => setShowExpiryWarning(false)} className="text-yellow-400/60 hover:text-yellow-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )} */}
      
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

      
          {/* Card Display Area */}
          <div className="flex flex-col items-center">
            <div className="id-card-responsive-wrapper">
              <div className="id-card-scaler">
                <IDCard3D student={student} />
              </div>
            </div>
            {expiryInfo && (
              <>
                <p className="mt-6 text-sm text-slate-400">
                  Valid Until: <span className="text-white font-semibold">{formatReceiptDate(expiryInfo.expires_at)}</span>
                </p>
                {expiryInfo.status_label === 'expiring_soon' && (
                  <p className="mt-1 text-sm text-yellow-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Expires in {expiryInfo.days_remaining} days
                  </p>
                )}
              </>
            )}
          </div>

  

        {/* Hidden Container for PDF Capture */}
        <div className="fixed top-0 left-0 opacity-0 pointer-events-none" id="pdf-capture-area" style={{ zIndex: -1 }}>
          <div ref={targetRef} className="p-10 flex flex-col gap-10 items-center" style={{ backgroundColor: '#ffffff' }}>
            <div className="flex flex-col gap-8">
               <div className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm" style={{ position: 'relative', width: 540, height: 340 }}>
                  <IDCard3D student={student} forceSide="front" />
               </div>
               <div className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm" style={{ position: 'relative', width: 540, height: 340 }}>
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
};export default IDCardPage;
