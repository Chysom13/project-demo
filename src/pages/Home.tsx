import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getIDStatus } from '@/lib/idStatus';
import { formatReceiptDate } from '@/lib/receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import AuthSplitLayout from '@/components/AuthSplitLayout';

const Home = () => {
  sessionStorage.clear();
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricNumber) return toast.error('Please enter your matric number');

    setIsLoading(true);
    try {
      // 1. Fetch student
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('matric_number', matricNumber.trim())
        .single();

      if (error || !student) {
        toast.error('No student found with this matric number');
        return;
      }

      // 2. Check for password
      if (!student.password) {
        toast.info('Account not yet setup. Please click "Setup Account" below to begin.');
        return;
      }

      // 3. Verify password (simple check for now, in production use auth.signInWithPassword)
      // Note: If using custom password field, we check it here
      if (student.password !== password) {
        toast.error('Invalid password');
        return;
      }

      toast.success('Login successful!');

      sessionStorage.setItem('matric_number', student.matric_number);
      sessionStorage.setItem('student_name', student.name);

      // 4. Check ID status via utility and route accordingly
      const status = await getIDStatus(student.matric_number);

      switch (status.status_label) {
        case 'active':
        case 'expiring_soon':
          navigate(`/card/${student.id}`);
          break;

        case 'pending':
          navigate('/status', {
            state: {
              receiptNumber: null,
              fromLogin: true,
              matricNumber: student.matric_number,
            },
          });
          break;

        case 'waitlisted':
          navigate('/status', {
            state: {
              fromLogin: true,
              matricNumber: student.matric_number,
            },
          });
          toast.error('Your verification is on hold. Check your status for details.');
          break;

        case 'expired':
          navigate('/payment', {
            state: {
              matricNumber: student.matric_number,
              studentName: student.name,
            },
          });
          toast.error(`Your ID expired on ${formatReceiptDate(status.expires_at)}. Please renew.`);
          break;

        case 'revoked':
          navigate('/payment', {
            state: {
              matricNumber: student.matric_number,
              studentName: student.name,
            },
          });
          toast.error('Your access has been revoked. Contact the admin office.');
          break;

        default:
          // not_found — first time or no active ID
          navigate('/payment', {
            state: {
              matricNumber: student.matric_number,
              studentName: student.name,
            },
          });
          break;
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
          <p className="text-[50px] font-black tracking-tight text-white ">Welcome Back</p>
          <p className="mt-2 text-sm text-slate-400">Login to access your digital ID</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Matriculation Number
            </label>
            <Input
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 transition-all rounded-xl shadow-inner"
              placeholder="e.g. 190403012"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 transition-all rounded-xl shadow-inner pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-white hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs transition-all rounded-xl"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-white/5">
          <p className="text-sm text-slate-400">
            New student?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-400 font-bold hover:underline"
            >
              Setup Account
            </button>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}

export default Home;
