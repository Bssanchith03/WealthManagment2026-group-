import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  TrendingUp, 
  DollarSign, 
  Landmark, 
  FileText,
  BarChart2
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutGrid },
  { name: 'Stocks', path: '/stocks', icon: TrendingUp },
  { name: 'Currencies', path: '/currencies', icon: DollarSign },
  { name: 'Fixed Deposits', path: '/fixed-deposits', icon: Landmark },
  { name: 'News', path: '/news', icon: FileText },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-[#111111] border-r border-[#222] h-full flex flex-col pt-6 pb-6 px-4">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-[#1a2e22] p-2 rounded-lg text-primary">
          <BarChart2 size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-tight">InvestFlow</h1>
          <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">Portfolio Tracker</p>
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
      <div className="bg-[#1a1a1a] rounded-xl p-4 mt-auto border border-[#222]">
        <p className="text-xs text-gray-400 mb-2">Market Status</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-sm font-semibold">Markets Open</span>
        </div>
      </div>
    </div>
  );
}
