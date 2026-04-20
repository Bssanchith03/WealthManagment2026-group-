import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutGrid, 
  TrendingUp, 
  DollarSign, 
  Landmark,
  Building2,
  FileText,
  BarChart2,
  CreditCard,
  Bitcoin,
  Wallet,
  Database,
  LogOut
 } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutGrid },
  { name: 'Portfolio', path: '/portfolio', icon: Wallet },
  { name: 'Stocks', path: '/stocks', icon: TrendingUp },
  { name: 'Crypto', path: '/crypto', icon: Bitcoin },
  { name: 'Accounts', path: '/accounts', icon: Building2 },
  { name: 'Fixed Deposits', path: '/fixed-deposits', icon: Landmark },
  { name: 'Loans', path: '/loans', icon: Wallet },
  { name: 'Currencies', path: '/currencies', icon: DollarSign },
  { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
  { name: 'News', path: '/news', icon: FileText },
  { name: 'Database', path: '/admin/db', icon: Database },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-64 bg-[#111111] border-r border-[#222] h-full flex flex-col pt-6 pb-6 px-4">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-[#1a2e22] p-2 rounded-lg text-primary">
          <BarChart2 size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-tight">ApexInvest</h1>
          <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">Wealth Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
                ${isActive 
                  ? 'bg-[#1a2e22] text-primary border border-[#1f3f2d]' 
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
            >
              <item.icon size={18} className={isActive ? 'text-primary' : 'text-gray-500'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Market Status */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#222] mb-4">
        <p className="text-xs text-gray-400 mb-2">Market Status</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-sm font-semibold">Markets Open</span>
        </div>
      </div>

      {/* Sign Out Action */}
      <div className="pt-4 border-t border-white/5 mx-2">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] group border border-transparent hover:border-red-500/20"
        >
          <div className="bg-red-500/10 p-2 rounded-xl group-hover:bg-red-500/20 transition-all">
            <LogOut size={18} />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
