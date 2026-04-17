import { useState, useEffect } from 'react';
import { Plus, Landmark, X, Wallet, TrendingUp, Calendar, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FixedDeposits() {
  const { user, updateBalance } = useAuth();
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    fetchFds();
    fetchAccounts();
  }, [user.id]);

  const fetchFds = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/fixed-deposits/${user.id}`);
      if (res.ok) setFds(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
       const res = await fetch(`http://localhost:5001/api/accounts/${user.id}`);
       if (res.ok) {
          const data = await res.json();
          setAccounts(data);
          if (data.length > 0) setSelectedAccountId(data[0].id);
       }
    } catch (err) {
       console.error(err);
    }
  };

  const handleCreateFD = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedAccountId) return setError("Please select an account.");

    const principal = parseFloat(amount);
    const selectedAccount = accounts.find(a => a.id === parseInt(selectedAccountId));

    if (!selectedAccount || parseFloat(selectedAccount.balance) < principal) {
      setError("Insufficient funds in the selected account.");
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/fixed-deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          bankName,
          amount: principal,
          rate: parseFloat(rate),
          duration: parseInt(duration),
          accountId: selectedAccountId
        })
      });

      if (res.ok) {
        updateBalance(parseFloat(user.liquid_cash) - principal);
        setShowModal(false);
        setBankName('');
        setAmount('');
        setRate('');
        setDuration('');
        fetchFds();
        fetchAccounts(); // Update balances
      } else {
        const d = await res.json();
        setError(d.error);
      }
    } catch (err) {
      setError("Failed to create FD. Check backend.");
    }
  };

  const calculateMaturity = (principal, rate, months) => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseInt(months) / 12;
    return p * (1 + r * t);
  };

  const totalInvested = fds.reduce((sum, fd) => sum + parseFloat(fd.principal_amount), 0);
  const totalMaturity = fds.reduce((sum, fd) => sum + calculateMaturity(fd.principal_amount, fd.interest_rate, fd.duration_months), 0);

  return (
    <div className="p-8 pb-20 max-w-6xl mx-auto h-full relative">
      <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Fixed Deposits</h1>
           <p className="text-gray-400">Secure your wealth with stable returns</p>
         </div>
         <button 
           onClick={() => setShowModal(true)}
           className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black font-bold px-6 py-3 rounded-2xl transition-all shadow-lg"
         >
            <Plus size={20} /> New FD
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
         <div className="bg-[#151515] border border-[#222] rounded-[32px] p-8 shadow-sm">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 flex items-center gap-2">
              <Wallet size={12} /> Total Invested
            </p>
            <h2 className="text-4xl font-black text-white">${totalInvested.toLocaleString()}</h2>
         </div>
         <div className="bg-[#151515] border border-[#222] rounded-[32px] p-8 shadow-sm">
            <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-1 flex items-center gap-2">
              <TrendingUp size={12} className="text-primary" /> Maturity Value
            </p>
            <h2 className="text-4xl font-black text-primary">${totalMaturity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
         </div>
      </div>

      <div className="bg-[#151515] border border-[#222] rounded-[32px] overflow-hidden min-h-[400px]">
        {loading ? (
           <div className="p-12 text-center text-gray-500 animate-pulse">Scanning ledgers...</div>
        ) : fds.length === 0 ? (
           <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-6 text-gray-500 ring-4 ring-[#1a1a1a]">
                  <Landmark size={32} />
              </div>
              <p className="text-gray-400 font-medium text-lg mb-8">No fixed deposits tracked.</p>
              <button onClick={() => setShowModal(true)} className="text-primary font-bold hover:underline">Setup your first FD</button>
           </div>
        ) : (
          <div className="divide-y divide-[#222]">
            {fds.map((fd) => (
              <div key={fd.id} className="p-8 flex items-center justify-between hover:bg-[#1a1a1a] transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#222] border border-[#333] rounded-[20px] flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg">
                    <Landmark size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{fd.bank_name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                       <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                         <Calendar size={12} /> {new Date(fd.start_date).toLocaleDateString()}
                       </p>
                       <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                       <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{fd.duration_months} Months</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-16 text-right">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Principal</p>
                    <p className="text-xl font-black text-white">${parseFloat(fd.principal_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Rate</p>
                    <p className="text-xl font-black text-primary">{fd.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Est. Maturity</p>
                    <p className="text-xl font-black text-white">
                      ${calculateMaturity(fd.principal_amount, fd.interest_rate, fd.duration_months).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[40px] p-10 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-bold text-white mb-2">New Deposit</h2>
            <p className="text-gray-500 mb-8 font-medium">Invest your liquid capital safely</p>

            {error && <p className="text-red-500 text-sm mb-6 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 shadow-sm">{error}</p>}

            <form onSubmit={handleCreateFD} className="space-y-6">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Issuing Bank</label>
                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. JPMorgan Chase" className="w-full bg-[#111] border border-[#222] focus:border-white rounded-2xl p-5 text-white outline-none transition-all" required />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Funding Account</label>
                <select 
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] focus:border-white rounded-2xl p-5 text-white appearance-none outline-none transition-all"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bank_name} (${parseFloat(acc.balance).toLocaleString()})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Amount ($)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10000" className="w-full bg-[#111] border border-[#222] focus:border-white rounded-2xl p-5 text-white outline-none transition-all" required />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Rate (%)</label>
                  <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="5.2" className="w-full bg-[#111] border border-[#222] focus:border-white rounded-2xl p-5 text-white outline-none transition-all" required />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Duration (Months)</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="12" className="w-full bg-[#111] border border-[#222] focus:border-white rounded-2xl p-5 text-white outline-none transition-all" required />
              </div>

              <button type="submit" className="w-full bg-white hover:bg-gray-100 text-black font-black py-5 rounded-2xl transition-all shadow-xl">Confirm FD Creation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
