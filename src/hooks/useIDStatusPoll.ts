import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIDStatus } from '@/lib/idStatus';

const INTERVAL_MS = 60_000;

export function useIDStatusPoll(active = true) {
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    const check = async () => {
      const matricNumber = sessionStorage.getItem('matric_number');
      if (!matricNumber) return;

      try {
        const status = await getIDStatus(matricNumber);
        if (status.status_label === 'expired' || status.status_label === 'revoked') {
          navigate('/payment', {
            state: {
              matricNumber,
              studentName: sessionStorage.getItem('student_name') || undefined,
            },
          });
        }
      } catch {
        // silent fail
      }
    };

    check();
    intervalRef.current = setInterval(check, INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [navigate, active]);
}
