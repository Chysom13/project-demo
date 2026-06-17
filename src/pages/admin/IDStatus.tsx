import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatReceiptDate } from '@/lib/receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogMedia, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Loader2, Search, ShieldAlert, Ban,
} from 'lucide-react';

interface IDRow {
  id: string;
  matric_number: string;
  name: string;
  requested_at: string;
  expires_at: string | null;
  is_valid: boolean;
  verification_status: string | null;
}

type StatusValue = 'all' | 'active' | 'expiring_soon' | 'expired' | 'revoked';

function deriveStatusLabel(row: { is_valid: boolean; expires_at: string | null; verification_status?: string | null }): StatusValue {
  if (row.verification_status === 'pending' || row.verification_status === 'waitlisted') {
    return 'all' as StatusValue;
  }
  if (!row.expires_at) return 'expired';
  const now = new Date();
  const expiresAt = new Date(row.expires_at);
  if (!row.is_valid && expiresAt > now) return 'revoked';
  if (expiresAt <= now) return 'expired';
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 30) return 'expiring_soon';
  return 'active';
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
    {children}
  </th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm ${className || ''}`}>{children}</td>
);

const SummaryCard = ({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) => (
  <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
    <p className={`text-2xl font-black ${className || 'text-white'}`}>{value}</p>
  </div>
);

const IDStatusBadge = ({ badgeLabel }: { badgeLabel: StatusValue }) => {
  if (badgeLabel === 'revoked') {
    return <Badge variant="destructive">Revoked</Badge>;
  }
  if (badgeLabel === 'expired') {
    return <Badge variant="destructive">Expired</Badge>;
  }
  if (badgeLabel === 'expiring_soon') {
    return (
      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
        Expiring Soon
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-green-500/10 text-green-500 border-green-500/20">
      Active
    </span>
  );
};

const IDStatus = () => {
  const [records, setRecords] = useState<IDRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState<StatusValue>('all');
  const [search, setSearch] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<IDRow | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('id_replacements')
        .select('*')
        .order('expires_at', { ascending: true });

      if (error) throw error;
      setRecords((data as IDRow[]) || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load ID data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const summary = useMemo(() => {
    const active = records.filter(r => deriveStatusLabel(r) === 'active').length;
    const expiringSoon = records.filter(r => deriveStatusLabel(r) === 'expiring_soon').length;
    const expired = records.filter(r => deriveStatusLabel(r) === 'expired').length;
    const revoked = records.filter(r => deriveStatusLabel(r) === 'revoked').length;
    return { active, expiringSoon, expired, revoked };
  }, [records]);

  const filteredIds = useMemo(() => {
    let result = records;
    if (filter !== 'all') {
      result = result.filter(r => deriveStatusLabel(r) === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        r => r.name.toLowerCase().includes(q) || r.matric_number.toLowerCase().includes(q)
      );
    }
    return result;
  }, [records, filter, search]);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      const { error } = await supabase
        .from('id_replacements')
        .update({ is_valid: false })
        .eq('matric_number', revokeTarget.matric_number);

      if (error) throw error;
      toast.success(`${revokeTarget.name}'s ID access has been revoked`);
      setShowRevokeDialog(false);
      setRevokeTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to revoke access');
    }
  };

  if (isLoading && records.length === 0) {
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
        <p className="text-5xl font-black text-white tracking-tight">ID Status</p>
        <p className="text-sm text-slate-400 mt-1">
          Overview of all student ID card access states
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Active" value={summary.active} className="text-green-500" />
        <SummaryCard label="Expiring Soon" value={summary.expiringSoon} className="text-yellow-500" />
        <SummaryCard label="Expired" value={summary.expired} className="text-red-500" />
        <SummaryCard label="Revoked" value={summary.revoked} className="text-red-500" />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter:</span>
          <Select value={filter} onValueChange={(v: StatusValue) => setFilter(v)}>
            <SelectTrigger className="h-10 w-36 bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue placeholder="All IDs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All IDs</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or matric no..."
            className="h-10 w-64 pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-blue-400">
          Expiry dates are set during the verification process. To update a student's expiry, ask them to repay and reverify.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <Th>Student Name</Th>
                <Th>Matric No.</Th>
                <Th>Issued On</Th>
                <Th>Expires On</Th>
                <Th>Days Remaining</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filteredIds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500 font-medium">
                    No ID records found.
                  </td>
                </tr>
              ) : (
                filteredIds.map((row) => {
                  const now = new Date();
                  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
                  const daysRemaining = expiresAt
                    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  const status = deriveStatusLabel(row);
                  const isRevoked = status === 'revoked';
                  const isExpired = status === 'expired';

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <Td className="font-medium text-white">{row.name}</Td>
                      <Td>
                        <span className="font-mono text-xs text-slate-400">{row.matric_number}</span>
                      </Td>
                      <Td className="text-slate-400 text-xs whitespace-nowrap">
                        {formatReceiptDate(row.requested_at)}
                      </Td>
                      <Td className="text-slate-400 text-xs whitespace-nowrap">
                        {row.expires_at ? formatReceiptDate(row.expires_at) : '—'}
                      </Td>
                      <Td className={`text-sm font-mono ${
                        isRevoked
                          ? 'text-slate-500'
                          : daysRemaining !== null && daysRemaining <= 0
                            ? 'text-red-500'
                            : ''
                      }`}>
                        {isRevoked
                          ? '—'
                          : daysRemaining === null
                            ? '—'
                            : daysRemaining === 0
                              ? 'Today'
                              : daysRemaining < 0
                                ? `Overdue by ${Math.abs(daysRemaining)} days`
                                : `${daysRemaining}d`}
                      </Td>
                      <Td>
                        <IDStatusBadge badgeLabel={status} />
                      </Td>
                      <Td>
                        {!isRevoked && !isExpired ? (
                          <Button
                            variant="destructive"
                            size="xs"
                            onClick={() => {
                              setRevokeTarget(row);
                              setShowRevokeDialog(true);
                            }}
                            className="gap-1"
                          >
                            <Ban className="h-3 w-3" />
                            Revoke Access
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                  <Button
                                    variant="destructive"
                                    size="xs"
                                    disabled
                                    className="gap-1 opacity-50"
                                  >
                                    <Ban className="h-3 w-3" />
                                    Revoke Access
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Already inactive</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-slate-500 mt-3 text-right">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ShieldAlert className="text-red-500" />
            </AlertDialogMedia>
            <AlertDialogTitle>Revoke ID Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately deny{' '}
              <strong className="text-foreground">{revokeTarget?.name}</strong> (
              <span className="font-mono">{revokeTarget?.matric_number}</span>)
              access to their digital ID. They will be redirected to the payment page on next login.
              This action can be reversed by setting a new expiry date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRevoke}>
              Yes, Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IDStatus;
