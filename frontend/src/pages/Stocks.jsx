import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import StockRow from '../components/StockRow';
import { hallOfFame } from '../constants/hallOfFame';

export default function Stocks() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [liveStocks, setLiveStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Technology', 'Consumer', 'Automotive', 'Finance', 'Healthcare', 'Retail', 'Entertainment'];

  const baseDirectory = [
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'Consumer' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Automotive' },
    { symbol: 'META', name: 'Meta Platforms', category: 'Technology' },
  ];

  useEffect(() => {
    const fetchAllLive = async () => {
      setLoading(true);
      const results = [];
      for (let base of baseDirectory) {
         try {
           const res = await fetch(`http://localhost:8000/api/ticker/${base.symbol}`);
           if (res.ok) {
             const data = await res.json();
             results.push({
               ...base,
               price: data.price,
               change: data.change,
               changePercent: data.change_percent
             });
           } else {
             results.push({ ...base, price: 0, change: 0, changePercent: 0 }); // fallback
           }
         } catch(e) {
           results.push({ ...base, price: 0, change: 0, changePercent: 0 }); // fallback
         }
      }
      setLiveStocks(results);
      setLoading(false);
    };

    fetchAllLive();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStocks = liveStocks.filter(stock => {
    const matchesCategory = activeFilter === 'All' || stock.category === activeFilter;
    const matchesSearch = stock.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          stock.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 pb-20 w-full h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Stocks</h1>
        <p className="text-gray-400">Browse and track stock performance</p>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search stocks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#151515] border border-[#333] rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#555] transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === cat 
                  ? 'bg-primary text-[#111]' 
                  : 'bg-[#151515] border border-[#333] text-gray-400 hover:text-white hover:border-[#555]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-[#151515] border border-[#222] rounded-[20px] p-6 flex-1 overflow-y-auto">
        {loading ? (
             <div className="text-center text-gray-500 py-10">Fetching live market data...</div>
        ) : (
          <div className="space-y-4">
            {filteredStocks.map((stock) => (
               <div key={stock.symbol} className="flex items-center">
                   <div className="flex-1 min-w-[250px]">
                      <div className="flex items-center gap-2">
                         <h4 className="text-white font-bold tracking-wide">{stock.symbol}</h4>
                         <span className="text-[10px] bg-[#222] border border-[#333] px-2 py-0.5 rounded text-gray-400">{stock.category}</span>
                         {hallOfFame.some(h => h.symbol === stock.symbol) && (
                           <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded-full font-black uppercase tracking-tighter animate-pulse">Hall of Fame</span>
                         )}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{stock.name}</p>
                   </div>
                   <div className="flex-[2] flex justify-end">
                      <StockRow {...stock} type="directory" />
                   </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
