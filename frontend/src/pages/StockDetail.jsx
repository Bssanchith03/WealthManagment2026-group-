import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowLeft, Star, Plus, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  
  const [activeRange, setActiveRange] = useState('1M');
  const [stock, setStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive States
  const [isPinned, setIsPinned] = useState(false);
  const [showInvest, setShowInvest] = useState(false);
  const [sharesToBuy, setSharesToBuy] = useState('');
  const [investError, setInvestError] = useState('');

  const ranges = ['1W', '1M', '3M', '6M', '1Y'];

  useEffect(() => {
    // Check if pinned initially
    fetch(`http://localhost:5001/api/portfolio/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if(data.watchlist && data.watchlist.includes(symbol?.toUpperCase())) {
          setIsPinned(true);
        }
      });
  }, [symbol, user.id]);

  useEffect(() => {
    const fetchLiveDetails = async () => {
      setLoading(true);
      try {
        const tickerRes = await fetch(`http://localhost:8000/api/ticker/${symbol}`);
        if (!tickerRes.ok) throw new Error("Ticker fetch failed");
        const tickerData = await tickerRes.json();
        setStock(tickerData);

        const histRes = await fetch(`http://localhost:8000/api/history/${symbol}?range=${activeRange}`);
        if (histRes.ok) {
          const histData = await histRes.json();
          setChartData(histData.history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveDetails();
  }, [symbol, activeRange]);

  const togglePin = async () => {
    const newStatus = !isPinned;
    setIsPinned(newStatus);
    fetch('http://localhost:5001/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, symbol: stock.symbol, action: newStatus ? 'add' : 'remove' })
    });
  };

  const handleInvest = async () => {
    const sharesNum = parseFloat(sharesToBuy);
    if (!sharesNum || sharesNum <= 0) return setInvestError("Enter a valid number");
    
    if (user.liquid_cash < (sharesNum * stock.price)) {
      return setInvestError("Insufficient liquid cash");
    }

    try {
      const res = await fetch('http://localhost:5001/api/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          symbol: stock.symbol,
          type: 'BUY',
          shares: sharesNum,
          price: stock.price
        })
      });
      if(!res.ok) {
         const d = await res.json();
         throw new Error(d.error);
      }
      // Success
      updateBalance(user.liquid_cash - (sharesNum * stock.price));
      setShowInvest(false);
      setSharesToBuy('');
      setInvestError('');
    } catch(err) {
      setInvestError(err.message);
    }
  };

  if (loading && !stock) {
    return <div className="p-8 text-center text-gray-500">Loading live data...</div>;
  }

  if (!stock) {
    return <div className="p-8 text-center text-red-500">Failed to load stock data.</div>;
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="p-8 pb-20 max-w-5xl mx-auto relative">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm font-semibold"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">{stock.symbol}</h1>
              <span className="text-[11px] bg-[#222] border border-[#333] px-2.5 py-0.5 rounded-full text-gray-400 font-semibold uppercase">{stock.sector || stock.category}</span>
           </div>
           <p className="text-gray-400 mb-4">{stock.name}</p>
           
           <div className="flex items-end gap-3">
              <h2 className="text-4xl font-bold text-white">${stock.price.toFixed(2)}</h2>
              <div className={`flex items-center gap-1 text-sm font-bold pb-1 ${isPositive ? 'text-primary' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.change_percent.toFixed(2)}%)
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={togglePin}
            className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-[#eab308] hover:bg-[#2a2a2a] transition-colors"
          >
            <Star size={20} fill={isPinned ? "#eab308" : "transparent"} stroke={isPinned ? "#eab308" : "#999"} />
          </button>
          <button 
            onClick={() => setShowInvest(true)}
            className="flex items-center gap-2 bg-primary hover:bg-emerald-400 text-[#111] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus size={20} /> Invest
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#151515] border border-[#222] rounded-[24px] p-6 mb-6">
         <div className="flex items-center gap-4 mb-6">
            {ranges.map(r => (
               <button 
                 key={r}
                 onClick={() => setActiveRange(r)}
                 className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                   activeRange === r ? 'bg-[#1a2e22] text-primary' : 'text-gray-500 hover:text-white'
                 }`}
               >
                 {r}
               </button>
            ))}
         </div>

         <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#777', fontSize: 11 }}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#777', fontSize: 11 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPositive ? '#10b981' : '#ef4444'} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: isPositive ? '#10b981' : '#ef4444', stroke: '#111', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">Loading chart...</div>
            )}
         </div>
      </div>

      {/* Detail Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: `$${stock.open.toFixed(2)}` },
          { label: 'High', value: `$${stock.high?.toFixed(2) || 'N/A'}` },
          { label: 'Low', value: `$${stock.low?.toFixed(2)  || 'N/A'}` },
          { label: 'Volume', value: stock.volume ? (stock.volume / 1000000).toFixed(1) + 'M' : '0M' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#151515] border border-[#222] rounded-[16px] p-5 flex flex-col justify-between">
             <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
             <p className="text-white font-bold text-xl">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Invest Modal Overlay */}
      {showInvest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[24px] p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowInvest(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-1">Invest in {stock.symbol}</h2>
            <p className="text-sm text-gray-400 mb-6">Current Price: ${stock.price.toFixed(2)}</p>

            {investError && <p className="text-red-500 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{investError}</p>}

            <div className="mb-6">
              <input 
                type="number" 
                value={sharesToBuy}
                onChange={(e) => setSharesToBuy(e.target.value)}
                placeholder="Number of shares" 
                className="w-full bg-[#111] border border-primary/50 focus:border-primary rounded-xl p-4 text-white placeholder-gray-500 outline-none transition-colors"
                autoFocus
              />
              {sharesToBuy && parseFloat(sharesToBuy) > 0 && (
                 <p className="text-xs text-gray-400 mt-3 pl-1">
                   Estimated Cost: <span className="font-bold text-white">${(parseFloat(sharesToBuy) * stock.price).toFixed(2)}</span>
                   <br/>
                   Available Cash: <span className="text-primary">${user.liquid_cash.toFixed(2)}</span>
                 </p>
              )}
            </div>

            <button 
              onClick={handleInvest}
              className="w-full bg-[#2f7543] hover:bg-primary text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              Confirm Investment
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
