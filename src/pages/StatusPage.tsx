import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getIDStatus } from '@/lib/idStatus';
import { formatReceiptDate } from '@/lib/receipt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Clock, FileText, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import ReceiptModal from '@/components/ReceiptModal';

const StatusPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    receiptNumber?: string;
    amount?: number;
    requestedAt?: string;
    matricNumber?: string;
  } | null;

  const matricNumber = state?.matricNumber;

  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [waitlistReason, setWaitlistReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    receiptNumber: string;
    receipt: { matric_number: string; name: string; requested_at: string; expires_at: string };
    expiresAt: string;
    daysRemaining: number;
  } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReceiptFromDb = useCallback(async (matric: string) => {
    const { data: tx } = await supabase
      .from('payment_transactions')
      .select('receipt_number')
      .eq('matric_number', matric)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tx) return;

    const { data: student } = await supabase
      .from('students')
      .select('name')
      .eq('matric_number', matric)
      .maybeSingle();

    const { data: replacement } = await supabase
      .from('id_replacements')
      .select('requested_at, expires_at')
      .eq('matric_number', matric)
      .maybeSingle();

    if (replacement) {
      const expiresAt = replacement.expires_at || replacement.requested_at;
      setReceiptData({
        receiptNumber: tx.receipt_number,
        receipt: {
          matric_number: matric,
          name: student?.name || '—',
          requested_at: replacement.requested_at,
          expires_at: expiresAt,
        },
        expiresAt,
        daysRemaining: replacement.expires_at
          ? Math.ceil((new Date(replacement.expires_at).getTime() - Date.now()) / 86400000)
          : 0,
      });
    }
  }, []);

  const checkStatus = useCallback(async (matric: string): Promise<boolean> => {
    try {
      const status = await getIDStatus(matric);

      if (status.status_label === 'active' || status.status_label === 'expiring_soon') {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('matric_number', matric)
          .maybeSingle();
        if (student) {
          toast.success('Your ID has been verified!');
          navigate(`/card/${student.id}`);
        } else {
          navigate('/');
        }
        return true;
      }

      setVerificationStatus(status.verification_status);
      setWaitlistReason(status.waitlist_reason);
      return false;
    } catch {
      return false;
    }
  }, [navigate]);

  useEffect(() => {
    if (!matricNumber) {
      navigate('/');
      return;
    }

    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      try {
        const redirected = await checkStatus(matricNumber);
        if (redirected || cancelled) return;

        if (state?.receiptNumber) {
          const { data: student } = await supabase
            .from('students')
            .select('name')
            .eq('matric_number', matricNumber)
            .maybeSingle();

          const { data: replacement } = await supabase
            .from('id_replacements')
            .select('requested_at, expires_at')
            .eq('matric_number', matricNumber)
            .maybeSingle();

          const requestedAt = state.requestedAt || replacement?.requested_at || new Date().toISOString();
          const expiresAt = replacement?.expires_at || requestedAt;

          setReceiptData({
            receiptNumber: state.receiptNumber!,
            receipt: {
              matric_number: matricNumber,
              name: student?.name || '—',
              requested_at: requestedAt,
              expires_at: expiresAt,
            },
            expiresAt,
            daysRemaining: replacement?.expires_at
              ? Math.ceil((new Date(replacement.expires_at).getTime() - Date.now()) / 86400000)
              : 0,
          });
        } else {
          await fetchReceiptFromDb(matricNumber);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    pollingRef.current = setInterval(async () => {
      if (!matricNumber) return;
      const redirected = await checkStatus(matricNumber);
      if (redirected && pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }, 30000);

    return () => {
      cancelled = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [matricNumber, navigate, checkStatus, state, fetchReceiptFromDb]);

  const handleRefresh = async () => {
    if (!matricNumber) return;
    setIsRefreshing(true);
    try {
      const redirected = await checkStatus(matricNumber);
      if (!redirected) toast.success('Status refreshed');
    } catch {
      toast.error('Failed to refresh status');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {showReceipt && receiptData && (
        <ReceiptModal
          receipt={receiptData.receipt}
          receiptNumber={receiptData.receiptNumber}
          expiresAt={receiptData.expiresAt}
          daysRemaining={receiptData.daysRemaining}
          onClose={() => setShowReceipt(false)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          <p className="text-5xl font-black text-white tracking-tight">Request Status</p>
          <p className="text-slate-400 mt-1">Track your digital ID verification progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Receipt Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Payment Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {receiptData ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt No.</span>
                      <span className="font-mono text-sm font-bold text-blue-400">{receiptData.receiptNumber}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Paid</span>
                      <span className="font-mono text-sm font-bold text-white">
                        ₦{Number(state?.amount || 5000).toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</span>
                      <span className="text-sm text-white">
                        {state?.requestedAt
                          ? new Date(state.requestedAt).toLocaleString()
                          : formatReceiptDate(receiptData.receipt.requested_at)}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowReceipt(true)}
                    className="w-full h-12 mt-6 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-xs transition-all rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    Download Receipt PDF
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No payment receipt available.</p>
              )}
            </CardContent>
          </Card>

          {/* Right — Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {verificationStatus === 'pending' && (
                <>
                  <div className="flex justify-center">
                    <Badge className="text-sm px-4 py-2 animate-pulse bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/20">
                      <Clock className="h-4 w-4 mr-2" />
                      PENDING VERIFICATION
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 text-center">
                    Your payment has been received. An administrator is reviewing
                    your information. You will be able to access your digital ID
                    card once verification is complete.
                  </p>
                  <Alert>
                    <AlertDescription className="text-xs text-slate-500 text-center">
                      This page refreshes automatically every 30 seconds.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {verificationStatus === 'waitlisted' && (
                <>
                  <div className="flex justify-center">
                    <Badge variant="destructive" className="text-sm px-4 py-2">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      ON WAITLIST
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 text-center">
                    Your verification is on hold. Please contact the MTU admin office.
                  </p>
                  {waitlistReason && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <span className="font-bold">Admin note:</span> {waitlistReason}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {!verificationStatus && (
                <p className="text-sm text-slate-500 text-center py-8">
                  Unable to load verification status.
                </p>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full h-12 mt-6 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-xs transition-all rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
                <p className="text-xs text-slate-600 text-center animate-pulse">
                  Checking for updates...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default StatusPage;
