import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  PieChart as PieChartIcon, 
  Zap, 
  BookOpen, 
  Target,
  ArrowUpRight,
  Info,
  Globe,
  Lock,
  ArrowRight,
  X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

// Strategy DNA Data
const DNA_TOPICS = [
  { 
    id: 1, 
    title: 'Dollar Cost Averaging', 
    icon: <Zap size={14} />, 
    color: 'text-primary', 
    desc: 'Investing fixed amounts regularly lowers your average cost per share over time.' 
  },
  { 
    id: 2, 
    title: 'Asset Correlation', 
    icon: <Globe size={14} />, 
    color: 'text-blue-500', 
    desc: 'Gold often rises when stocks fall. Diversification is your hedge against market panic.' 
  },
  { 
    id: 3, 
    title: 'The Power of 72', 
    icon: <Sparkles size={14} />, 
    color: 'text-yellow-500', 
    desc: 'Divide 72 by your expected return rate to see how many years it takes to double your money.' 
  }
];

const GlassCard = ({ children, className = "", ...props }) => (
  <div className={`bg-[#111] backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [portfolio, setPortfolio] = useState({ liquid_cash: 0, holdings: [], watchlist: [], investment_plan: null });
  const [projections, setProjections] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projYears, setProjYears] = useState(25);
  
  // Macro Perspective State
  const [macroRange, setMacroRange] = useState('10Y');
  const [macroData, setMacroData] = useState([]);
  const [macroLoading, setMacroLoading] = useState(false);
  const [viewType, setViewType] = useState('percent'); // 'price' or 'percent'
  const [visibleAssets, setVisibleAssets] = useState({ nifty: true, nasdaq: true, gold: true, btc: true });

  const [simWeights, setSimWeights] = useState({ nifty: 40, silver: 30, gold: 20, btc: 10 });
  const [showBenchmarks, setShowBenchmarks] = useState(true);
  const [activeDNA, setActiveDNA] = useState(null); // ID of the DNA topic being viewed

  // Smart Rebalancing Logic
  const handleWeightChange = (key, newVal) => {
    const value = Math.max(0, Math.min(100, Number(newVal)));
    const otherKeys = Object.keys(simWeights).filter(k => k !== key);
    const totalOthers = otherKeys.reduce((sum, k) => sum + simWeights[k], 0);
    
    setSimWeights(prev => {
      const nextWeights = { ...prev, [key]: value };
      if (totalOthers === 0) {
        // Distribute remaining evenly if others are 0
        const share = (100 - value) / otherKeys.length;
        otherKeys.forEach(k => nextWeights[k] = share);
      } else {
        // Proportional reduction
        const ratio = (100 - value) / totalOthers;
        otherKeys.forEach(k => nextWeights[k] = prev[k] * ratio);
      }
      return nextWeights;
    });
  };

  // Backtest Engine (Optimized with useMemo and Downsampling)
  const simTrajectory = useMemo(() => {
    if (macroData.length === 0) return [];
    
    // Downsample for performance: only keep ~100 points for simulation
    const stride = Math.max(1, Math.floor(macroData.length / 120));
    const downsampled = macroData.filter((_, i) => i % stride === 0);

    return downsampled.map(point => {
      const portfolioGrowth = (
        (simWeights.nifty / 100 * (point.nifty || 0)) + 
        (simWeights.silver / 100 * (point.silver || 0)) + 
        (simWeights.gold / 100 * (point.gold || 0)) + 
        (simWeights.btc / 100 * (point.btc || 0))
      );
      return { 
        ...point, 
        portfolio: portfolioGrowth
      };
    });
  }, [simWeights, macroData]);

  const totalROI = simTrajectory.length > 0 ? simTrajectory[simTrajectory.length - 1].portfolio : 0;

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      try {
        const [portRes, marketRes] = await Promise.all([
          fetch(`http://localhost:5001/api/portfolio/${user.id}`),
          fetch('http://localhost:8000/api/market-data')
        ]);
        
        if (portRes.ok) setPortfolio(await portRes.json());
        if (marketRes.ok) setMarketData(await marketRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  useEffect(() => {
    const principal = parseFloat(portfolio.liquid_cash) || 100000;
    const fetchProjections = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/growth-projection?principal=${principal}&monthly=10000&annual_return=12`);
        if (res.ok) {
          const data = await res.json();
          setProjections(data.projections);
        }
      } catch (err) {
        // Fallback local calc
        const r = 0.12 / 12;
        const results = [];
        for (const y of [1,2,5,10,15,25]) {
          let val = principal;
          for (let m = 0; m < y * 12; m++) val = val * (1 + r) + 10000;
          results.push({ year: y, value: Math.round(val), total_invested: Math.round(principal + 10000 * y * 12) });
        }
        setProjections(results);
      }
    };
    fetchProjections();
  }, [portfolio.liquid_cash]);

  // Fetch Macro Comparison Data
  useEffect(() => {
    const fetchMacro = async () => {
      setMacroLoading(true);
      const tickers = { 
        nifty: '^NSEI', 
        silver: 'SI=F', 
        gold: 'GC=F', 
        btc: 'BTC-USD' 
      };
      const results = {};
      
      try {
        await Promise.all(Object.entries(tickers).map(async ([key, sym]) => {
          const res = await fetch(`http://localhost:8000/api/history/${sym}?range=${macroRange}`);
          if (res.ok) {
            const data = await res.json();
            results[key] = data.history;
          }
        }));

        // Transform and Standarize
        const transformed = results.nifty?.map((point, i) => {
          const item = { date: point.date };
          Object.keys(results).forEach(asset => {
            const pts = results[asset];
            if (pts && pts.length > 0 && pts[i]) {
              if (viewType === 'percent') {
                const startPrice = pts[0].price;
                if (startPrice !== 0) {
                  item[asset] = ((pts[i].price / startPrice) - 1) * 100;
                } else {
                  item[asset] = 0;
                }
              } else {
                item[asset] = pts[i].price;
              }
            }
          });
          return item;
        }) || [];
        
        setMacroData(transformed);
      } catch (e) {
         console.error("Macro Fetch Error:", e);
      } finally {
         setMacroLoading(false);
      }
    };
    fetchMacro();
  }, [macroRange, viewType]);

  const allocationData = portfolio.investment_plan?.allocation
    ? Object.entries(portfolio.investment_plan.allocation).map(([name, value]) => ({ name, value }))
    : [];

  const groupedMarket = {};
  marketData.slice(0, 10).forEach(d => {
    if (!groupedMarket[d.category]) groupedMarket[d.category] = [];
    groupedMarket[d.category].push(d);
  });

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse text-lg font-black uppercase tracking-widest">Compiling Strategy Dashboard...</div>;

  return (
    <div className="p-4 md:p-6 pb-24 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Strategic Command</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">AI Wealth Orchestration & Market Context</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => navigate('/portfolio')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Go to Portfolio</button>
           <button onClick={() => navigate('/survey')} className="px-4 py-2 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Recalibrate Plan</button>
        </div>
      </div>

      {!portfolio.investment_plan ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-black to-blue-500/20 border border-white/10 rounded-[32px] p-12 text-center mb-8">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
           <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
                 <Sparkles className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Your Strategy is Missing</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                 Our AI needs 3 data points to construct your 25-year wealth trajectory. Get localized allocations for Gold, Real Estate, and Index funds.
              </p>
              <button onClick={() => navigate('/survey')} className="bg-primary text-black px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                 Initialize Plan →
              </button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* Tile 1: AI Strategy Core (8/12) */}
          <div className="lg:col-span-8 bg-[#111] border border-white/5 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={160} />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-2 text-primary mb-4">
                   <Lock size={12} />
                   <span className="font-black uppercase tracking-[0.2em] text-[10px]">Strategic Roadmap</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-6 leading-tight">"{portfolio.investment_plan.plan_summary}"</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {Object.entries(portfolio.investment_plan.advice).map(([period, tip], i) => (
                      <div key={i} className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                         <p className="text-primary text-[10px] font-black mb-2 uppercase tracking-widest">{period}</p>
                         <p className="text-xs text-gray-400 font-medium leading-relaxed">{tip}</p>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Tile 2: Compact Allocation (4/12) */}
          <div className="lg:col-span-4 bg-[#111] border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center relative">
             <h3 className="text-[10px] font-black text-gray-500 mb-6 uppercase tracking-[0.3em] text-center">Target Multi-Asset DNA</h3>
             <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={allocationData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                         {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px' }} />
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center">
                      <div className="text-[10px] font-black text-gray-600 uppercase">Diversified</div>
                      <PieChartIcon size={16} className="text-primary mx-auto mt-1" />
                   </div>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 w-full px-4">
                {allocationData.map((d, i) => (
                   <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate">{d.name} {d.value}%</span>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Row 2: Wealth Path & Market Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Wealth Path (7/12) */}
        <div className="lg:col-span-7 bg-[#111] border border-white/5 rounded-[32px] p-8 space-y-8">
           <div className="flex justify-between items-center">
              <div>
                 <h2 className="text-xl font-black text-white">Compound Trajectory</h2>
                 <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Estimating {projYears}Y Growth @ 12% Avg</p>
              </div>
              <div className="flex bg-[#000] p-1 rounded-xl border border-white/5">
                 {[5, 10, 25].map(y => (
                   <button key={y} onClick={() => setProjYears(y)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${projYears === y ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}>{y}Y</button>
                 ))}
              </div>
           </div>

           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={projections.filter(p => p.year <= projYears)}>
                    <defs>
                       <linearGradient id="pathWealth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <XAxis dataKey="year" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px' }}
                       formatter={(val) => [`₹${(val/100000).toFixed(1)}L`, 'Est. Net Worth']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} fill="url(#pathWealth)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-xl text-primary"><BookOpen size={18} /></div>
                 <div>
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Strategy Tip</div>
                    <div className="text-xs text-white font-bold leading-tight">Time in the market beats timing the market.</div>
                 </div>
              </div>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                 <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Info size={18} /></div>
                 <div>
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Compounding</div>
                    <div className="text-xs text-white font-bold leading-tight">Your growth accelerates after year 10.</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Global Pulse (5/12) */}
        <div className="lg:col-span-5 space-y-6">
           {/* Market Pulse Widget */}
           <div className="bg-[#111] border border-white/5 rounded-[32px] p-8">
              <div className="flex items-center gap-2 text-primary mb-6">
                 <Globe size={14} />
                 <span className="font-black uppercase tracking-[0.2em] text-[10px]">Global Market Pulse</span>
              </div>
              
              <div className="space-y-4">
                 {marketData.slice(0, 5).map((item, i) => {
                    const isPos = item.change_percent >= 0;
                    return (
                       <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all cursor-pointer">
                          <div className="min-w-0">
                             <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                             <p className="text-[9px] text-gray-500 font-black tracking-widest">{item.symbol}</p>
                          </div>
                          <div className="text-right">
                             <div className="text-xs font-black text-white">${item.price.toLocaleString()}</div>
                             <div className={`text-[9px] font-black ${isPos ? 'text-primary' : 'text-red-500'}`}>
                                {isPos ? '+' : ''}{item.change_percent.toFixed(2)}%
                             </div>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* Investment DNA Bento */}
           <div className="grid grid-cols-1 gap-4">
              {DNA_TOPICS.map(topic => (
                 <div 
                    key={topic.id} 
                    onClick={() => setActiveDNA(topic.id)}
                    className="bg-white/5 border border-white/5 p-6 rounded-[28px] hover:border-white/10 transition-all cursor-pointer group hover:bg-white/[0.07]"
                 >
                    <div className="flex items-center justify-between mb-3">
                       <div className={`flex items-center gap-2 ${topic.color}`}>
                          {topic.icon}
                          <span className="text-[10px] font-black uppercase tracking-widest">{topic.title}</span>
                       </div>
                       <ArrowUpRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">{topic.desc}</p>
                 </div>
              ))}
           </div>
        </div>
      </div>


      {/* Row 3: Global Macro Perspective (The Grand View) */}
      <div className="mt-8">
        <GlassCard className="p-8 md:p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none">
             <Globe size={300} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                 <Globe className="text-primary" size={24} />
                 The Grand Perspective
              </h2>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">10-25 Year Asset Correlation & Macro Trends</p>
            </div>
            
            <div className="flex flex-col gap-4 w-full md:w-auto">
               <div className="flex bg-[#000] p-1 rounded-xl border border-white/5 self-end">
                  {['1Y', '5Y', '10Y', '25Y', 'MAX'].map(r => (
                    <button 
                       key={r} 
                       onClick={() => setMacroRange(r)} 
                       className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${macroRange === r ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                       {r}
                    </button>
                  ))}
               </div>
               <div className="flex gap-2 self-end">
                  <button 
                    onClick={() => setViewType('percent')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${viewType === 'percent' ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-white/5 text-gray-500'}`}
                  >
                    Percent (%)
                  </button>
                  <button 
                    onClick={() => setViewType('price')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${viewType === 'price' ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-white/5 text-gray-500'}`}
                  >
                    Price (₹)
                  </button>
               </div>
            </div>
          </div>

          <div className="h-[450px] w-full relative z-10">
             {macroLoading ? (
               <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Decades of Global Data...</p>
               </div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macroData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                       dataKey="date" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#444', fontSize: 10, fontWeight: 700 }}
                       minTickGap={macroRange === '1Y' ? 40 : 100}
                    />
                    <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#444', fontSize: 10, fontWeight: 700 }}
                       tickFormatter={(v) => viewType === 'percent' ? `${v > 0 ? '+' : ''}${v.toFixed(0)}%` : `₹${v > 100000 ? (v/100000).toFixed(1)+'L' : (v/1000).toFixed(0)+'K'}`}
                    />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                       itemStyle={{ fontSize: '11px', fontWeight: 900 }}
                       labelStyle={{ display: 'none' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '40px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }} />
                    <Line type="monotone" dataKey="nifty" name="Nifty 50" stroke="#10b981" strokeWidth={3} dot={false} hide={!visibleAssets.nifty} />
                    <Line type="monotone" dataKey="nasdaq" name="Nasdaq" stroke="#3b82f6" strokeWidth={3} dot={false} hide={!visibleAssets.nasdaq} />
                    <Line type="monotone" dataKey="gold" name="Gold" stroke="#eab308" strokeWidth={3} dot={false} hide={!visibleAssets.gold} />
                    <Line type="monotone" dataKey="btc" name="Bitcoin" stroke="#8b5cf6" strokeWidth={3} dot={false} hide={!visibleAssets.btc} />
                  </LineChart>
               </ResponsiveContainer>
             )}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
             {[
               { label: 'Nifty 50', id: 'nifty', color: 'bg-primary' },
               { label: 'Nasdaq 100', id: 'nasdaq', color: 'bg-blue-500' },
               { label: 'Physical Gold', id: 'gold', color: 'bg-yellow-500' },
               { label: 'Bitcoin', id: 'btc', color: 'bg-purple-500' }
             ].map(asset => (
               <button 
                 key={asset.id}
                 onClick={() => setVisibleAssets(prev => ({...prev, [asset.id]: !prev[asset.id]}))}
                 className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${visibleAssets[asset.id] ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-40'}`}
               >
                  <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${asset.color}`}></div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white">{asset.label}</span>
                  </div>
                  {visibleAssets[asset.id] ? <Zap size={12} className="text-primary" /> : <Lock size={12} className="text-gray-600" />}
               </button>
             ))}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-primary/20 border border-primary/40"></div>
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Global Correlation</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500/20 border border-blue-500/40"></div>
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Macro Cycles</span>
                </div>
             </div>
             <p className="text-[9px] text-gray-700 italic font-medium">Standardized comparison: Assets are equalized to an initial baseline to visualize relative performance over long periods.</p>
          </div>
        </GlassCard>
      </div>

      {/* Row 4: Wealth Simulation Lab (The Sandbox) */}
      <div className="mt-12 mb-20 scroll-mt-20" id="simulation-lab">
        <GlassCard className="p-8 md:p-12 border-primary/20 bg-gradient-to-b from-[#111] to-black relative">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <Zap size={400} />
           </div>

           <div className="flex flex-col lg:flex-row gap-12 relative z-10">
              {/* Left: Allocation Control */}
              <div className="lg:w-1/3">
                 <div className="mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                       <Zap className="text-primary fill-primary/20" size={28} />
                       Strategic Sandbox
                    </h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Backtest Custom Allocations Across 10 Years</p>
                 </div>

                 <div className="flex justify-center mb-10 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={Object.entries(simWeights).map(([name, value]) => ({ name, value }))}
                             cx="50%"
                             cy="50%"
                             innerRadius={65}
                             outerRadius={85}
                             paddingAngle={8}
                             dataKey="value"
                             stroke="none"
                          >
                             {Object.keys(simWeights).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                             itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute mt-[100px] text-center">
                       <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total</div>
                       <div className="text-2xl font-black text-white">100%</div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {[
                       { id: 'nifty', label: 'Nifty 50', color: 'bg-[#10b981]' },
                       { id: 'silver', label: 'Physical Silver', color: 'bg-[#94a3b8]' },
                       { id: 'gold', label: 'Gold', color: 'bg-[#f59e0b]' },
                       { id: 'btc', label: 'Bitcoin', color: 'bg-[#8b5cf6]' },
                    ].map((asset, i) => (
                       <div key={asset.id} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${asset.color}`}></div>
                                <span className="text-gray-400">{asset.label}</span>
                             </div>
                             <span className="text-white">{Math.round(simWeights[asset.id])}%</span>
                          </div>
                          <input 
                             type="range" 
                             min="0" 
                             max="100" 
                             value={simWeights[asset.id]}
                             onChange={(e) => handleWeightChange(asset.id, e.target.value)}
                             className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-emerald-400 transition-all"
                          />
                       </div>
                    ))}
                 </div>
              </div>

              {/* Right: Trjectory Graph */}
              <div className="lg:w-2/3 flex flex-col">
                 <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex-1">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                          <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Portfolio Projection</div>
                          <div className="text-xl font-black text-white">Historical Absolute Returns</div>
                       </div>
                       <div className="text-right flex flex-col items-end gap-3">
                          <button 
                            onClick={() => setShowBenchmarks(!showBenchmarks)}
                            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${showBenchmarks ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-transparent border-white/10 text-gray-600'}`}
                          >
                            {showBenchmarks ? 'Hide Comparisons' : 'Show Comparisons'}
                          </button>
                          <div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Estimated 10Y ROI</div>
                            <div className={`text-3xl font-black ${totalROI >= 0 ? 'text-primary' : 'text-red-500'}`}>
                               {totalROI >= 0 ? '+' : ''}{Math.round(totalROI)}%
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="h-[350px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={simTrajectory}>
                             <defs>
                                <linearGradient id="colorPort" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                             <XAxis 
                                dataKey="date" 
                                hide={true}
                             />
                             <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#444', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(v) => `${v}%`}
                             />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                itemStyle={{ fontSize: '10px', fontWeight: 900 }}
                             />
                             <Area type="monotone" dataKey="portfolio" name="Your Strategy" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorPort)" />
                             {showBenchmarks && (
                               <>
                                 <Line type="monotone" dataKey="nifty" name="Nifty" stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.2} />
                                 <Line type="monotone" dataKey="silver" name="Silver" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.2} />
                                 <Line type="monotone" dataKey="gold" name="Gold" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.2} />
                                 <Line type="monotone" dataKey="btc" name="BTC" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.2} />
                               </>
                             )}
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                       <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl">
                          <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Risk Profile</div>
                          <div className="text-xs font-bold text-white uppercase">{simWeights.btc > 25 ? 'High Risk / Speculative' : simWeights.nifty + simWeights.silver > 60 ? 'Growth Heavy' : 'Balanced Portfolio'}</div>
                       </div>
                       <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl">
                          <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Compounding Mult.</div>
                          <div className="text-xs font-bold text-white">{(1 + totalROI/100).toFixed(1)}x Capital Growth</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </GlassCard>
      </div>

      {/* DNA Modal System */}
      {activeDNA && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveDNA(null)}></div>
           
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl relative z-10 flex flex-col">
              {/* Header */}
              <div className="p-8 pb-4 flex justify-between items-center sticky top-0 bg-[#0a0a0a] z-20">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-xl text-primary">
                       {DNA_TOPICS.find(t => t.id === activeDNA)?.icon}
                    </div>
                    <div>
                       <h2 className="text-xl font-bold text-white">{DNA_TOPICS.find(t => t.id === activeDNA)?.title}</h2>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Wealth Strategy Module</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setActiveDNA(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                 >
                    <X size={20} />
                 </button>
              </div>

              {/* Content Selection */}
              <div className="p-8 pt-0">
                 {activeDNA === 1 && <DCAModule />}
                 {activeDNA === 2 && <CorrelationModule />}
                 {activeDNA === 3 && <Rule72Module />}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// --- DNA Sub-Modules ---

function DCAModule() {
  const data = [
    { name: 'Jan', price: 100, dcaCost: 100 },
    { name: 'Feb', price: 85, dcaCost: 92.5 },
    { name: 'Mar', price: 60, dcaCost: 81.6 },
    { name: 'Apr', price: 45, dcaCost: 72.5 },
    { name: 'May', price: 55, dcaCost: 69.0 },
    { name: 'Jun', price: 75, dcaCost: 70.0 },
    { name: 'Jul', price: 90, dcaCost: 72.8 },
    { name: 'Aug', price: 110, dcaCost: 77.5 },
    { name: 'Sep', price: 105, dcaCost: 80.5 },
    { name: 'Oct', price: 125, dcaCost: 85.0 },
    { name: 'Nov', price: 140, dcaCost: 90.0 },
    { name: 'Dec', price: 155, dcaCost: 95.4 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Consistency vs. Timing</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
               Most investors lose money trying to "catch the bottom." Dollar Cost Averaging (DCA) ignores price and focuses on time. By investing a fixed amount monthly, you naturally buy more units when prices are low and fewer when they are high.
            </p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
               <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Impact Analysis</div>
               <div className="text-sm font-medium text-white italic">"Your average cost basis in this 40% crash scenario would be <span className="text-primary underline">₹95.4</span> instead of the peak entry of ₹100."</div>
            </div>
         </div>
         <div className="h-[250px] bg-black/40 rounded-3xl p-6 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, 180]} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Line type="monotone" dataKey="price" name="Market Price" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dcaCost" name="Your Avg Cost" stroke="#10b981" strokeWidth={4} dot={false} strokeDasharray="5 5" />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
         {[
           { label: 'Market Volatility', val: '40% Dip', color: 'text-red-400' },
           { label: 'Avg Purchase Price', val: '-14.6%', color: 'text-primary' },
           { label: 'Long Term Alpha', val: 'Systematic', color: 'text-blue-400' }
         ].map((stat, i) => (
           <div key={i} className="p-4 bg-white/5 rounded-2xl text-center">
              <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`text-sm font-bold ${stat.color}`}>{stat.val}</div>
           </div>
         ))}
      </div>
    </div>
  );
}

function CorrelationModule() {
  const correlationMatrix = [
    { a: 'Nifty 50', b: 'Silver', val: 0.12, desc: 'Neutral' },
    { a: 'Nifty 50', b: 'Gold', val: -0.15, desc: 'Negative' },
    { a: 'Nifty 50', b: 'BTC', val: 0.35, desc: 'Low positive' },
    { a: 'Gold', b: 'Silver', val: 0.88, desc: 'High synergy' },
    { a: 'Gold', b: 'BTC', val: 0.05, desc: 'Independent' },
    { a: 'Silver', b: 'BTC', val: 0.08, desc: 'Independent' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">The Diversification Matrix</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
               Asset correlation measures how two assets move in relation to each other. A correlation of 1.0 means they move in lockstep, while -1.0 means they move in opposite directions. For a robust portfolio, you want assets that don't all crash at the same time.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
               <ShieldCheck size={14} />
               <span>Strategy: Pair Nifty (High Growth) with Gold (Negative Correlation)</span>
            </div>
         </div>
         <div className="grid grid-cols-2 gap-3">
            {correlationMatrix.map((item, i) => (
               <div key={i} className="p-4 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                  <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">{item.a} vs {item.b}</div>
                  <div className="flex justify-between items-end">
                     <span className="text-xl font-black text-white">{item.val}</span>
                     <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${item.val > 0.5 ? 'bg-primary/20 text-primary' : item.val < 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {item.desc}
                     </span>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function Rule72Module() {
  const [returnRate, setReturnRate] = useState(12);
  const yearsToDouble = (72 / returnRate).toFixed(1);

  return (
    <div className="space-y-12 py-6">
       <div className="text-center space-y-4 max-w-xl mx-auto">
          <h3 className="text-2xl font-black text-white tracking-tight">The Compounding Clock</h3>
          <p className="text-sm text-gray-400">
             The Rule of 72 is the simplest way to understand the speed of wealth creation. Divide 72 by your annual interest rate to find exactly how many years it takes to double your capital.
          </p>
       </div>

       <div className="flex flex-col items-center gap-12">
          <div className="relative group">
             <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all"></div>
             <div className="w-[280px] h-[280px] rounded-full border-[16px] border-white/5 flex flex-col items-center justify-center relative bg-black/40 shadow-2xl">
                <div className="text-[12px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Double Time</div>
                <div className="text-6xl font-black text-white">{yearsToDouble}</div>
                <div className="text-[14px] font-black text-primary uppercase tracking-widest mt-2">Years</div>
                
                {/* SVG Progress Ring */}
                <svg className="absolute inset-[-16px] w-[312px] h-[312px] -rotate-90 pointer-events-none">
                   <circle 
                      cx="156" cy="156" r="148" 
                      fill="none" stroke="currentColor" strokeWidth="16" 
                      strokeDasharray={930}
                      strokeDashoffset={930 - (930 * returnRate / 30)}
                      className="text-primary opacity-50"
                   />
                </svg>
             </div>
          </div>

          <div className="w-full max-w-md space-y-6">
             <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Expected Annual Return</span>
                <span className="text-2xl font-black text-primary">{returnRate}%</span>
             </div>
             <input 
                type="range" 
                min="4" 
                max="30" 
                step="0.5"
                value={returnRate}
                onChange={(e) => setReturnRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
             />
             <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase">
                <span>Fixed (4%)</span>
                <span>Balanced (12%)</span>
                <span>Aggressive (30%)</span>
             </div>
          </div>
       </div>

       <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center">
          <p className="text-sm font-medium text-gray-400">
             With your current <span className="text-white font-bold opacity-100">{returnRate}%</span> projection, your initial capital will be <span className="text-primary font-bold">4x larger in { (yearsToDouble * 2).toFixed(1) } years.</span>
          </p>
       </div>
    </div>
  );
}
