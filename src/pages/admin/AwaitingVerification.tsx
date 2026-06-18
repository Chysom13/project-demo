import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatReceiptDate } from '@/lib/receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { VerifyDialog } from '@/components/admin/VerifyDialog';
import { WaitlistDialog } from '@/components/admin/WaitlistDialog';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';

interface PendingRow {
  id: string;
  matric_number: string;
  name: string;
  requested_at: string;
  receipt_number?: string;
  amount?: number;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
    {children}
  </th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm ${className || ''}`}>{children}</td>
);

const AwaitingVerification = () => {
  const [records, setRecords] = useState<PendingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkExpiryDate, setBulkExpiryDate] = useState('');
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<PendingRow | null>(null);
  const [flagTarget, setFlagTarget] = useState<PendingRow | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: idData, error: idError } = await supabase
        .from('id_replacements')
        .select('*')
        .eq('verification_status', 'pending')
        .order('requested_at', { ascending: true });

      if (idError) throw idError;
      if (!idData) {
        setRecords([]);
        return;
      }

      const matricNumbers = idData.map(r => r.matric_number);

      const { data: txData } = await supabase
        .from('payment_transactions')
        .select('matric_number, receipt_number, amount')
        .eq('status', 'success')
        .in('matric_number', matricNumbers.length > 0 ? matricNumbers : [''])
        .order('created_at', { ascending: false });

      const latestTxMap: Record<string, { receipt_number: string; amount: number }> = {};
      if (txData) {
        for (const tx of txData) {
          if (!latestTxMap[tx.matric_number]) {
            latestTxMap[tx.matric_number] = { receipt_number: tx.receipt_number, amount: Number(tx.amount) };
          }
        }
      }

      setRecords(
        idData.map(r => ({
          id: r.id,
          matric_number: r.matric_number,
          name: r.name,
          requested_at: r.requested_at,
          ...latestTxMap[r.matric_number],
        }))
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pending verifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allSelected = selectedIds.size === records.length && records.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < records.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.matric_number)));
    }
  };

  const toggleSelectRow = (matric: string) => {
    const next = new Set(selectedIds);
    if (next.has(matric)) {
      next.delete(matric);
    } else {
      next.add(matric);
    }
    setSelectedIds(next);
  };

  const selectedRecords = useMemo(() => {
    return records.filter(r => selectedIds.has(r.matric_number));
  }, [records, selectedIds]);

  const handleBulkVerify = async () => {
    if (!bulkExpiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    const newExpiresAt = new Date(`${bulkExpiryDate}T23:59:59`);
    if (isNaN(newExpiresAt.getTime())) {
      toast.error('Invalid expiry date');
      return;
    }
    if (newExpiresAt <= new Date()) {
      toast.error('Expiry date must be in the future');
      return;
    }

    setIsBulkVerifying(true);

    try {
      const verifiedAt = new Date().toISOString();
      const updates = selectedRecords.map(r => ({
        id: r.id,
        matric_number: r.matric_number,
        name: r.name,
        requested_at: r.requested_at,
        expires_at: newExpiresAt.toISOString(),
        is_valid: true,
        verification_status: 'verified',
        verified_at: verifiedAt,
        waitlist_reason: null,
      }));

      const { error } = await supabase
        .from('id_replacements')
        .upsert(updates, { onConflict: 'matric_number' });

      if (error) throw error;

      toast.success(
        `${selectedRecords.length} student(s) verified. ID valid until ${formatReceiptDate(newExpiresAt.toISOString())}.`
      );
      setBulkExpiryDate('');
      setSelectedIds(new Set());
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Some verifications failed. Please try again.');
    } finally {
      setIsBulkVerifying(false);
    }
  };

  const clearSelection = () => {
    setBulkExpiryDate('');
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-5xl font-black text-white tracking-tight">Awaiting Verification</p>
        <p className="text-sm text-slate-400 mt-1">
          Students who have paid and are pending admin review
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {records.length} student(s) awaiting verification
        </p>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-blue-600/20 border border-blue-500/30 rounded-2xl p-5 mb-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-bold text-white">{selectedIds.size} selected</span>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  Set Expiry Date
                </label>
                <Input
                  type="date"
                  value={bulkExpiryDate}
                  min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                  onChange={(e) => setBulkExpiryDate(e.target.value)}
                  className="h-8 w-40 bg-slate-800 border-white/10 text-white rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-1.5">
                {[
                  { label: '6 Months', months: 6 },
                  { label: '1 Year', months: 12 },
                  { label: '2 Years', months: 24 },
                ].map(({ label, months }) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setBulkExpiryDate(addMonths(new Date(), months).toISOString().slice(0, 10))}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-white/10 bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="xs"
                onClick={handleBulkVerify}
                disabled={isBulkVerifying || !bulkExpiryDate}
                className="bg-green-600 hover:bg-green-500 text-white font-bold gap-1 whitespace-nowrap"
              >
                {isBulkVerifying ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Verifying...</>
                ) : (
                  <><CheckCircle2 className="h-3 w-3" /> Verify All Selected</>
                )}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={clearSelection}
                disabled={isBulkVerifying}
                className="text-slate-400 hover:text-white gap-1"
              >
                Clear Selection
              </Button>
            </div>
          </div>

          {bulkExpiryDate && new Date(bulkExpiryDate) > new Date() && (
            <p className="text-xs text-blue-400 mt-3 ml-1">
              Selected students will have access until{' '}
              <strong>{formatReceiptDate(new Date(`${bulkExpiryDate}T23:59:59`).toISOString())}</strong>
            </p>
          )}
        </div>
      )}

      {/* Table */}
      {records.length === 0 ? (
        <div className="bg-slate-800/60 rounded-2xl border border-white/10 py-16 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No pending verifications. All students are up to date.</p>
        </div>
      ) : (
        <div className="bg-slate-800/60 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/10">
                  <Th>
                    <Checkbox
                      checked={allSelected || someSelected ? (allSelected ? true : 'indeterminate' as any) : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </Th>
                  <Th>Student Name</Th>
                  <Th>Matric No.</Th>
                  <Th>Payment Date</Th>
                  <Th>Receipt No.</Th>
                  <Th>Amount</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <Td>
                      <Checkbox
                        checked={selectedIds.has(row.matric_number)}
                        onCheckedChange={() => toggleSelectRow(row.matric_number)}
                      />
                    </Td>
                    <Td className="font-medium text-white">{row.name}</Td>
                    <Td>
                      <span className="font-mono text-xs text-slate-400">{row.matric_number}</span>
                    </Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">
                      {formatReceiptDate(row.requested_at)}
                    </Td>
                    <Td>
                      <span className="font-mono text-xs text-blue-400 font-bold">
                        {row.receipt_number || '—'}
                      </span>
                    </Td>
                    <Td className="font-mono font-bold text-white">
                      {row.amount ? `₦${row.amount.toLocaleString()}` : '—'}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          onClick={() => setVerifyTarget(row)}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Verify
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => setFlagTarget(row)}
                          className="gap-1 text-red-600 cursor-pointer"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Flag Issue
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <VerifyDialog
        student={verifyTarget}
        onSuccess={fetchData}
        onClose={() => setVerifyTarget(null)}
      />
      <WaitlistDialog
        student={flagTarget}
        onSuccess={fetchData}
        onClose={() => setFlagTarget(null)}
      />
    </div>
  );
};

export default AwaitingVerification;
