import { usePDF } from 'react-to-pdf';
import { Button } from '@/components/ui/button';
import { X, Download, CheckCircle2 } from 'lucide-react';
import { formatReceiptDate } from '@/lib/receipt';

interface ReceiptModalProps {
  receipt: {
    matric_number: string;
    name: string;
    requested_at: string;
    expires_at: string;
    receipt_no?: string;
    id?: string;
    days_remaining?: number;
  };
  receiptNumber: string;
  expiresAt: string;
  daysRemaining: number;
  onClose: () => void;
}

const ReceiptModal = ({ receipt, receiptNumber, expiresAt, daysRemaining, onClose }: ReceiptModalProps) => {
  const { toPDF, targetRef } = usePDF({ filename: `receipt-${receiptNumber}.pdf` });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Payment Receipt</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Transaction Successful</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-950/20">
          
          {/* Printable Area Wrapper */}
          <div className="flex justify-center" id="pdf-capture-area">
            <div ref={targetRef} className="p-10 rounded-sm shadow-xl font-sans" style={{ backgroundColor: '#ffffff', color: '#1e293b', width: '500px', border: '1px solid #e2e8f0' }}>
              {/* Receipt Header */}
              <div className="flex flex-col items-center text-center mb-8 pb-8" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <img src="/logo.png" className="h-16 w-16 mb-4 grayscale" alt="Logo" />
                <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: '#0f172a' }}>Mountain Top University</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>Registry Department - Student Identity Services</p>
              </div>

              {/* Receipt Content */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Receipt No.</p>
                    <p className="text-sm font-bold font-mono">{receiptNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Date Issued</p>
                    <p className="text-sm font-bold">{new Date(receipt.requested_at).toLocaleDateString()} {new Date(receipt.requested_at).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Student Name</p>
                    <p className="text-sm font-bold">{receipt.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Matric Number</p>
                    <p className="text-sm font-bold uppercase">{receipt.matric_number}</p>
                  </div>
                </div>

                {/* Amount Table */}
                <div className="mt-8 pt-6" style={{ borderTop: '2px solid #0f172a' }}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold uppercase" style={{ color: '#64748b' }}>Service Description</span>
                    <span className="text-xs font-bold uppercase" style={{ color: '#64748b' }}>Amount</span>
                  </div>
                  <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid #f8fafc' }}>
                    <span className="text-sm font-medium">Digital Student ID Card (Renewal)</span>
                    <span className="text-sm font-bold">₦5,000.00</span>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTop: '2px solid #f1f5f9' }}>
                    <span className="text-lg font-black uppercase tracking-tight">Total Paid</span>
                    <span className="text-xl font-black font-mono" style={{ color: '#2563eb' }}>₦5,000.00</span>
                  </div>
                </div>

                {/* Validity Period */}
                <div className="mt-6 pt-6" style={{ borderTop: '2px solid #0f172a' }}>
                  <span className="text-xs font-bold uppercase block mb-4" style={{ color: '#64748b' }}>Validity Period</span>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Valid From</span>
                      <span className="text-sm font-bold">{formatReceiptDate(receipt.requested_at)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Valid Until</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatReceiptDate(expiresAt)}</span>
                        <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-green-600">Active</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Duration</span>
                      <span className="text-sm font-bold">1 Year ({daysRemaining} days remaining)</span>
                    </div>
                  </div>
                </div>

                {/* Expiry Note */}
                <div className="mt-10 p-4 rounded-lg text-center" style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed" style={{ color: '#1e40af' }}>
                    This receipt confirms payment for the digital ID service valid until <span className='text-red-600'>{new Date(receipt.expires_at).toLocaleDateString()}</span>.
                    Access will be automatically revoked upon expiry.
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 text-center" style={{ borderTop: '1px dashed #e2e8f0' }}>
                  <p className="text-[9px] font-medium" style={{ color: '#94a3b8' }}>
                    This is a system generated receipt. No signature is required.
                    For verification, scan the barcode on the back of your ID card.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-slate-900/80 border-t border-white/5 flex gap-4">
          <Button 
            onClick={() => toPDF()}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl gap-2 shadow-lg shadow-blue-500/20"
          >
            <Download className="h-5 w-5" />
            Download Receipt
          </Button>          
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;