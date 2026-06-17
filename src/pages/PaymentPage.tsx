import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentPortal from '@/components/PaymentPortal';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    matricNumber?: string;
    studentName?: string;
  } | null;

  useEffect(() => {
    if (!state?.matricNumber) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state?.matricNumber) return null;

  return (
    <PaymentPortal
      matricNumber={state.matricNumber}
      studentName={state.studentName || 'Student'}
      onCancel={() => navigate('/')}
    />
  );
};

export default PaymentPage;
