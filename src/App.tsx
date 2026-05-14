import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Signup from './pages/Signup';
import IDCard from './pages/IDCard';
import Verify from './pages/Verify';

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
