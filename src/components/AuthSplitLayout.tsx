import type { ReactNode } from 'react';
import Navbar from './Navbar';
import { ShieldCheck } from 'lucide-react';

interface AuthSplitLayoutProps {
  children: ReactNode;
  hideNavbar?: boolean;
}

const AuthSplitLayout = ({ children, hideNavbar }: AuthSplitLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {!hideNavbar && <Navbar />}
      
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Side: 50% Welcome Message */}
        <div className="w-full lg:w-[50%] bg-slate-900 p-12 lg:p-24 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/5 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800 shadow-sm ring-1 ring-white/10">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <p className="text-5xl lg:text-7xl font-black tracking-tight leading-tight text-white">
              MTU Digital Identity <br />
              <span className="text-white">Access Portal</span>
            </p>
            <p className="mt-6 text-xl text-slate-400 font-medium max-w-lg leading-relaxed">
              Securely manage your official student credentials, process replacements, and verify your active status.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[50%] bg-slate-950 p-8 lg:p-12 flex flex-col justify-center items-center relative">
          <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
            {children}
          </div>
          <div className="absolute bottom-6 text-center w-full">
            <p className="text-xs text-slate-500">
              TID &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSplitLayout;
