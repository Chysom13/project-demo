import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from '@/components/ui/navigation-menu';
import {
  UserCheck, ShieldCheck, Wallet, ChevronDown, Menu, X, LogOut, ExternalLink,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Verifications',
    icon: <UserCheck className="h-4 w-4" />,
    children: [
      {
        label: 'Awaiting Verification',
        description: 'Students pending review',
        path: '/admin/verifications/awaiting',
      },
      {
        label: 'Waitlisted',
        description: 'Students with flagged issues',
        path: '/admin/verifications/waitlisted',
      },
    ],
  },
  {
    label: 'ID Status',
    icon: <ShieldCheck className="h-4 w-4" />,
    path: '/admin/id-status',
  },
  {
    label: 'Transactions',
    icon: <Wallet className="h-4 w-4" />,
    path: '/admin/transactions',
  },
];

const AdminNavbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const adminMatric = localStorage.getItem('adminMatricNumber') || 'Not signed in';

  useEffect(() => {
    const fetchWaitlistCount = async () => {
      const { count } = await supabase
        .from('id_replacements')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'waitlisted');
      if (count !== null) setWaitlistCount(count);
    };
    fetchWaitlistCount();
    const interval = setInterval(fetchWaitlistCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isVerificationsActive = location.pathname.startsWith('/admin/verifications');

  const handleLogout = async () => {
    localStorage.removeItem('adminMatricNumber');
    await supabase.auth.signOut().catch(() => {});
  };

  return (
    <nav className="h-14 border-b border-white/5 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Left: Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <img src="/tid-icon.svg" className="h-7 w-7 object-contain" alt="TID Logo" />
        <span className="text-base font-black text-white tracking-tight hidden sm:inline">TID Admin</span>
        <span className="text-base font-black text-white tracking-tight sm:hidden">Admin</span>
      </div>

      {/* Center: Desktop Nav */}
      <div className="hidden md:flex items-center">
        <NavigationMenu>
          <NavigationMenuList>
            {menuItems.map((item) => {
              if ('children' in item && item.children) {
                return (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuTrigger
                      className={
                        isVerificationsActive
                          ? 'text-blue-400 border-b-2 border-blue-500 rounded-none pb-3'
                          : 'text-slate-400 hover:text-white'
                      }
                    >
                      {item.icon}
                      {item.label}
                      {waitlistCount > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-orange-500 text-[8px] font-black text-white leading-none ml-1">
                          {waitlistCount}
                        </span>
                      )}
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/trigger:rotate-180" />
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[260px] p-1 space-y-0.5">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors ${
                              isActive(child.path)
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className="text-sm font-bold flex items-center gap-2">
                              {child.label}
                              {child.path === '/admin/verifications/waitlisted' && waitlistCount > 0 && (
                                <span className="inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-full bg-orange-500 text-[9px] font-black text-white leading-none">
                                  {waitlistCount}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-500">{child.description}</span>
                          </Link>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              }

              const p = (item as { label: string; icon: React.ReactNode; path: string }).path;
              const active = isActive(p);
              return (
                <NavigationMenuItem key={item.label}>
                  <Link
                    to={p}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
                      active
                        ? 'text-blue-400 border-b-2 border-blue-500 pb-3'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Right: Admin Info & Actions */}
      <div className="hidden md:flex items-center gap-3">
        {/* <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
          {adminMatric}
        </span>
        <div className="h-4 w-px bg-white/10" />
        <Link to="/card">
          <Button variant="ghost" size="xs" className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest gap-1">
            <ExternalLink className="h-3 w-3" />
            Portal
          </Button>
        </Link> */}
        <Button
          variant="ghost"
          size="xs"
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest gap-1"
        >
          <LogOut className="h-3 w-3" />
          Logout
        </Button>
      </div>

      {/* Mobile: Hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-slate-900 border-b border-white/10 shadow-xl md:hidden animate-in fade-in-0 slide-in-from-top-2">
          <div className="px-4 py-3 space-y-1">
            {menuItems.map((item) => {
              if ('children' in item && item.children) {
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      {item.icon}
                      {item.label}
                      {waitlistCount > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-orange-500 text-[8px] font-black text-white leading-none">
                          {waitlistCount}
                        </span>
                      )}
                    </div>
                    <div className="ml-4 space-y-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex flex-col gap-0.5 rounded-lg px-3 py-2 transition-colors ${
                            isActive(child.path)
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <span className="text-sm font-bold flex items-center gap-2">
                              {child.label}
                              {child.path === '/admin/verifications/waitlisted' && waitlistCount > 0 && (
                                <span className="inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-full bg-orange-500 text-[9px] font-black text-white leading-none">
                                  {waitlistCount}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-500">{child.description}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              const p = (item as { label: string; icon: React.ReactNode; path: string }).path;
              return (
                <Link
                  key={item.label}
                  to={p}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                    isActive(p)
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}

            <hr className="border-white/5 my-2" />

            <div className="px-3 py-1.5 text-[10px] text-slate-500 font-mono">
              {adminMatric}
            </div>
            <Link
              to="/card"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Back to Portal
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-white/5 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
