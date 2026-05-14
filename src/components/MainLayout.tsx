import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: ReactNode;
  onViewReceipt?: () => void;
  onViewID?: () => void;
}

const MainLayout = ({ children, onViewReceipt, onViewID }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar onViewReceipt={onViewReceipt} onViewID={onViewID} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
