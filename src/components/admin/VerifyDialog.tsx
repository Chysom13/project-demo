import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatReceiptDate } from '@/lib/receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface StudentInfo {
  id: string;
  matric_number: string;
  name: string;
  requested_at: string;
  receipt_number?: string;
  amount?: number;
}

interface VerifyDialogProps {
  student: StudentInfo | null;
  onSuccess: () => void;
  onClose: () => void;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateInput(d);
}

export function VerifyDialog({ student, onSuccess, onClose }: VerifyDialogProps) {
  const [expiryDate, setExpiryDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!student) return null;

  const minDate = getTomorrow();

  const selectedDate = expiryDate ? new Date(`${expiryDate}T23:59:59`) : null;
  const daysRemaining = selectedDate && !isNaN(selectedDate.getTime())
    ? Math.ceil((selectedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleShortcut = (months: number) => {
    const d = addMonths(new Date(), months);
    setExpiryDate(formatDateInput(d));
    setError('');
  };

  const handleVerify = async () => {
    if (!expiryDate) {
      setError('Please select an expiry date');
      return;
    }

    const newExpiresAt = new Date(`${expiryDate}T23:59:59`);
    if (isNaN(newExpiresAt.getTime())) {
      setError('Invalid date');
      return;
    }
    if (newExpiresAt <= new Date()) {
      setError('Expiry date must be in the future');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('id_replacements')
        .update({
          expires_at: newExpiresAt.toISOString(),
          is_valid: true,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          waitlist_reason: null,
        })
        .eq('matric_number', student.matric_number);

      if (updateError) throw updateError;

      toast.success(
        `${student.name} has been verified. ID valid until ${formatReceiptDate(newExpiresAt.toISOString())}.`
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to verify student. Please try again.');
      toast.error('Failed to verify student');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Verify Student ID Request</DialogTitle>
          <DialogDescription>
            Review student details and set the ID card expiry date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Student Info Panel */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Name:</span>
              <span className="text-white font-medium text-right">{student.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Matric No:</span>
              <span className="text-white font-mono text-xs">{student.matric_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Payment Date:</span>
              <span className="text-white text-xs">{formatReceiptDate(student.requested_at)}</span>
            </div>
          </div>

          {/* Expiry Date Setter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Set ID Card Expiry Date
            </label>
            <Input
              type="date"
              value={expiryDate}
              min={minDate}
              onChange={(e) => { setExpiryDate(e.target.value); setError(''); }}
              className="h-10 bg-white/5 border-white/10 text-white rounded-xl"
            />
            <p className="text-xs text-slate-500">The student will lose access automatically on this date.</p>
          </div>

          {/* Duration Shortcuts */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Set</p>
            <div className="flex gap-2">
              {[
                { label: '6 Months', months: 6 },
                { label: '1 Year', months: 12 },
                { label: '2 Years', months: 24 },
              ].map(({ label, months }) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => handleShortcut(months)}
                  className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Line */}
          {selectedDate && daysRemaining !== null && daysRemaining > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
              <p className="text-sm text-blue-400 font-medium">
                Student will have access from today until{' '}
                <strong>{formatReceiptDate(selectedDate.toISOString())}</strong> ({daysRemaining} days)
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 font-medium">{error}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleVerify}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-500 text-white font-bold"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
            ) : (
              'Verify'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
