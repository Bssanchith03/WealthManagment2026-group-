import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { hallOfFame } from '../constants/hallOfFame';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Info, 
  Target, 
  PieChart as PieChartIcon, 
  Zap, 
  ShieldCheck, 
  Coins, 
  ArrowRight,
  Menu,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  investorPaths 
} from '../utils/mockMarketData';

// --- Sub-Components ---

const Section = ({ children, className = "", id }) => (
  <section id={id} className={`py-16 md:py-24 px-6 max-w-7xl mx-auto ${className}`}>
    {children}
  </section>
);

const GlassCard = ({ children, className = "", ...props }) => (
  <div className={`bg-[#151515]/80 backdrop-blur-xl border border-[#222] rounded-[24px] overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, primary, className = "", ...props }) => (
  <button 
    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
      primary 
        ? "bg-primary text-black hover:bg-green-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
        : "bg-[#222] text-white hover:bg-[#333] border border-[#333]"
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

// --- Main Page Component ---

export default function Landing() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedGiant, setSelectedGiant] = useState(null);

  // Hero State
  const [heroAsset, setHeroAsset] = useState('stocks');
  const [heroAmount, setHeroAmount] = useState(10000);
  const [heroYear, setHeroYear] = useState(2014);

  // Market Overview State
  const [marketRange, setMarketRange] = useState('10Y');
  const [visibleAssets, setVisibleAssets] = useState({ nifty: true, nasdaq: true, gold: true, silver: true });

  // What-If Simulator State
  const [simAmount, setSimAmount] = useState(50000);
  const [simYears, setSimYears] = useState(5);
  const [simAsset, setSimAsset] = useState('stocks');

  // Education State
  const [expandedTopic, setExpandedTopic] = useState(null);

  // Investor Paths State
  const [selectedPath, setSelectedPath] = useState(null);
  const [pathRange, setPathRange] = useState('10Y');

  // Events Lab State
  const [activeEvent, setActiveEvent] = useState(null);

  // Goal State
  const [goalType, setGoalType] = useState('Car');
  const [goalAmount, setGoalAmount] = useState(1500000);
  const [goalTime, setGoalTime] = useState(5);

  // Real Market Data State
  const [giantData, setGiantData] = useState({});
  const [giantLoading, setGiantLoading] = useState(true);
  const [simHistory, setSimHistory] = useState([]);
  const [simLoading, setSimLoading] = useState(false);
  const [heroData, setHeroData] = useState({});
  const [heroLoading, setHeroLoading] = useState(true);

  // Fetch Hero Comparison Data
  useEffect(() => {
    const fetchHero = async () => {
      setHeroLoading(true);
      const tickers = { nifty: '^NSEI', nasdaq: '^IXIC', gold: 'GC=F', silver: 'SI=F', all: '^NSEI' };
      const results = {};
      try {
        await Promise.all(Object.entries(tickers).map(async ([key, sym]) => {
          const res = await fetch(`http://localhost:8000/api/history/${sym}?range=10Y`);
          if (res.ok) {
            const data = await res.json();
            results[key] = data.history.filter((_, i) => i % 20 === 0);
          }
        }));
        setHeroData(results);
      } catch (e) {
        console.error("Hero Fetch Error:", e);
      } finally {
        setHeroLoading(false);
      }
    };
    fetchHero();
  }, []);

  const giantTickers = hallOfFame;

  // Fetch 10Y Giants Data
  useEffect(() => {
    const fetchGiants = async () => {
      setGiantLoading(true);
      const results = {};
      try {
        await Promise.all(giantTickers.map(async (t) => {
          const res = await fetch(`http://localhost:8000/api/history/${t.symbol}?range=10Y`);
          if (res.ok) {
            const data = await res.json();
            // Downsample to ~120 points for 10 years (monthly) to keep UI snappy
            const history = data.history.filter((_, i) => i % 20 === 0);
            results[t.id] = history;
          }
        }));
        setGiantData(results);
      } catch (e) {
        console.error("Giants Fetch Error:", e);
      } finally {
        setGiantLoading(false);
      }
    };
    fetchGiants();
  }, []);

  // Fetch Simulation History
  useEffect(() => {
    const fetchSim = async () => {
        setSimLoading(true);
        try {
            const map = { stocks: 'AAPL', gold: 'GC=F', crypto: 'BTC-USD', fixed: 'AGG' }; // simplified mapping
            const res = await fetch(`http://localhost:8000/api/history/${map[simAsset] || 'AAPL'}?range=10Y`);
            if (res.ok) {
                const data = await res.json();
                // Slice based on simYears (approx 252 trading days per year)
                const totalPoints = data.history.length;
                const sliceCount = simYears * 21 * 12; // approx monthly for years
                setSimHistory(data.history.slice(-Math.min(sliceCount, totalPoints)).filter((_, i) => i % 5 === 0));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSimLoading(false);
        }
    };
    fetchSim();
  }, [simAsset, simYears]);

  // --- Calculations ---

  const calculateHeroReturns = (asset = heroAsset) => {
    if (heroLoading || !heroData[asset]) return heroAmount;
    
    const assetPoints = heroData[asset];
    const startIndex = Math.max(0, (heroYear - 2014) * 12);
    const startPoint = assetPoints[startIndex] || assetPoints[0];
    const endPoint = assetPoints[assetPoints.length - 1];
    
    return heroAmount * (endPoint.price / startPoint.price);
  };

  const heroChartData = useMemo(() => {
    if (heroLoading) return [];
    const base = heroData.nifty || heroData.gold;
    if (!base) return [];

    const startIndex = Math.max(0, (heroYear - 2014) * 12);
    return base.slice(startIndex).map((point, i) => {
      const item = { label: point.date };
      ['nifty', 'nasdaq', 'gold', 'silver'].forEach(asset => {
         const pts = heroData[asset]?.slice(startIndex);
         if (pts && pts[i]) {
            item[asset] = (pts[i].price / pts[0].price) * heroAmount;
         }
      });
      return item;
    });
  }, [heroData, heroYear, heroLoading, heroAmount]);

  const calculateCAGR = (initial, final, years) => {
    if (years <= 0) return 0;
    return (Math.pow(final / initial, 1 / years) - 1) * 100;
  };

  const getFilteredMarketData = () => {
    if (heroLoading) return [];
    const base = heroData.nifty;
    if (!base) return [];
    
    if (marketRange === '1Y') return base.slice(-12);
    if (marketRange === '5Y') return base.slice(-60);
    return base;
  };

  const getSimulatedData = () => {
    if (simAsset === 'all') {
      const assets = ['nifty', 'nasdaq', 'gold', 'silver'];
      const points = simYears * 12;
      
      return Array.from({ length: points }).map((_, i) => {
        const item = { month: i };
        assets.forEach(a => {
           const baseGrowth = { nifty: 0.12, nasdaq: 0.18, gold: 0.07, silver: 0.09 }[a];
           const volatility = { nifty: 0.03, nasdaq: 0.05, gold: 0.01, silver: 0.03 }[a];
           
           // Simple compounded growth for "All" view
           const rand = (Math.random() - 0.5) * volatility;
           const previous = i === 0 ? simAmount : 0; // This is a bit simplified for the "All" view to show trend
           // For a better visual, we'll use a fixed seed-based-like growth
           const totalGrowth = Math.pow(1 + (baseGrowth / 12), i) * (1 + rand);
           item[a] = simAmount * totalGrowth;
        });
        return item;
      });
    }

    const baseGrowth = { stocks: 0.12, gold: 0.08, crypto: 0.25, fixed: 0.06 }[simAsset];
    const volatility = { stocks: 0.05, gold: 0.02, crypto: 0.15, fixed: 0.005 }[simAsset];
    
    let eventMod = 0;
    if (activeEvent === 'Recession') eventMod = -0.15;
    if (activeEvent === 'Inflation') eventMod = 0.05;
    if (activeEvent === 'Tech Boom' && simAsset === 'stocks') eventMod = 0.15;

    const points = simYears * 12;
    let current = simAmount;
    return Array.from({ length: points }).map((_, i) => {
      const rand = (Math.random() - 0.5) * volatility;
      current = current * (1 + (baseGrowth / 12) + rand + (eventMod / 12));
      return { month: i, value: current };
    });
  };

  const simData = useMemo(() => getSimulatedData(), [simAmount, simYears, simAsset, activeEvent]);

  const getLabFeedback = () => {
    if (!simData || simData.length === 0) return { label: 'Analyzing...', color: 'text-gray-500', desc: 'Starting simulation parameters.' };
    
    const lastPoint = simData[simData.length - 1];
    const finalVal = lastPoint.value || lastPoint.nifty || simAmount;
    const totalReturn = ((finalVal / simAmount) - 1) * 100;
    
    if (simAsset === 'crypto') return { label: 'High Volatility Expected', color: 'text-purple-500', desc: 'Crypto markets can see 50%+ drawdowns. Only invest money you can afford to lose.' };
    if (simAsset === 'fixed') return { label: 'Capital Protection', color: 'text-blue-500', desc: 'Low risk, reliable growth. Perfect for short-term goals.' };
    if (totalReturn > 100) return { label: 'High Growth Potential', color: 'text-primary', desc: 'Long-term equity exposure historicaly delivers superior wealth creation.' };
    return { label: 'Moderate Risk Profile', color: 'text-yellow-500', desc: 'Balanced growth with manageable market fluctuations.' };
  };

  const feedback = getLabFeedback();

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen selection:bg-primary/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-black font-bold" />
            </div>
            <span className="text-xl font-bold tracking-tight">ApexInvest</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-400">
            <a href="#market" className="hover:text-white transition-colors">Market</a>
            <a href="#simulator" className="hover:text-white transition-colors">Simulator</a>
            <a href="#paths" className="hover:text-white transition-colors">Paths</a>
            <a href="#goals" className="hover:text-white transition-colors">Goals</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Sign In</Link>
            <Button primary className="hidden md:flex" onClick={() => navigate('/login')}>Start Exploring</Button>
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Section className="pt-32 md:pt-48 flex flex-col lg:flex-row items-center gap-12">
        <div className="lg:w-1/2 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
            <Zap size={14} /> ENHANCED REALISM & INSIGHTS
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tighter">
            Learn investing by <span className="text-primary italic">actually</span> doing it.
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto lg:mx-0">
            Compare how ₹X invested over time performed across different assets. See real-world market crashes and learn to weather the storm.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Button primary className="w-full sm:w-auto px-8 py-4 text-lg" onClick={() => navigate('/login')}>
              Start Exploring <ChevronRight size={20} />
            </Button>
            <Button className="w-full sm:w-auto px-8 py-4 text-lg" onClick={() => document.getElementById('market').scrollIntoView({ behavior: 'smooth' })}>
              Learn First
            </Button>
          </div>
        </div>

        <div className="lg:w-1/2 w-full">
          <GlassCard className="p-8 group pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold mb-1">Asset Comparison</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold font-sans">Compare ₹{heroAmount.toLocaleString()} starting in {heroYear}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5 rounded-xl bg-[#111] p-1 border border-[#222]">
                {['nifty', 'nasdaq', 'gold', 'silver', 'all'].map(a => (
                  <button 
                    key={a}
                    onClick={() => setHeroAsset(a)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all ${heroAsset === a ? 'bg-[#1a2e22] text-primary' : 'text-gray-500'}`}
                  >
                    {a === 'nifty' ? 'India' : a === 'nasdaq' ? 'US' : a}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[240px] mb-8 relative">
              {heroLoading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500 animate-pulse font-bold">Loading Comparison...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {heroAsset === 'all' ? (
                    <LineChart data={heroChartData}>
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                         formatter={(val) => [`₹${Math.round(val).toLocaleString()}`, 'Value']}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="nifty" name="Nifty 50" stroke="#10b981" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="nasdaq" name="Nasdaq" stroke="#3b82f6" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="gold" name="Gold" stroke="#eab308" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="silver" name="Silver" stroke="#94a3b8" strokeWidth={3} dot={false} />
                    </LineChart>
                  ) : (
                    <AreaChart data={heroChartData}>
                      <defs>
                        <linearGradient id="colorHero" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={heroAsset === 'nifty' ? '#10b981' : heroAsset === 'nasdaq' ? '#3b82f6' : '#eab308'} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={heroAsset === 'nifty' ? '#10b981' : heroAsset === 'nasdaq' ? '#3b82f6' : '#eab308'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey={heroAsset} stroke={heroAsset === 'nifty' ? '#10b981' : heroAsset === 'nasdaq' ? '#3b82f6' : '#eab308'} strokeWidth={3} fillOpacity={1} fill="url(#colorHero)" animationDuration={1000} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-gray-500 font-black uppercase mb-1">Final Value</div>
                  <div className="text-2xl font-black text-white">₹{Math.round(calculateHeroReturns()).toLocaleString()}</div>
                </div>
                {heroAsset !== 'all' && (
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-black uppercase mb-1">CAGR <Info size={10} className="inline opacity-40 cursor-help" title="Compound Annual Growth Rate - The average yearly return over the period." /></div>
                    <div className="text-2xl font-black text-primary">
                      {calculateCAGR(heroAmount, calculateHeroReturns(), 2024 - heroYear).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 pt-4 border-t border-[#222]">
                <div className="flex justify-between items-center bg-[#111] p-1.5 rounded-xl border border-[#222]">
                  {[2014, 2017, 2020, 2022].map(y => (
                    <button 
                      key={y} onClick={() => setHeroYear(y)} 
                      className={`text-[10px] font-black px-4 py-2 rounded-lg transition-all ${heroYear === y ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                      {y}
                    </button>
                  ))}
                  <div className="h-4 w-px bg-gray-800 mx-1"></div>
                  <div className="px-3 text-[10px] font-bold text-gray-400">START YEAR</div>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-gray-600 mt-6 text-center italic">* Past performance is not a guarantee of future results. Data is simulated for educational purposes.</p>
          </GlassCard>
        </div>
      </Section>

      {/* Market Overview */}
      <Section id="market" className="bg-[#0c0c0c] border-y border-[#1a1a1a]">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">The Grand Perspective</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">See how different assets react to market cycles. Note the jagged volatility in stocks vs the relative stability of Gold.</p>
        </div>

        <GlassCard className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex flex-wrap gap-4">
              {['nifty', 'nasdaq', 'gold', 'silver'].map(asset => (
                <button 
                  key={asset}
                  onClick={() => setVisibleAssets(v => ({...v, [asset]: !v[asset]}))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    visibleAssets[asset] 
                      ? 'bg-white/5 border-primary/50 text-white' 
                      : 'bg-transparent border-[#222] text-gray-500 opacity-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    asset === 'nifty' ? 'bg-primary' : 
                    asset === 'nasdaq' ? 'bg-blue-500' : 
                    asset === 'gold' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  {asset.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="flex bg-[#111] p-1 rounded-xl border border-[#222]">
              {['1Y', '5Y', '10Y'].map(r => (
                <button 
                  key={r}
                  onClick={() => setMarketRange(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${marketRange === r ? 'bg-[#1a2e22] text-primary' : 'text-gray-500'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px]">
            {heroLoading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500 animate-pulse font-bold">Fetching Market Context...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getFilteredMarketData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 10}} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    formatter={(val) => [`₹${Math.round(val).toLocaleString()}`, 'Price']}
                  />
                  <Legend iconType="circle" />
                  {visibleAssets.nifty && <Line type="monotone" dataKey="price" name="Nifty 50" stroke="#10b981" strokeWidth={3} dot={false} />}
                  {visibleAssets.nasdaq && <Line type="monotone" dataKey="nasdaq" name="Nasdaq" stroke="#3b82f6" strokeWidth={3} dot={false} />}
                  {visibleAssets.gold && <Line type="monotone" dataKey="gold" name="Gold" stroke="#eab308" strokeWidth={3} dot={false} />}
                  {visibleAssets.silver && <Line type="monotone" dataKey="silver" name="Silver" stroke="#94a3b8" strokeWidth={3} dot={false} />}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </Section>

      {/* Market Giants: 10-Year Hall of Fame */}
      <Section id="giants" className="bg-[#0a0a0a]">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">The 10-Year Hall of Fame</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Analyze the real 10-year historical trajectories of the assets that defined the last decade. Real scraped data, zero filler.</p>
        </div>

        {giantLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="text-gray-500 font-bold animate-pulse">Scraping 10 years of market history...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {giantTickers.map((t) => (
              <GlassCard 
                key={t.id} 
                className="p-8 flex flex-col group cursor-pointer hover:border-primary/40 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                onClick={() => setSelectedGiant(t)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors tracking-tight">{t.name}</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t.symbol}</p>
                  </div>
                  <div className="bg-[#111] p-2 rounded-xl border border-white/5 group-hover:bg-primary/20 transition-all">
                    <TrendingUp size={18} className="text-primary opacity-50 group-hover:opacity-100" />
                  </div>
                </div>

                <div className="h-44 mb-8 relative pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={giantData[t.id] || []}>
                      <defs>
                        <linearGradient id={`color${t.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill={`url(#color${t.id})`}
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="h-px bg-white/5 w-full"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Risk Profile</h4>
                      <div className="text-xs font-bold text-white uppercase">{t.stats.volatility}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-primary flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                          Explore Analysis <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Detailed Market Modal */}
        {selectedGiant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setSelectedGiant(null)}></div>
            
            <GlassCard className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-[#0d0d0d] border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col md:flex-row">
              {/* Sidebar: Strategic Analysis */}
              <div className="md:w-1/3 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 bg-[#0a0a0a]/50">
                <button 
                  onClick={() => setSelectedGiant(null)}
                  className="mb-8 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
                
                <div className="mb-8">
                  <h2 className="text-4xl font-black text-white tracking-tighter mb-2">{selectedGiant.name}</h2>
                  <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">{selectedGiant.symbol}</p>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Target size={12} /> Strategic Role
                    </h4>
                    <p className="text-gray-300 leading-relaxed font-medium text-lg">
                      {selectedGiant.detailedDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <div className="text-[9px] font-black text-gray-500 uppercase mb-1">Volatility</div>
                       <div className="text-sm font-bold text-white">{selectedGiant.stats.volatility}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <div className="text-[9px] font-black text-gray-500 uppercase mb-1">10Y Return</div>
                       <div className="text-sm font-bold text-primary">{selectedGiant.stats.decadeReturn}</div>
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
                     <div className="flex items-center gap-2 text-primary mb-3">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Expert Insight</span>
                     </div>
                     <p className="text-xs text-gray-400 leading-relaxed italic">
                        "For a balanced portfolio, consider {selectedGiant.name} not just for its growth, but for its {selectedGiant.stats.role.toLowerCase()} properties."
                     </p>
                  </div>
                </div>
              </div>

              {/* Main Content: Large Graph */}
              <div className="md:w-2/3 p-8 md:p-12 flex flex-col">
                <div className="flex justify-between items-end mb-12">
                   <div>
                      <h3 className="text-xl font-black text-white mb-2">10-Year Trajectory</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Standardized Market Price (₹)</p>
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-black text-gray-600 uppercase mb-1">Performance Status</div>
                      <div className="flex items-center gap-2 text-primary">
                         <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                         <span className="text-xs font-black uppercase tracking-widest">Active Analysis</span>
                      </div>
                   </div>
                </div>

                <div className="flex-grow min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={giantData[selectedGiant.id] || []}>
                      <defs>
                        <linearGradient id="modalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#444', fontSize: 10, fontWeight: 700 }}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#444', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(v) => `₹${(v/1000).toFixed(1)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        itemStyle={{ color: '#10b981', fontWeight: 900, fontSize: '12px' }}
                        labelStyle={{ color: '#666', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}
                        formatter={(val) => [`₹${Math.round(val).toLocaleString()}`, 'Current Price']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#modalGradient)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                         <TrendingUp className="text-primary" size={20} />
                      </div>
                      <div>
                         <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Growth Perspective</div>
                         <div className="text-sm font-bold text-white">Compound Multiplier: {(giantData[selectedGiant.id]?.slice(-1)[0]?.price / giantData[selectedGiant.id]?.[0]?.price).toFixed(1)}x</div>
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate('/login')}
                     className="px-6 py-3 bg-primary text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                   >
                     Trade {selectedGiant.name} Now →
                   </button>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </Section>

      <Section id="simulator">
        <div className="flex flex-col gap-12">
          {/* Controls Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">Simulation Lab</h2>
              <p className="text-gray-400 mb-8 max-w-xl">Test your hypotheses using real historical performance. Adjust amount and time to see how different risk profiles actually behaved over the last decade.</p>
              
              <div className="space-y-8">
                <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Initial Investment: ₹{simAmount.toLocaleString()}</label>
                  <input type="range" min="10000" max="1000000" step="10000" value={simAmount} onChange={e => setSimAmount(Number(e.target.value))} className="w-full h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>
                <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Historical Window: {simYears} Years</label>
                  <input type="range" min="1" max="10" step="1" value={simYears} onChange={e => setSimYears(Number(e.target.value))} className="w-full h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Select Asset Base</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'stocks', label: 'Stocks (AAPL)', icon: <TrendingUp size={16} /> },
                  { id: 'gold', label: 'Gold (GC=F)', icon: <ShieldCheck size={16} /> },
                  { id: 'crypto', label: 'Crypto (BTC)', icon: <Coins size={16} /> },
                  { id: 'fixed', label: 'Bonds (AGG)', icon: <Target size={16} /> }
                ].map(a => (
                  <button 
                    key={a.id}
                    onClick={() => setSimAsset(a.id)}
                    className={`p-5 rounded-2xl border flex flex-col gap-2 items-start transition-all duration-300 ${simAsset === a.id ? 'bg-primary/10 border-primary shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-[#111] border-white/5 text-gray-500 hover:border-gray-600'}`}
                  >
                    <div className={simAsset === a.id ? 'text-primary' : 'text-gray-600'}>{a.icon}</div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${simAsset === a.id ? 'text-white' : ''}`}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Large Graph Section */}
          <GlassCard className="p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-white/5 pb-8">
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Projected Real Value Growth</h4>
                {simLoading || !simHistory || simHistory.length < 2 ? (
                  <div className="h-12 w-48 bg-white/5 animate-pulse rounded-lg"></div>
                ) : (
                  <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                   ₹{Math.round(simAmount * (simHistory[simHistory.length - 1]?.price / simHistory[0]?.price || 1)).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md max-w-sm">
                <div className={`text-xs font-black uppercase mb-2 tracking-widest ${feedback.color}`}>{feedback.label}</div>
                <div className="text-[11px] text-gray-400 leading-relaxed font-medium">{feedback.desc}</div>
              </div>
            </div>

            <div className="h-[500px] w-full">
              {simLoading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500 animate-pulse font-black text-lg">Reconstructing Historical Market Path...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simHistory}>
                    <defs>
                      <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={simAsset === 'crypto' ? '#8b5cf6' : simAsset === 'gold' ? '#eab308' : '#10b981'} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={simAsset === 'crypto' ? '#8b5cf6' : simAsset === 'gold' ? '#eab308' : '#10b981'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val) => {
                        const startPrice = simHistory?.[0]?.price || 1;
                        return [`₹${Math.round(simAmount * (val / startPrice)).toLocaleString()}`, 'Portfolio Value'];
                      }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={simAsset === 'crypto' ? '#8b5cf6' : simAsset === 'gold' ? '#eab308' : '#10b981'} 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorSim)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[10px] text-gray-600 italic font-medium">
                * This data is real 1:1 historical performance of the asset symbol mentioned above.
              </p>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Growth Trajectory</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/10 border border-white/20"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Volatility Shadow</span>
                 </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </Section>

      {/* Learning Carousel */}
      <Section className="bg-[#0c0c0c] border-y border-[#1a1a1a] overflow-hidden">
        <div className="flex items-center justify-between mb-12">
           <h2 className="text-4xl font-black">Investment DNA</h2>
           <p className="text-gray-400 hidden md:block">Click any card to explore deeper interactions.</p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
          {[
            { tag: 'GROWTH', title: 'Stocks', desc: 'Direct equity. High potential but fluctuates with market sentiment.', risk: 'High', color: 'primary' },
            { tag: 'SIP', title: 'Systematic Plan', desc: 'Invest a fixed amount every month regardless of market levels.', risk: 'Moderate', color: 'blue-500' },
            { tag: 'SAFETY', title: 'Gold', desc: 'The ultimate hedge. Rises when panic hits the stock market.', risk: 'Low', color: 'yellow-500' },
            { tag: 'DIVERSITY', title: 'Mutual Funds', desc: 'Professionally managed baskets of stocks and bonds.', risk: 'Moderate', color: 'purple-500' },
            { tag: 'REDUCE RISK', title: 'Diversification', desc: 'Mixing assets to lower the volatility and smooth the journey.', risk: 'Low', color: 'green-400' }
          ].map((card, i) => {
            const isExpanded = expandedTopic === card.title;
            return (
              <div key={i} onClick={() => {
                   setExpandedTopic(isExpanded ? null : card.title);
                   if (card.title === 'Stocks') setSimAsset('stocks'); // Interconnectivity
              }} className={`min-w-[300px] transition-all duration-500 snap-center ${isExpanded ? 'min-w-[500px]' : ''}`}>
                <GlassCard className={`p-8 h-full flex flex-col hover:border-white/20 transition-all cursor-pointer relative ${isExpanded ? 'bg-white/10' : ''}`}>
                  <div className={`text-[10px] font-black tracking-widest text-${card.color} mb-2`}>{card.tag}</div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center justify-between">
                    {card.title}
                    {isExpanded ? <Minus size={16} /> : <Plus size={16} className={`text-${card.color}`} />}
                  </h3>
                  
                  {!isExpanded ? (
                    <>
                      <p className="text-gray-400 text-sm leading-relaxed mb-6">{card.desc}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                        RISK: <span className={`text-${card.color}`}>{card.risk}</span>
                      </div>
                    </>
                  ) : (
                    <div className="animate-in fade-in duration-500 bg-black/40 p-6 rounded-2xl border border-white/5 space-y-6">
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">{card.desc} By spreading your capital, you ensure a single market event doesn't wipe out your progress.</p>
                      
                      {card.title === 'Systematic Plan' ? (
                        <div className="space-y-4">
                           <div className="flex justify-between text-[10px] font-bold"><span>SIP vs LUMP SUM</span><span className="text-blue-500">SIP Win Ratio: 85%</span></div>
                           <div className="h-24 opacity-60">
                              <ResponsiveContainer width="100%" height="100%">
                                 <LineChart data={[{v:10},{v:15},{v:12},{v:18},{v:25},{v:22},{v:30}]}>
                                    <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                 </LineChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                      ) : card.title === 'Diversification' ? (
                        <div className="flex gap-4 items-center">
                           <div className="w-20 h-20">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={[{v:40},{v:30},{v:20},{v:10}]} dataKey="v" innerRadius={20} outerRadius={35} paddingAngle={2}>
                                    <Cell fill="#10b981" /><Cell fill="#3b82f6" /><Cell fill="#eab308" /><Cell fill="#8b5cf6" />
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                           </div>
                           <div className="text-[10px] font-bold text-gray-500">Balanced portfolios experience <span className="text-white">40% lower volatility</span> during bear markets.</div>
                        </div>
                      ) : (
                        <div className="h-32 opacity-80">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={heroData.nifty?.slice(-24) || []}>
                                 <Area type="monotone" dataKey="price" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                      )}
                      
                      <button onClick={(e) => {
                         e.stopPropagation();
                         document.getElementById('simulator').scrollIntoView({ behavior: 'smooth' });
                      }} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Simulator This Topic</button>
                    </div>
                  )}
                </GlassCard>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Investor Paths */}
      <Section id="paths">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">Choose Your Path</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">See how different risk tolerances perform over the 2020 and 2022 market cycles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           {Object.keys(investorPaths).map(key => {
             const path = investorPaths[key];
             return (
               <button 
                 key={key}
                 onClick={() => setSelectedPath(key)}
                 className={`p-8 rounded-[32px] border text-left transition-all relative overflow-hidden group ${
                   selectedPath === key ? 'bg-primary/5 border-primary ring-2 ring-primary/20' : 'bg-[#111] border-[#222] hover:border-gray-600'
                 }`}
               >
                 <div className={`text-xs font-black mb-3 tracking-widest ${path.risk === 'High' ? 'text-red-500' : 'text-primary'}`}>{path.risk} RISK</div>
                 <h3 className="text-xl font-bold mb-4">{path.title}</h3>
                 <p className="text-sm text-gray-500 mb-6">{path.description}</p>
                 <ArrowRight className={`transition-transform ${selectedPath === key ? 'translate-x-2' : ''}`} />
               </button>
             );
           })}
        </div>

        {selectedPath && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
             <GlassCard className="p-10">
                <div className="flex flex-col lg:flex-row gap-12">
                   <div className="lg:w-1/3">
                      <h4 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white"><PieChartIcon className="text-primary" /> Target Allocation</h4>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={investorPaths[selectedPath].allocation}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {investorPaths[selectedPath].allocation.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none' }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="lg:w-2/3 border-t lg:border-t-0 lg:border-l border-[#222] lg:pl-12 pt-12 lg:pt-0">
                      <div className="flex items-center justify-between mb-8">
                        <h4 className="text-2xl font-bold">10-Year Track Record</h4>
                        <div className="flex bg-[#111] p-1 rounded-xl border border-[#222]">
                          {['1Y', '5Y', '10Y'].map(r => (
                            <button key={r} onClick={() => setPathRange(r)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${pathRange === r ? 'bg-[#1a2e22] text-primary' : 'text-gray-500'}`}>{r}</button>
                          ))}
                        </div>
                      </div>

                      <div className="h-[250px] mb-8">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={heroData.nifty || []}>
                               <Area type="monotone" dataKey="price" name="Nifty 50" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                               <Area type="monotone" dataKey="nasdaq" name="Nasdaq" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-6 italic">* Performance shown includes the Covid (2020) and Inflation (2022) market drawdowns.</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                         {[
                           { label: 'Expected Yield', val: '8.5 - 14% CAGR' },
                           { label: 'Deepest Crash', val: '-28% (2020)', color: 'text-red-500' },
                           { label: 'Time Threshold', val: '7+ Years' }
                         ].map((s, i) => (
                           <div key={i}>
                             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{s.label}</div>
                             <div className={`text-lg font-bold ${s.color || ''}`}>{s.val}</div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </GlassCard>
          </div>
        ) || (
          <div className="text-center p-20 bg-white/5 border border-dashed border-[#222] rounded-[32px] text-gray-500 font-bold">
            Select a path above to see its detailed strategy through historical crashes.
          </div>
        )}
      </Section>

      {/* Final CTA Section */}
      <Section className="py-32 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10" />
        
        <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Ready to try it <br /><span className="text-primary italic">yourself?</span></h2>
        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
          Start your simulation journey today. Learn how to navigate crashes, use leverage, and build long-term generational wealth.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button primary className="px-12 py-5 text-xl" onClick={() => navigate('/login')}>
            Start Your Simulation
          </Button>
        </div>
        
        <p className="mt-12 text-sm font-bold text-gray-600 flex items-center justify-center gap-2">
          <ShieldCheck size={16} /> Data is for educational purposes • No real financial guarantees • Risk is intrinsic to markets
        </p>
      </Section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-500 rounded-md flex items-center justify-center">
              <TrendingUp size={14} className="text-black" />
            </div>
            <span className="font-bold">ApexInvest</span>
          </div>
          
          <div className="text-sm text-gray-500 font-medium">
            © 2026 ApexInvest Simulation Platform. Disclaimer: Past performance is not indicative of future results.
          </div>

          <div className="flex gap-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors"><X size={20} /></a>
            <a href="#" className="hover:text-white transition-colors text-sm font-bold">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors text-sm font-bold">Risk Disclaimer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
