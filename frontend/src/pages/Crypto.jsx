import { useState, useEffect } from 'react';
import { Search, Bitcoin } from 'lucide-react';
import StockRow from '../components/StockRow';

export default function Crypto() {
  const [search, setSearch] = useState('');
  const [liveCrypto, setLiveCrypto] = useState([]);
  const [loading, setLoading] = useState(true);

  const baseDirectory = [
    { symbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH-USD', name: 'Ethereum' },
    { symbol: 'SOL-USD', name: 'Solana' },
    { symbol: 'BNB-USD', name: 'Binance Coin' },
    { symbol: 'XRP-USD', name: 'XRP' },
    { symbol: 'ADA-USD', name: 'Cardano' },
    { symbol: 'DOGE-USD', name: 'Dogecoin' },
    { symbol: 'DOT-USD', name: 'Polkadot' },
    { symbol: 'AVAX-USD', name: 'Avalanche' },
    { symbol: 'MATIC-USD', name: 'Polygon' },
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
             results.push({ ...base, price: 0, change: 0, changePercent: 0 }); 
           }
         } catch(e) {
           results.push({ ...base, price: 0, change: 0, changePercent: 0 }); 
         }
      }
      setLiveCrypto(results);
      setLoading(false);
    };

    fetchAllLive();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCrypto = liveCrypto.filter(coin => {
    const matchesSearch = coin.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          coin.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
            <Bitcoin size={32} className="text-[#f7931a]" />
            <h1 className="text-3xl font-bold text-white">Cryptocurrency</h1>
        </div>
        <p className="text-gray-400">Track live crypto prices and your digital assets</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search coins..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#151515] border border-[#333] rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#555] transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-[#151515] border border-[#222] rounded-[20px] p-6 flex-1 overflow-y-auto shadow-2xl">
        {loading ? (
             <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                Fetching blockchain data...
             </div>
        ) : (
          <div className="space-y-4">
            {filteredCrypto.map((coin) => (
               <div key={coin.symbol} className="flex items-center p-2 hover:bg-[#1a1a1a] rounded-[16px] transition-colors border border-transparent hover:border-[#333]">
                   <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                         <h4 className="text-white font-bold tracking-wide">{coin.symbol.replace('-USD', '')}</h4>
                         <span className="text-[10px] bg-[#222] border border-[#333] px-2 py-0.5 rounded text-gray-500 font-bold">COIN</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{coin.name}</p>
                   </div>
                   <div className="flex-[2] flex justify-end">
                      <StockRow {...coin} type="directory" />
                   </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
