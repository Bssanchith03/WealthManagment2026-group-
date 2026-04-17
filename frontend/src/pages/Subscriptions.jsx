import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, TrendingDown, Wifi, Phone, Droplets, Zap, X, Landmark, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PROVIDER_DATA = {
  Phone: {
    'Jio': [
      { name: 'Truly Unlimited 299', price: 3.60, frequency: '1m', benefits: '2GB/Day, Unlimited Voice, 100 SMS/Day' },
      { name: 'Super Value 666', price: 8.00, frequency: '3m', benefits: '1.5GB/Day, JioTV, JioCinema, JioCloud' },
      { name: 'Annual Plan 2999', price: 36.00, frequency: '1y', benefits: '2.5GB/Day, Unlimited Voice, 100 SMS/Day' }
    ],
    'Airtel': [
      { name: 'Black 1099', price: 13.50, frequency: '1m', benefits: 'Unlimited Data, Amazon Prime, Disney+ Hotstar' },
      { name: 'Truly Unlimited 479', price: 5.80, frequency: '2m', benefits: '1.5GB/Day, Apollo 24|7 Circle, Free Hellotunes' },
      { name: 'Entertainment 999', price: 12.00, frequency: '1m', benefits: '2.5GB/Day, Xstream Mobile Pack' }
    ],
    'Vodafone': [
      { name: 'Hero Unlimited 449', price: 5.40, frequency: '1m', benefits: 'Unlimited Night Data (12AM-6AM), Data rollover' },
      { name: 'International Roaming', price: 45.00, frequency: '1m', benefits: 'Travel across 81 countries, Unlimited incoming' }
    ],
    'BSNL': [
      { name: 'Voice 187', price: 2.25, frequency: '1m', benefits: 'Unlimited Voice, 2GB/Day, 100 SMS/Day' },
      { name: 'Fiber Basic', price: 6.00, frequency: '1m', benefits: '30 Mbps speed, 3300 GB FUP' }
    ]
  },
  WiFi: {
    'JioFiber': [
      { name: 'Basic 399', price: 4.80, frequency: '1m', benefits: '30 Mbps, Unlimited Data' },
      { name: 'Gold 999', price: 12.00, frequency: '1m', benefits: '150 Mbps, 15 OTT Apps (Amazon Prime, Disney+)' },
      { name: 'Titanium 8499', price: 102.00, frequency: '1m', benefits: '1 Gbps speed, All OTT Apps, 6600GB FUP' }
    ],
    'Airtel xStream': [
      { name: 'Basic 499', price: 6.00, frequency: '1m', benefits: '40 Mbps, Xstream Premium' },
      { name: 'Professional 1498', price: 18.00, frequency: '1m', benefits: '300 Mbps, Netflix, Amazon Prime included' }
    ],
    'ACT Fibernet': [
      { name: 'ACT Basic', price: 6.50, frequency: '1m', benefits: '40 Mbps, 500GB FUP' },
      { name: 'ACT Incredible', price: 24.00, frequency: '1m', benefits: '350 Mbps, 3300GB FUP' }
    ],
    'Tata Play Fiber': [
      { name: '100 Mbps Plan', price: 10.50, frequency: '1m', benefits: 'Unlimited Data, Free Router & Installation' },
      { name: '500 Mbps Mega', price: 28.00, frequency: '1m', benefits: 'High speed, Zero latency for gaming' }
    ],
    'Hathaway': [
      { name: 'Speedy 50', price: 8.50, frequency: '3m', benefits: '50 Mbps, Truly Unlimited' },
      { name: 'Freedom Plan', price: 18.00, frequency: '6m', benefits: '100 Mbps, Special price for long term' }
    ]
  }
};

