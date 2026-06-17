import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import {
  Alert, AlertDescription, AlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface StudentInfo {
  id: string;
  matric_number: string;
  name: string;
}

interface WaitlistDialogProps {
  student: StudentInfo | null;
  onSuccess: () => void;
  onClose: () => void;
}

const MAX_REASON_LENGTH = 300;

export function WaitlistDialog({ student, onSuccess, onClose }: WaitlistDialogProps) {
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!student) return null;

  const charsRemaining = MAX_REASON_LENGTH - reason.length;

  const handleFlag = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for waitlisting');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('id_replacements')
        .update({
          verification_status: 'waitlisted',
          is_valid: false,
          waitlist_reason: reason.trim(),
        })
        .eq('matric_number', student.matric_number);

      if (updateError) throw updateError;

      toast.success(`${student.name} has been moved to the waitlist.`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to move student to waitlist. Please try again.');
      toast.error('Failed to move student to waitlist');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Flag Verification Issue</DialogTitle>
          <DialogDescription>
            Move this student to the waitlist and notify them of the issue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Warning Banner */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This student will be placed on the waitlist and will not be able to access their ID card until you verify them.
            </AlertDescription>
          </Alert>

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
          </div>

          {/* Reason Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Reason for waitlisting
            </label>
            <Textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value.slice(0, MAX_REASON_LENGTH)); setError(''); }}
              placeholder="e.g. Payment amount mismatch, incorrect student details..."
              maxLength={MAX_REASON_LENGTH}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">
                This reason will be shown to the student on their status page.
              </p>
              <span className={`text-xs font-mono ${charsRemaining <= 20 ? 'text-red-400' : 'text-slate-500'}`}>
                {charsRemaining}/{MAX_REASON_LENGTH}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-medium">{error}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleFlag}
            disabled={isSaving || !reason.trim()}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Moving...</>
            ) : (
              'Move to Waitlist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
