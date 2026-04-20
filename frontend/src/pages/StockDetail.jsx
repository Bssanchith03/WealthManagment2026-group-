import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowLeft, Star, Plus, X, Check, Award, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { hallOfFame } from '../constants/hallOfFame';

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
  const [investType, setInvestType] = useState('BUY'); // 'BUY' or 'SELL'
  const [sharesToBuy, setSharesToBuy] = useState('');
  const [investError, setInvestError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [userHoldings, setUserHoldings] = useState(0);

  const ranges = ['1W', '1M', '3M', '6M', '1Y'];

  useEffect(() => {
    // Check if pinned and get holdings
    fetch(`http://localhost:5001/api/portfolio/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if(data.watchlist && data.watchlist.includes(symbol?.toUpperCase())) {
          setIsPinned(true);
        }
        const holding = data.holdings.find(h => h.symbol === symbol?.toUpperCase());
        if (holding) setUserHoldings(parseFloat(holding.shares));
      });
    
    // Fetch bank accounts
    fetch(`http://localhost:5001/api/accounts/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setAccounts(data);
        if (data.length > 0) setSelectedAccountId(data[0].id);
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
    if (!selectedAccountId) return setInvestError("Select a bank account");
    
    const selectedAccount = accounts.find(a => a.id === parseInt(selectedAccountId));
    const totalValue = sharesNum * stock.price;

    if (investType === 'BUY' && (!selectedAccount || parseFloat(selectedAccount.balance) < totalValue)) {
      return setInvestError("Insufficient funds in selected account");
    }

    if (investType === 'SELL' && sharesNum > userHoldings) {
      return setInvestError("Insufficient shares to sell");
    }

    try {
      const res = await fetch('http://localhost:5001/api/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          symbol: stock.symbol,
          type: investType,
          shares: sharesNum,
          price: stock.price,
          accountId: selectedAccountId
        })
      });
      if(!res.ok) {
         const d = await res.json();
         throw new Error(d.error);
      }
      
      const diff = investType === 'BUY' ? -totalValue : totalValue;
      updateBalance(parseFloat(user.liquid_cash) + diff);
      
      setShowInvest(false);
      setSharesToBuy('');
      setInvestError('');
      window.location.reload(); 
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

  const isCommodity = symbol?.toUpperCase() === 'GC=F' || symbol?.toUpperCase() === 'SI=F';
  const isCrypto = symbol?.toUpperCase().endsWith('-USD');
  const unitLabel = isCommodity ? 'Ounces' : isCrypto ? 'Coins' : 'Shares';

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
          
          {userHoldings > 0 && (
             <button 
               onClick={() => { setInvestType('SELL'); setShowInvest(true); }}
               className="flex items-center gap-2 bg-[#222] border border-[#333] hover:border-red-500/50 text-red-500 font-bold px-5 py-2.5 rounded-xl transition-colors"
             >
               Sell {unitLabel}
             </button>
          )}

          <button 
            onClick={() => { setInvestType('BUY'); setShowInvest(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-emerald-400 text-[#111] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus size={20} /> Buy {unitLabel}
          </button>
        </div>
      </div>

      {userHoldings > 0 && (
         <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-6 rounded-r-2xl mb-8 flex justify-between items-center">
            <div>
               <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-1">Your Portfolio</p>
               <h3 className="text-xl font-bold text-white">{userHoldings.toFixed(2)} {unitLabel}</h3>
               <p className="text-xs text-gray-400 mt-1">Market Value: <span className="text-white font-bold">${(userHoldings * stock.price).toFixed(2)}</span></p>
            </div>
         </div>
      )}

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

      {showInvest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[32px] p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowInvest(false)}
              className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-1">{investType === 'BUY' ? 'Invest in' : 'Sell'} {stock.symbol}</h2>
            <p className="text-sm text-gray-500 mb-8 font-medium">Price: ${stock.price.toFixed(2)} / {unitLabel}</p>

            {investError && <p className="text-red-500 text-sm mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{investError}</p>}

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Quantity</label>
                <input 
                  type="number" 
                  value={sharesToBuy}
                  onChange={(e) => setSharesToBuy(e.target.value)}
                  placeholder={`Amount of ${unitLabel.toLowerCase()}`} 
                  className="w-full bg-[#111] border border-[#222] focus:border-primary rounded-2xl p-4 text-white placeholder-gray-600 outline-none transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Select Account</label>
                <select 
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] focus:border-primary rounded-2xl p-4 text-white appearance-none outline-none transition-colors"
                >
                  <option value="">Choose Bank Account</option>
                  {accounts.map(acc => (
                     <option key={acc.id} value={acc.id}>
                        {acc.bank_name} (${parseFloat(acc.balance).toLocaleString()})
                     </option>
                  ))}
                </select>
              </div>

              {sharesToBuy && parseFloat(sharesToBuy) > 0 && (
                 <div className="bg-[#111] border border-[#222] p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-top-2 duration-200">
                   <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Total {investType === 'BUY' ? 'Cost' : 'Proceeds'}</p>
                   <p className="text-lg font-black text-white">${(parseFloat(sharesToBuy) * stock.price).toFixed(2)}</p>
                 </div>
              )}

              <button 
                onClick={handleInvest}
                className={`w-full ${investType === 'BUY' ? 'bg-primary' : 'bg-red-500'} text-black font-black py-5 rounded-2xl shadow-xl transition-all`}
              >
                Confirm {investType === 'BUY' ? 'Buy' : 'Sell'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strategic Legacy: Hall of Fame Section */}
      {(() => {
        const fameData = hallOfFame.find(h => h.symbol === symbol?.toUpperCase());
        if (!fameData) return null;
        
        return (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                <Award className="text-primary" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Strategic Legacy</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">10-Year Hall of Fame</span>
                  <div className="h-px w-12 bg-primary/30"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Detailed Description */}
              <div className="lg:col-span-2 bg-[#151515] border border-white/5 rounded-[32px] p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                   <History size={200} />
                </div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   Market Analysis
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm font-medium relative z-10">
                   {fameData.detailedDesc}
                </p>
              </div>

              {/* Stats & ROI Card */}
              <div className="bg-gradient-to-br from-primary/10 via-[#111] to-black border border-primary/20 rounded-[32px] p-8 flex flex-col justify-between">
                <div>
                   <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-6">Historical Performance</p>
                   <div className="space-y-6">
                      <div>
                         <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">10Y Return on Investment</p>
                         <p className="text-4xl font-black text-white tracking-tighter">{fameData.stats.decadeReturn}</p>
                      </div>
                      <div className="h-px bg-white/5 w-full"></div>
                      <div>
                         <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Strategic Role</p>
                         <p className="text-lg font-bold text-white">{fameData.stats.role}</p>
                      </div>
                      <div>
                         <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Volatility Profile</p>
                         <p className="text-lg font-bold text-white">{fameData.stats.volatility}</p>
                      </div>
                   </div>
                </div>
                <div className="mt-8">
                   <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-tight">
                      This asset is categorized as a "Grand Historical Giant" based on a decade of compounding excellence.
                   </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
