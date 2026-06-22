import { Outlet, useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import AdminNavbar from '@/components/admin/AdminNavbar';

function buildBreadcrumbs(pathname: string): { label: string; path?: string }[] {
  const crumbs: { label: string; path?: string }[] = [{ label: 'Admin', path: '/admin/verifications/awaiting' }];

  if (pathname.startsWith('/admin/verifications')) {
    crumbs.push({ label: 'Verifications' });
    if (pathname === '/admin/verifications/awaiting') {
      crumbs.push({ label: 'Awaiting Verification' });
    } else if (pathname === '/admin/verifications/waitlisted') {
      crumbs.push({ label: 'Waitlisted' });
    }
  } else if (pathname === '/admin/id-status') {
    crumbs.push({ label: 'ID Status' });
  } else if (pathname === '/admin/transactions') {
    crumbs.push({ label: 'Transactions' });
  }

  return crumbs;
}

const AdminLayout = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <AdminNavbar />

      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 py-2 border-b border-white/5 bg-slate-900/40">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-slate-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />}
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-white transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-300">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
