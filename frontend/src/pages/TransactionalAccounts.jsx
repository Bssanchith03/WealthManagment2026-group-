import { useState, useEffect } from 'react';
import { Building2, Plus, Phone, Wallet, X, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TransactionalAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  
  // Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, [user.id]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/accounts/${user.id}`);
      if (res.ok) setAccounts(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const delegation = parseFloat(initialBalance) || 0;
    
    if (delegation < 0) return alert("Delegation amount cannot be negative");
    if (delegation > unallocated) return alert(`Insufficient unallocated funds. Max available: $${unallocated.toLocaleString()}`);

    try {
      const res = await fetch('http://localhost:5001/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          bankName,
          phoneNumber,
          initialBalance: delegation
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setBankName('');
        setPhoneNumber('');
        setInitialBalance('');
        fetchAccounts();
      } else {
        const errData = await res.json();
        alert(`Failed to create account: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error connecting to the banking service.");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) return alert("Enter a valid transfer amount");
    if (!fromAccountId || !toAccountId) return alert("Select both source and destination accounts");
    if (fromAccountId === toAccountId) return alert("Source and destination accounts must be different");

    const sourceAcc = accounts.find(a => a.id === parseInt(fromAccountId));
    if (amount > parseFloat(sourceAcc.balance)) return alert("Insufficient funds in source account");

    try {
      const res = await fetch('http://localhost:5001/api/accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fromAccountId,
          toAccountId,
          amount
        })
      });
      if (res.ok) {
        setShowTransferModal(false);
        setFromAccountId('');
        setToAccountId('');
        setTransferAmount('');
        fetchAccounts();
      } else {
        const errData = await res.json();
        alert(`Transfer failed: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error during transfer.");
    }
  };

  const totalAllocated = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const unallocated = parseFloat(user.liquid_cash) - totalAllocated;

  return (
    <div className="p-8 pb-20 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Transactional Accounts</h1>
          <p className="text-gray-400">Delegate your liquid cash to bank accounts</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowTransferModal(true)}
            className="bg-[#222] hover:bg-[#333] border border-[#444] text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg"
          >
            <ArrowLeftRight size={20} /> Transfer Funds
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-white hover:bg-gray-100 text-black font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus size={20} /> Add Bank Account
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
         <div className="bg-[#151515] border border-[#222] p-8 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Wallet size={80} /></div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Liquid Cash</p>
            <h2 className="text-4xl font-black text-white">${parseFloat(user.liquid_cash).toLocaleString()}</h2>
         </div>
         <div className="bg-[#151515] border border-[#222] p-8 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-500"><Building2 size={80} /></div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Allocated</p>
            <h2 className="text-4xl font-black text-emerald-500">${totalAllocated.toLocaleString()}</h2>
         </div>
         <div className={`bg-[#151515] border border-[#222] p-8 rounded-[32px] relative overflow-hidden ${unallocated > 0 ? 'border-amber-500/30' : ''}`}>
            <div className="absolute top-0 right-0 p-6 opacity-5"><ArrowLeftRight size={80} /></div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Unallocated Funds</p>
            <h2 className={`text-4xl font-black ${unallocated > 0 ? 'text-amber-500' : 'text-gray-400'}`}>${unallocated.toLocaleString()}</h2>
            {unallocated > 0 && <p className="text-[10px] text-amber-500/70 mt-2 font-bold animate-pulse">Assign these to an account!</p>}
         </div>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
           <p className="text-gray-500 text-center col-span-full">Loading your bank network...</p>
        ) : accounts.length === 0 ? (
           <div className="col-span-full bg-[#151515] border border-dashed border-[#333] p-20 rounded-[40px] text-center">
              <Building2 className="mx-auto mb-6 text-gray-700" size={48} />
              <p className="text-gray-400 font-medium text-lg mb-6">No bank accounts linked yet.</p>
              <button onClick={() => setShowAddModal(true)} className="text-primary font-bold hover:underline">Link your first account</button>
           </div>
        ) : (
          accounts.map(acc => (
             <div key={acc.id} className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#222] p-8 rounded-[32px] hover:border-[#333] transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                         <Building2 size={28} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white">{acc.bank_name}</h3>
                         <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} /> {acc.phone_number}</p>
                      </div>
                   </div>
                   <span className="text-[10px] bg-white/10 text-white/50 px-2 py-1 rounded font-bold uppercase tracking-tighter">SAVINGS</span>
                </div>
                <div className="flex items-end justify-between">
                   <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Account Balance</p>
                      <h4 className="text-3xl font-black text-white">${parseFloat(acc.balance).toLocaleString()}</h4>
                   </div>
                   <button className="p-3 bg-white/5 rounded-xl text-gray-500 hover:bg-white/10 transition-colors">
                      <ArrowRight size={20} />
                   </button>
                </div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mb-16 -mr-16"></div>
             </div>
          ))
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[40px] p-10 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-bold text-white mb-2">Add Account</h2>
            <p className="text-gray-500 mb-8 font-medium">Link a new bank account to delegate funds</p>
            
            <form onSubmit={handleCreateAccount} className="space-y-6">
               <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Bank Name</label>
                  <input type="text" placeholder="e.g. HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} required className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-white transition-colors" />
               </div>
               <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Phone Number</label>
                  <input type="tel" placeholder="+91 999 999 999" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-white transition-colors" />
               </div>
               <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Initial Delegation ($)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-white transition-colors" />
                  <p className="text-[10px] text-gray-500 mt-2 ml-1">Maximum allowed: ${unallocated.toLocaleString()}</p>
               </div>
               <button type="submit" className="w-full bg-white hover:bg-gray-100 text-black font-black py-5 rounded-2xl shadow-xl transition-all">Link Bank Account</button>
            </form>
          </div>
        </div>
      )}
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[40px] p-10 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => setShowTransferModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-bold text-white mb-2">Transfer Funds</h2>
            <p className="text-gray-500 mb-8 font-medium">Move money between your accounts</p>
            
            <form onSubmit={handleTransfer} className="space-y-6">
               <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">From Account</label>
                  <select 
                    value={fromAccountId} 
                    onChange={e => setFromAccountId(e.target.value)} 
                    required 
                    className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-white appearance-none"
                  >
                    <option value="">Select source</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.bank_name} (${parseFloat(acc.balance).toLocaleString()})</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">To Account</label>
                  <select 
                    value={toAccountId} 
                    onChange={e => setToAccountId(e.target.value)} 
                    required 
                    className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-white appearance-none"
                  >
                    <option value="">Select destination</option>
                    {accounts.filter(a => a.id !== parseInt(fromAccountId)).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.bank_name}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 ml-1">Transfer Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={transferAmount} 
                    onChange={e => setTransferAmount(e.target.value)} 
                    className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-white transition-colors" 
                  />
               </div>
               <button type="submit" className="w-full bg-white hover:bg-gray-100 text-black font-black py-5 rounded-2xl shadow-xl transition-all">Execute Transfer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
