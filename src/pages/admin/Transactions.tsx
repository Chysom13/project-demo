import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatReceiptDate } from '@/lib/receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Loader2, Download, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaymentTransaction {
  id: string;
  matric_number: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  receipt_number: string;
  created_at: string;
  id_replacement_id: string | null;
}

interface TransactionRow {
  id: string;
  receipt_number: string;
  student_name: string;
  matric_number: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
}

interface IDStatusLookup {
  [matric: string]: { is_valid: boolean; verification_status: string | null };
}

type StatusFilter = 'all' | 'success' | 'failed' | 'pending';

const PAGE_SIZE = 20;

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

const StatusBadge = ({ status }: { status: 'success' | 'failed' | 'pending' }) => {
  const styles: Record<string, string> = {
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || ''}`}
    >
      {status}
    </span>
  );
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [idStatusMap, setIdStatusMap] = useState<IDStatusLookup>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: students } = await supabase
        .from('students')
        .select('matric_number, name');

      const lookup: Record<string, string> = {};
      if (students) {
        for (const s of students) {
          lookup[s.matric_number] = s.name;
        }
      }

      let query = supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString());
      }

      const [txResult, idResult] = await Promise.all([
        query,
        supabase
          .from('id_replacements')
          .select('matric_number, is_valid, verification_status'),
      ]);

      if (txResult.data) {
        setTransactions(
          (txResult.data as PaymentTransaction[]).map((tx) => ({
            ...tx,
            student_name: lookup[tx.matric_number] || '—',
          }))
        );
      }

      const statusMap: IDStatusLookup = {};
      if (idResult.data) {
        for (const r of idResult.data as { matric_number: string; is_valid: boolean; verification_status: string | null }[]) {
          statusMap[r.matric_number] = { is_valid: r.is_valid, verification_status: r.verification_status };
        }
      }
      setIdStatusMap(statusMap);

      setPage(0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    fetchData();
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.matric_number.toLowerCase().includes(q) ||
          tx.student_name.toLowerCase().includes(q) ||
          tx.receipt_number.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((tx) => tx.status === statusFilter);
    }

    return result;
  }, [transactions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = filteredTransactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const summary = useMemo(() => {
    const total = transactions.length;
    const successful = transactions.filter((tx) => tx.status === 'success');
    const failed = transactions.filter((tx) => tx.status === 'failed');
    const totalAmount = successful.reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { total, totalAmount, failed: failed.length };
  }, [transactions]);

  const exportCSV = () => {
    const headers = ['Receipt No.', 'Student Name', 'Matric No.', 'Amount', 'Status', 'Date & Time'];
    const rows = filteredTransactions.map((tx) => [
      tx.receipt_number,
      tx.student_name || '',
      tx.matric_number,
      Number(tx.amount).toFixed(2),
      tx.status,
      formatReceiptDate(tx.created_at),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isInactive = (matric: string) => {
    const info = idStatusMap[matric];
    if (!info) return false;
    return info.verification_status !== 'verified' || !info.is_valid;
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-5xl font-black text-white tracking-tight">Transactions</p>
          <p className="text-sm text-slate-400 mt-1">
            Full payment history across all students
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total Transactions" value={summary.total} />
        <SummaryCard
          label="Total Collected"
          value={`₦${summary.totalAmount.toLocaleString()}`}
          className="text-green-500"
        />
        <SummaryCard
          label="Failed Payments"
          value={summary.failed}
          className="text-red-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, matric, or receipt no..."
            className="h-10 pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={(v: StatusFilter) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="h-10 w-32 bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 w-36 bg-white/5 border-white/10 text-white rounded-xl"
          />
          <span className="text-slate-500 text-sm">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 w-36 bg-white/5 border-white/10 text-white rounded-xl"
          />
          <Button
            onClick={handleFilter}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
          >
            Filter
          </Button>
        </div>
      </div>

      {/* Export + Record Count */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">{filteredTransactions.length} record(s)</span>
        <Button
          onClick={exportCSV}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 px-4 rounded-xl gap-2 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <Th>Receipt No.</Th>
                <Th>Student Name</Th>
                <Th>Matric No.</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Date &amp; Time</Th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 font-medium">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const inactive = isInactive(tx.matric_number);
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <Td>
                        <span className="font-mono text-xs font-bold text-blue-400">
                          {tx.receipt_number}
                        </span>
                      </Td>
                      <Td className="font-medium text-white">{tx.student_name}</Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          {inactive && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-red-500 text-xs cursor-default">⚠</span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  This student's ID is currently inactive
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <span className="font-mono text-xs text-slate-400">{tx.matric_number}</span>
                        </div>
                      </Td>
                      <Td className="font-mono font-bold">
                        ₦{Number(tx.amount).toLocaleString()}
                      </Td>
                      <Td>
                        <StatusBadge status={tx.status} />
                      </Td>
                      <Td className="text-slate-400 text-xs whitespace-nowrap">
                        {formatReceiptDate(tx.created_at)}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredTransactions.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredTransactions.length)} of{' '}
            {filteredTransactions.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-3 w-3" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
