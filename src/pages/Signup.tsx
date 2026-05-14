import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserPlus, Lock, Eye, EyeOff } from 'lucide-react';
import type { Student } from '@/types/database';
import AuthSplitLayout from '@/components/AuthSplitLayout';

const Signup = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [searchMatric, setSearchMatric] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;
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

      if (data.password) {
        toast.info('Password already set. Please log in.');
        navigate('/');
        return;
      }

      setStudent(data);
    }
    fetchStudent();
  }, [id, navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMatric) return toast.error('Please enter your matric number');

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('matric_number', searchMatric.trim())
        .single();

      if (error || !data) {
        toast.error('Student record not found. Please verify your matric number.');
        return;
      }

      if (data.password) {
        toast.info('Account already setup. Please log in.');
        navigate('/');
        return;
      }

      setStudent(data);
    } catch (err) {
      console.error(err);
      toast.error('Verification failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (!password) return toast.error('Please enter a password');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ password })
        .eq('id', student.id);

      if (error) throw error;

      toast.success('Account setup complete! You can now log in.');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {!student ? (
          <>
            <div className="text-center">
              <p className="text-[50px] font-black  text-white">Find Your Record</p>
              <p className="mt-2 text-sm text-slate-400">
                Enter your matriculation number to begin
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Matriculation Number
                </label>
                <Input
                  value={searchMatric}
                  onChange={(e) => setSearchMatric(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 transition-all rounded-xl shadow-inner"
                  placeholder="e.g. 190403012"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSearching}
                className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs transition-all rounded-xl"
              >
                {isSearching ? 'Verifying...' : 'Verify Record'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.3)] ring-1 ring-green-500/30">
                <UserPlus className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-[50px]  text-white">Setup Account</p>
              <p className="mt-2 text-[30px] text-slate-400">
                Welcome, <span className="font-bold text-white">{student.name}</span>
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-green-500 transition-all rounded-xl shadow-inner"
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

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-green-500 transition-all rounded-xl shadow-inner pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-white hover:text-white/80 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 mt-6 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-xs transition-all rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]"
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthSplitLayout>
  );
}

export default Signup;
