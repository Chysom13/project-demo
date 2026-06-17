import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateReceiptNumber } from '@/lib/receipt';

const AMOUNT = 5000;

interface PaymentPortalProps {
  matricNumber: string;
  studentName: string;
  onCancel: () => void;
}

const PaymentPortal = ({ matricNumber, studentName, onCancel }: PaymentPortalProps) => {
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const handleSimulatePayment = async () => {
    setIsPaying(true);
    const receiptNumber = generateReceiptNumber();
    const requestedAt = new Date().toISOString();
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Upsert into id_replacements — pending until admin verifies
      const { data: replacement, error } = await supabase
        .from('id_replacements')
        .upsert({
          matric_number: matricNumber,
          name: studentName,
          requested_at: requestedAt,
          expires_at: null,
          is_valid: false,
          verification_status: 'pending',
          verified_at: null,
          waitlist_reason: null,
        }, {
          onConflict: 'matric_number',
          ignoreDuplicates: false,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Log successful payment transaction
      const { error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          matric_number: matricNumber,
          amount: AMOUNT,
          status: 'success',
          receipt_number: receiptNumber,
          id_replacement_id: replacement.id,
        });

      if (txError) {
        console.error('Payment transaction log error:', txError);
      }

      toast.success('Payment successful! Your request is pending admin verification.');

      navigate('/status', { state: { receiptNumber, amount: AMOUNT, requestedAt, matricNumber } });
    } catch (err) {
      console.error(err);

      // Log failed transaction — do NOT upsert id_replacements
      await supabase
        .from('payment_transactions')
        .insert({
          matric_number: matricNumber,
          amount: AMOUNT,
          status: 'failed',
          receipt_number: receiptNumber,
        });

      toast.error('Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500 bg-slate-900 p-10 rounded-3xl shadow-2xl ring-1 ring-white/5">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 shadow-inner">
            <div className="absolute h-12 w-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
            <div className="absolute font-black text-amber-500 text-xl">₦</div>
          </div>
          
          <div className="space-y-2">
            <p className="text-2xl font-black text-white uppercase tracking-tight">Payment Required</p>
            <p className="text-sm text-slate-400">
              To view and download your official MTU Digital ID, you are required to pay a processing <span className="text-amber-500 font-bold italic">FEE</span>.
            </p>
          </div>

          <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</span>
              <span className="text-sm font-bold text-white">Digital ID Generation</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
              <span className="text-xl font-black text-blue-500 font-mono">₦5,000.00</span>
            </div>
          </div>

          <Button 
            onClick={handleSimulatePayment}
            disabled={isPaying}
            className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black font-black text-lg transition-all shadow-xl shadow-amber-500/20 active:scale-95 rounded-xl"
          >
            {isPaying ? 'Processing Payment...' : 'Pay Fine'}
          </Button>

          <button 
            onClick={onCancel}
            className="flex items-center mx-auto text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-[0.2em]"
          >
            <X className="mr-1 h-3 w-3" />
            Cancel and Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPortal;