export default function Subscriptions() {
  const { user } = useAuth();
  const [activeSubs, setActiveSubs] = useState([]);
  const [activeBills, setActiveBills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Bill Modal state
  const [showBillModal, setShowBillModal] = useState(false);
  const [billType, setBillType] = useState('WiFi');
  const [company, setCompany] = useState('');
  const [packageName, setPackageName] = useState('');
  const [price, setPrice] = useState('');
  const [frequency, setFrequency] = useState('1m');
  const [benefits, setBenefits] = useState('');

  const famousSubs = [
    { name: 'Netflix', cost: 15.49, icon: '📺' },
    { name: 'Spotify', cost: 10.99, icon: '🎵' },
    { name: 'Amazon Prime', cost: 14.99, icon: '📦' },
    { name: 'YouTube Premium', cost: 13.99, icon: '📹' },
    { name: 'Disney+', cost: 13.99, icon: '🐭' },
    { name: 'HBO Max', cost: 15.99, icon: '🎬' },
    { name: 'ChatGPT Plus', cost: 20.00, icon: '🤖' },
  ];

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, billsRes] = await Promise.all([
        fetch(`http://localhost:5001/api/subscriptions/${user.id}`),
        fetch(`http://localhost:5001/api/bills/${user.id}`)
      ]);
      
      if (subsRes.ok) setActiveSubs(await subsRes.json());
      if (billsRes.ok) setActiveBills(await billsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSub = async (serviceName, cost) => {
    try {
      const res = await fetch('http://localhost:5001/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, serviceName, cost })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const removeSub = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/subscriptions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          type: billType, 
          company, 
          packageName, 
          price: parseFloat(price), 
          frequency 
        })
      });
      if (res.ok) {
        setShowBillModal(false);
        resetBillForm();
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Failed to confirm bill: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Is the backend running?");
    }
  };

  const removeBill = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/bills/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetBillForm = () => {
     setCompany('');
     setPackageName('');
     setPrice('');
     setFrequency('1m');
     setBenefits('');
  };

  const handleCompanyChange = (val) => {
     setCompany(val);
     setPackageName('');
     setPrice('');
     setFrequency('1m');
     setBenefits('');
  };

  const handlePackageChange = (pkgName) => {
     setPackageName(pkgName);
     if (company !== 'Other') {
        const pkg = PROVIDER_DATA[billType][company].find(p => p.name === pkgName);
        if (pkg) {
           setPrice(pkg.price);
           setFrequency(pkg.frequency);
           setBenefits(pkg.benefits);
        }
     }
  };

  const getMonthlyEquivalent = (price, freq) => {
    const p = parseFloat(price);
    if (freq === '1m') return p;
    if (freq === '2m') return p / 2;
    if (freq === '3m') return p / 3;
    if (freq === '6m') return p / 6;
    if (freq === '1y') return p / 12;
    return p;
  };

  const subMonthly = activeSubs.reduce((sum, sub) => sum + parseFloat(sub.monthly_cost), 0);
  const billMonthly = activeBills.reduce((sum, bill) => sum + getMonthlyEquivalent(bill.price, bill.frequency), 0);
  
  const totalMonthly = subMonthly + billMonthly;
  const totalYearly = totalMonthly * 12;

  const utilities = [
    { type: 'Phone', icon: Phone, color: 'text-blue-500' },
    { type: 'WiFi', icon: Wifi, color: 'text-emerald-500' },
    { type: 'Water', icon: Droplets, color: 'text-cyan-500', placeholder: true },
    { type: 'Electricity', icon: Zap, color: 'text-yellow-500', placeholder: true },
  ];

  const availableCompanies = PROVIDER_DATA[billType] ? Object.keys(PROVIDER_DATA[billType]) : [];

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Subscriptions & Bills</h1>
          <p className="text-gray-400">Track and manage your recurring burn</p>
        </div>
        <div className="bg-[#151515] border border-[#222] rounded-2xl px-6 py-3 flex items-center gap-6 shadow-sm">
           <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Monthly Burn</p>
              <p className="text-red-500 font-black text-xl">${totalMonthly.toFixed(2)}</p>
           </div>
           <div className="w-px h-10 bg-[#222]"></div>
           <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Yearly Forecast</p>
              <p className="text-red-400 font-black text-xl">${totalYearly.toFixed(2)}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Famous & Bills Input */}
        <div className="xl:col-span-2 space-y-10">
          
          {/* Utility Bills Section */}
          <section>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Landmark size={20} className="text-primary" /> Utility Bills
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {utilities.map(util => (
                  <div 
                    key={util.type} 
                    onClick={() => !util.placeholder && (setBillType(util.type), setShowBillModal(true))}
                    className={`bg-[#151515] border border-[#222] p-5 rounded-2xl group transition-all ${util.placeholder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg bg-[#222] ${util.color} group-hover:scale-110 transition-transform`}>
                           <util.icon size={20} />
                        </div>
                        {util.placeholder ? (
                           <span className="text-[8px] bg-[#222] text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Coming Soon</span>
                        ) : (
                           <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus size={14} className="text-primary" />
                           </div>
                        )}
                     </div>
                     <h3 className="text-white font-bold">{util.type}</h3>
                     <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                        {activeBills.find(b => b.type === util.type) ? 'Tracked' : util.placeholder ? 'Locked' : 'Add Bill'}
                     </p>
                  </div>
               ))}
            </div>
          </section>

          {/* Famous Subscriptions */}
          <section>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus size={20} className="text-primary" /> Suggeted Subscriptions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {famousSubs.map((sub) => (
                <div key={sub.name} className="bg-[#151515] border border-[#222] rounded-2xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#222] rounded-xl flex items-center justify-center text-2xl">
                      {sub.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{sub.name}</h3>
                      <p className="text-sm text-gray-500">${sub.cost}/mo</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addSub(sub.name, sub.cost)}
                    className="bg-[#222] hover:bg-primary hover:text-black w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Active Items */}
        <div className="space-y-8">
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-red-500" /> Active Burn
          </h2>
          <div className="bg-[#151515] border border-[#222] rounded-[32px] p-6 shadow-2xl min-h-[500px]">
            {loading ? (
               <div className="py-20 text-center text-gray-500 animate-pulse">Checking records...</div>
            ) : (activeSubs.length === 0 && activeBills.length === 0) ? (
               <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-6">
                    <TrendingDown size={32} />
                  </div>
                  <p className="font-medium">Clean sheet! No active expenses.</p>
               </div>
            ) : (
                <div className="space-y-6">
                  {/* Bills List */}
                  {activeBills.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1">Utility Bills</p>
                      {activeBills.map(bill => (
                        <div key={bill.id} className="bg-[#1a1a1a] border border-[#222] p-4 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                           <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-bold">{bill.company}</h4>
                                <span className="text-[8px] bg-[#222] text-gray-400 px-1.5 py-0.5 rounded-full font-bold uppercase">{bill.type}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-medium">{bill.package_name} • Every {bill.frequency}</p>
                              <p className="text-xs text-red-500 font-bold mt-1">-${getMonthlyEquivalent(bill.price, bill.frequency).toFixed(2)}/mo</p>
                           </div>
                           <button onClick={() => removeBill(bill.id)} className="text-gray-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subscriptions List */}
                  {activeSubs.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-[#222]">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1">Services</p>
                      {activeSubs.map(sub => (
                        <div key={sub.id} className="bg-[#1a1a1a] border border-[#222] p-4 rounded-2xl flex items-center justify-between group hover:border-red-500/30 transition-colors">
                           <div>
                              <h4 className="text-white font-bold">{sub.service_name}</h4>
                              <p className="text-xs text-red-500 font-bold">-${parseFloat(sub.monthly_cost).toFixed(2)}/mo</p>
                           </div>
                           <button onClick={() => removeSub(sub.id)} className="text-gray-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
           <div className="bg-[#1a1a1a] border border-[#333] rounded-[32px] p-8 w-full max-w-md relative shadow-2xl">
              <button 
                onClick={() => setShowBillModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-1">Add {billType} Bill</h2>
              <p className="text-sm text-gray-500 mb-8 font-medium">Configure your recurring utility expense</p>
              
              <form onSubmit={handleAddBill} className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Company</label>
                    <select 
                      value={company}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      required
                      className="w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white outline-none focus:border-primary transition-colors appearance-none"
                    >
                       <option value="">Select Provider</option>
                       {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                       <option value="Other">Other (Custom)</option>
                    </select>
                 </div>

                 {company === 'Other' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Custom Company Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. MyLocalISP" 
                        defaultValue=""
                        onBlur={(e) => setCompany(e.target.value)}
                        className="w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white outline-none focus:border-primary transition-colors"
                      />
                    </div>
                 )}

                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Package</label>
                    {company && company !== 'Other' ? (
                       <select 
                          value={packageName}
                          onChange={(e) => handlePackageChange(e.target.value)}
                          required
                          className="w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white outline-none focus:border-primary transition-colors appearance-none"
                       >
                          <option value="">Select Package</option>
                          {PROVIDER_DATA[billType][company].map(pkg => (
                             <option key={pkg.name} value={pkg.name}>{pkg.name}</option>
                          ))}
                          <option value="Other">Custom Package</option>
                       </select>
                    ) : (
                       <input 
                        type="text" 
                        placeholder={company === 'Other' ? "e.g. Custom Duo Plan" : "Select a company first"} 
                        value={packageName}
                        disabled={!company}
                        onChange={(e) => setPackageName(e.target.value)}
                        required
                        className="w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white outline-none focus:border-primary transition-colors disabled:opacity-50"
                      />
                    )}
                 </div>

                 {/* Benefits Display */}
                 {benefits && (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex gap-3 animate-in zoom-in-95 duration-300">
                       <Check size={16} className="text-primary mt-0.5 shrink-0" />
                       <div className="text-xs text-gray-300 font-medium whitespace-pre-wrap">{benefits}</div>
                    </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Price ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="59.99" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        readOnly={company !== 'Other' && packageName !== 'Other' && !!price}
                        required
                        className={`w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white outline-none focus:border-primary transition-colors ${company !== 'Other' && packageName !== 'Other' && price ? 'opacity-70 cursor-not-allowed' : ''}`}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Frequency</label>
                      <select 
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        disabled={company !== 'Other' && packageName !== 'Other' && !!frequency}
                        className={`w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white outline-none focus:border-primary transition-colors appearance-none ${company !== 'Other' && packageName !== 'Other' && frequency ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                         <option value="1m">Monthly (1m)</option>
                         <option value="2m">Every 2 Months</option>
                         <option value="3m">Quarterly (3m)</option>
                         <option value="6m">Half-Yearly (6m)</option>
                         <option value="1y">Yearly (1y)</option>
                      </select>
                   </div>
                 </div>
                 
                 <button 
                   type="submit"
                   className="w-full bg-primary hover:bg-emerald-400 text-[#111] font-black py-4 rounded-xl transition-all shadow-lg shadow-primary/20"
                 >
                   Confirm Bill
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
