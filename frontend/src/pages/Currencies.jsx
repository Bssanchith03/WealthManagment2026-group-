import { useState } from 'react';
import { Search } from 'lucide-react';

export default function Currencies() {
  const [search, setSearch] = useState('');

  const currencies = [
    { code: 'EUR', name: 'Euro', pair: 'USD ⇄ EUR', rate: 0.9234, change: -0.0012, isPositive: false },
    { code: 'GBP', name: 'British Pound', pair: 'USD ⇄ GBP', rate: 0.7891, change: 0.0023, isPositive: true },
    { code: 'JPY', name: 'Japanese Yen', pair: 'USD ⇄ JPY', rate: 154.8200, change: 0.4500, isPositive: true },
    { code: 'INR', name: 'Indian Rumee', pair: 'USD ⇄ INR', rate: 83.4500, change: -0.1200, isPositive: false },
    { code: 'CAD', name: 'Canadian Dollar', pair: 'USD ⇄ CAD', rate: 1.3712, change: 0.0034, isPositive: true },
    { code: 'AUD', name: 'Australian Dollar', pair: 'USD ⇄ AUD', rate: 1.5321, change: -0.0056, isPositive: false },
    { code: 'CHF', name: 'Swiss Franc', pair: 'USD ⇄ CHF', rate: 0.8823, change: 0.0041, isPositive: true },
  ];

  const filtered = currencies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 pb-20 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Currency Rates</h1>
        <p className="text-gray-400">Exchange rates against USD</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          placeholder="Search currencies..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#151515] border border-[#333] rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#555] transition-colors shadow-sm"
        />
      </div>

      <div className="bg-[#151515] border border-[#222] rounded-[24px] p-6 flex-1 overflow-y-auto">
         <div className="space-y-2">
            {filtered.map(c => (
               <div key={c.code} className="flex items-center justify-between py-4 border-b border-[#222] last:border-0 hover:bg-[#1a1a1a] px-3 rounded-xl transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center font-bold text-white shadow-inner">
                        {c.code}
                     </div>
                     <div>
                        <h3 className="text-white font-bold tracking-tight">{c.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.pair}</p>
                     </div>
                  </div>

                  <div className="text-right">
                     <p className="text-white font-bold">{c.rate.toFixed(4)}</p>
                     <p className={`text-xs font-bold mt-1 ${c.isPositive ? 'text-primary' : 'text-red-500'}`}>
                        {c.isPositive ? '+' : ''}{c.change.toFixed(4)}
                     </p>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
