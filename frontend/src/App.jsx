import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import StockDetail from './pages/StockDetail';
import Currencies from './pages/Currencies';
import FixedDeposits from './pages/FixedDeposits';
import News from './pages/News';
import Subscriptions from './pages/Subscriptions';
import Crypto from './pages/Crypto';
import Loans from './pages/Loans';
import TransactionalAccounts from './pages/TransactionalAccounts';

function Layout({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        
        {/* Main App Routes */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/stocks" element={<Layout><Stocks /></Layout>} />
        <Route path="/stocks/:symbol" element={<Layout><StockDetail /></Layout>} />
        <Route path="/currencies" element={<Layout><Currencies /></Layout>} />
        <Route path="/fixed-deposits" element={<Layout><FixedDeposits /></Layout>} />
        <Route path="/subscriptions" element={<Layout><Subscriptions /></Layout>} />
        <Route path="/crypto" element={<Layout><Crypto /></Layout>} />
        <Route path="/accounts" element={<Layout><TransactionalAccounts /></Layout>} />
        <Route path="/loans" element={<Layout><Loans /></Layout>} />
        <Route path="/news" element={<Layout><News /></Layout>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
