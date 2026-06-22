import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useIDStatusPoll } from './hooks/useIDStatusPoll';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Signup from './pages/Signup';
import IDCard from './pages/IDCard';
import Verify from './pages/Verify';
import StatusPage from './pages/StatusPage';
import PaymentPage from './pages/PaymentPage';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AwaitingVerification from './pages/admin/AwaitingVerification';
import Waitlisted from './pages/admin/Waitlisted';
import IDStatus from './pages/admin/IDStatus';
import Transactions from './pages/admin/Transactions';

import './App.css';

const SessionPoll = () => {
  const { pathname } = useLocation();
  const isStudentRoute =
    !pathname.startsWith('/verify') &&
    !pathname.startsWith('/signup') &&
    !pathname.startsWith('/admin') &&
    pathname !== '/';
  useIDStatusPoll(isStudentRoute);
  return null;
};

const TITLE_MAP: Record<string, string> = {
  '/': 'Login',
  '/signup': 'Sign Up',
  '/status': 'Status',
  '/payment': 'Payment',
};

const PREFIX_TITLE_MAP: [string, string][] = [
  ['/card/', 'My ID Card'],
  ['/verify/', 'Verify Student'],
  ['/admin/verifications/awaiting', 'Admin - Awaiting Verification'],
  ['/admin/verifications/waitlisted', 'Admin - Waitlisted'],
  ['/admin/id-status', 'Admin - ID Status'],
  ['/admin/transactions', 'Admin - Transactions'],
  ['/admin', 'Admin'],
];

const TitleUpdater = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const exact = TITLE_MAP[pathname];
    if (exact) {
      document.title = `${exact} | TID Portal`;
      return;
    }
    const match = PREFIX_TITLE_MAP.find(([prefix]) => pathname.startsWith(prefix));
    if (match) {
      document.title = `${match[1]} | TID Portal`;
      return;
    }
    document.title = 'TID Portal';
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <div className="dark min-h-screen bg-background font-sans text-foreground">
        <SessionPoll />
        <TitleUpdater />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup/:id?" element={<Signup />} />
          <Route path="/card/:id" element={<IDCard />} />
          <Route path="/verify/:id" element={<Verify />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/verifications/awaiting" replace />} />
              <Route path="/admin/verifications/awaiting" element={<AwaitingVerification />} />
              <Route path="/admin/verifications/waitlisted" element={<Waitlisted />} />
              <Route path="/admin/id-status" element={<IDStatus />} />
              <Route path="/admin/transactions" element={<Transactions />} />
              <Route path="/admin/verifications" element={<Navigate to="/admin/verifications/awaiting" replace />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
