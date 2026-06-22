import { Link, useLocation } from 'react-router-dom';
import { LogOut, FileText, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onViewReceipt?: () => void;
  onViewID?: () => void;
}

const Navbar = ({ onViewReceipt, onViewID }: NavbarProps) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname.startsWith('/signup');
  const isCardPage = location.pathname.startsWith('/card');

  return (
    <nav className="h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/tid-icon.svg" className="h-8 w-8 object-contain" alt="TID Logo" />
        <span className="text-lg font-black text-white tracking-tight">TID Portal</span>
      </div>

      <div className="flex items-center gap-4">
        {isAuthPage && (
          <>
            <Link 
              to="/" 
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${location.pathname === '/' ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${location.pathname.startsWith('/signup') ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}
            >
              Sign Up
            </Link>
          </>
        )}

        {isCardPage && (
          <>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                onClick={onViewID}
                className="text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
              >
                <CreditCard className="mr-2 h-4 w-4 text-blue-400" />
                Digital ID
              </Button>
              <Button 
                variant="ghost" 
                onClick={onViewReceipt}
                className="text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
              >
                <FileText className="mr-2 h-4 w-4 text-amber-400" />
                View Receipt
              </Button>
            </div>
            <div className="h-4 w-px bg-white/10 mx-2"></div>
            <Link to="/">
              <Button variant="ghost" className="text-slate-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
