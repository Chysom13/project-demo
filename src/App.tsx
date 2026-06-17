import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const App = () => {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <div className="dark min-h-screen bg-background font-sans text-foreground">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup/:id?" element={<Signup />} />
          <Route path="/card/:id" element={<IDCard />} />
          <Route path="/verify/:matricNumber" element={<Verify />} />
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
