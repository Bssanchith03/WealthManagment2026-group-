import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StockRow({ 
  symbol, 
  name, 
  shares, 
  avgPrice, 
  totalValue, 
  price, 
  change, 
  changePercent, 
  type = 'holding' // 'holding' or 'watchlist' or 'directory'
}) {
  const navigate = useNavigate();
  const isPositive = change >= 0;
  
  // Fake mini sparkline graph based on positive/negative
  const sparklineColor = isPositive ? '#10b981' : '#ef4444';
  const sparklinePath = isPositive 
    ? "M0 15 Q 10 5, 20 10 T 40 5 T 60 10 T 80 0" 
    : "M0 0 Q 10 10, 20 5 T 40 10 T 60 5 T 80 15";

  return (
    <div 
      onClick={() => navigate(`/stocks/${symbol}`)}
      className="flex items-center justify-between py-3 border-b border-[#222] last:border-0 hover:bg-[#1a1a1a] px-2 rounded-xl cursor-pointer transition-colors group"
    >
      <div className="flex-1">
        <h4 className="text-white font-bold tracking-wide">{symbol}</h4>
        <p className="text-sm text-gray-500 font-medium">
          {type === 'holding' 
            ? `${shares} ${ (symbol?.toUpperCase() === 'GC=F' || symbol?.toUpperCase() === 'SI=F') ? 'oz' : symbol?.endsWith('-USD') ? 'coins' : 'shares' } @ $${avgPrice}` 
            : name}
        </p>
      </div>

      {type !== 'holding' && (
        <div className="flex-1 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
          <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={sparklinePath} stroke={sparklineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d={`${sparklinePath} L 80 20 L 0 20 Z`} fill={`url(#gradient-${isPositive})`} fillOpacity="0.2"/>
            <defs>
              <linearGradient id={`gradient-${isPositive}`} x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor={sparklineColor} />
                <stop offset="1" stopColor={sparklineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      <div className="flex-1 text-right">
        <h4 className="text-white font-bold tracking-wide">
          ${type === 'holding' ? totalValue.toFixed(2) : price.toFixed(2)}
        </h4>
        <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isPositive ? 'text-primary' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
}
