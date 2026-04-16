import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Clock, Banknote } from 'lucide-react';
import StatCard from '../components/StatCard';
import StockRow from '../components/StockRow';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [portfolio, setPortfolio] = useState({ liquid_cash: user?.liquid_cash || 0, holdings: [], watchlist: [] });
  const [liveHoldings, setLiveHoldings] = useState([]);
  const [liveWatchlist, setLiveWatchlist] = useState([]);
  const [liveCommodities, setLiveCommodities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch portfolio state
  useEffect(() => {
    if (!user) return;
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/portfolio/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPortfolio(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPortfolio();
  }, [user]);

  // Fetch live market data for everything
  useEffect(() => {
    const fetchLiveStats = async () => {
      if (!portfolio.holdings && !portfolio.watchlist) return;
      
      try {
        // Collect all unique symbols we need
        const symbolsToFetch = new Set([
            ...portfolio.holdings.map(h => h.symbol),
            ...portfolio.watchlist
        ]);

        const cache = {};
        for (let sym of symbolsToFetch) {
            const res = await fetch(`http://localhost:8000/api/ticker/${sym}`);
            if (res.ok) cache[sym] = await res.json();
        }

        // Map Holdings
        const mappedHoldings = portfolio.holdings.map(h => {
             const live = cache[h.symbol] || { price: h.average_price, change: 0, change_percent: 0 };
             return {
                 symbol: h.symbol,
                 shares: h.shares,
                 avgPrice: h.average_price,
                 totalValue: live.price * h.shares,
                 change: live.change,
                 changePercent: live.change_percent
             };
        });
        setLiveHoldings(mappedHoldings);

        // Map Watchlist
        const mappedWatchlist = portfolio.watchlist.map(sym => {
             const live = cache[sym] || { name: sym, price: 0, change: 0, change_percent: 0 };
             return {
                symbol: sym,
                name: live.name,
                price: live.price,
                change: live.change,
                changePercent: live.change_percent
             };
        });
        setLiveWatchlist(mappedWatchlist);

        // Fetch Commodities (Gold = GC=F, Silver = SI=F typically in Yahoo)
        const com_gc = await fetch(`http://localhost:8000/api/ticker/GC=F`);
        const com_si = await fetch(`http://localhost:8000/api/ticker/SI=F`);
        
        let commodities = [];
        if (com_gc.ok) {
            const g = await com_gc.json();
            commodities.push({ symbol: 'Gol', name: 'Gold', subtitle: '/oz', icon: 'Au', price: g.price, change: g.change, changePercent: g.change_percent });
        }
        if (com_si.ok) {
            const s = await com_si.json();
            commodities.push({ symbol: 'Sil', name: 'Silver', subtitle: '/oz', icon: 'Ag', price: s.price, change: s.change, changePercent: s.change_percent });
        }
        setLiveCommodities(commodities);
        setLoading(false);
      } catch (e) {
          console.error(e);
      }
    };
    
    if (portfolio.holdings.length > 0 || portfolio.watchlist.length > 0) {
        fetchLiveStats();
    } else {
        setLoading(false);
        // Still load commodities if empty portfolio
        const loadComms = async () => {
            const com_gc = await fetch(`http://localhost:8000/api/ticker/GC=F`);
            const com_si = await fetch(`http://localhost:8000/api/ticker/SI=F`);
            let commodities = [];
            if (com_gc.ok) { const g = await com_gc.json(); commodities.push({ symbol: 'Gol', name: 'Gold', subtitle: '/oz', icon: 'Au', price: g.price, change: g.change, changePercent: g.change_percent }); }
            if (com_si.ok) { const s = await com_si.json(); commodities.push({ symbol: 'Sil', name: 'Silver', subtitle: '/oz', icon: 'Ag', price: s.price, change: s.change, changePercent: s.change_percent }); }
            setLiveCommodities(commodities);
        };
        loadComms();
    }
  }, [portfolio]);

  const totalInvested = portfolio.holdings.reduce((sum, h) => sum + (h.shares * h.average_price), 0);
  const totalValue = liveHoldings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalPl = totalValue - totalInvested;
  const plPercent = totalInvested > 0 ? (totalPl / totalInvested) * 100 : 0;
  
  const liquidCashVal = parseFloat(portfolio.liquid_cash) || 0;
  const formattedInvested = totalInvested.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formattedValue = (totalValue + liquidCashVal).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formattedPl = totalPl.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formattedCash = liquidCashVal.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Your portfolio overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Portfolio Value" amount={formattedValue} icon={Wallet} />
        <StatCard 
            title="Total Profit/Loss" 
            amount={formattedPl} 
            changeText={`${totalPl >= 0 ? '+' : ''}${plPercent.toFixed(2)}% all time`} 
            changePositive={totalPl >= 0} 
            icon={totalPl >= 0 ? TrendingUp : TrendingDown} 
        />
        <StatCard title="Total Invested" amount={formattedInvested} icon={TrendingDown} />
        <StatCard title="Liquid Cash" amount={formattedCash} icon={Banknote} />
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Holdings */}
        <div className="bg-[#151515] border border-[#222] rounded-[20px] p-6 relative overflow-hidden">
          <h2 className="text-lg font-bold text-white mb-6">Your Holdings</h2>
          <div className="space-y-2">
            {liveHoldings.length === 0 && !loading ? (
                <p className="text-gray-500 text-sm">No holdings yet. Search for a stock to invest.</p>
            ) : (
                liveHoldings.map((h, i) => (
                    <StockRow key={i} {...h} type="holding" />
                ))
            )}
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-[#151515] border border-[#222] rounded-[20px] p-6 relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Watchlist</h2>
            <button className="text-primary text-sm font-semibold hover:text-green-400">See All</button>
          </div>
          <div className="space-y-4">
            {liveWatchlist.length === 0 && !loading ? (
                <p className="text-gray-500 text-sm">No watched stocks yet. Star some stocks to track them here!</p>
            ) : (
                liveWatchlist.map((w, i) => (
                    <StockRow key={i} {...w} type="watchlist" />
                ))
            )}
          </div>
        </div>

      </div>

      {/* Commodities */}
      <div className="bg-[#151515] border border-[#222] rounded-[20px] p-6">
        <h2 className="text-lg font-bold text-white mb-6">Commodities</h2>
        <div className="space-y-4">
          {liveCommodities.map((c, i) => {
            const isPositive = c.change >= 0;
            const sparklineColor = isPositive ? '#10b981' : '#ef4444';
            const sparklinePath = isPositive 
              ? "M0 15 Q 10 5, 20 10 T 40 5 T 60 10 T 80 0" 
              : "M0 0 Q 10 10, 20 5 T 40 10 T 60 5 T 80 15";

            // Map Gold to GC=F and Silver to SI=F for navigation
            const symbolRoute = c.symbol === 'Gol' ? 'GC=F' : 'SI=F';

            return (
              <div 
                key={i} 
                onClick={() => navigate(`/stocks/${symbolRoute}`)}
                className="flex items-center justify-between py-3 border-b border-[#222] last:border-0 px-2 hover:bg-[#1a1a1a] rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4 w-1/3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[#eab308] bg-[#eab308]/10 border border-[#eab308]/20">
                    {c.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{c.name}</h4>
                    <p className="text-xs text-gray-500">{c.subtitle}</p>
                  </div>
                </div>

                <div className="w-1/3 flex justify-center opacity-60">
                   <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d={sparklinePath} stroke={sparklineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                </div>

                <div className="w-1/3 text-right">
                  <h4 className="text-white font-bold">${c.price.toFixed(2)}</h4>
                  <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isPositive ? 'text-primary' : 'text-red-500'}`}>
                     {isPositive ? '+' : ''}{c.change.toFixed(2)} ({isPositive ? '+' : ''}{c.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
