import { useState, useEffect } from 'react';
import { Plus, Wallet, Landmark, Calendar, Clock, DollarSign, X, ArrowRight, TrendingDown, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Loans() {
  const { user, updateBalance } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Bank Accounts
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // New Loan Form
  const [loanType, setLoanType] = useState('Home');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [duration, setDuration] = useState('');
  const [addCashToWallet, setAddCashToWallet] = useState(true);
  
  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [isExtraPayment, setIsExtraPayment] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoans();
    fetchAccounts();
  }, [user.id]);

  const fetchLoans = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/loans/${user.id}`);
      if (res.ok) setLoans(await res.json());
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

  const calculateMonthlyPayment = (p, r, n) => {
    const monthlyRate = (r / 100) / 12;
    if (monthlyRate === 0) return p / n;
    return (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  };

  const handleTakeLoan = async (e) => {
    e.preventDefault();
    if (addCashToWallet && !selectedAccountId) {
       alert("Please select an account for disbursement");
       return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: loanType,
          bankName,
          amount: parseFloat(amount),
          rate: parseFloat(rate),
          duration: parseInt(duration),
          addCash: addCashToWallet,
          accountId: selectedAccountId
        })
      });

      if (res.ok) {
        if (addCashToWallet) updateBalance(parseFloat(user.liquid_cash) + parseFloat(amount));
        setShowLoanModal(false);
        resetLoanForm();
        fetchLoans();
        fetchAccounts();
      } else {
        const errData = await res.json();
        alert(`Failed to take loan: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error creating loan. Is the backend running?");
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedAccountId) {
       setError("Select a bank account");
       return;
    }

    const selectedAccount = accounts.find(a => a.id === parseInt(selectedAccountId));
    if (!selectedAccount || parseFloat(selectedAccount.balance) < parseFloat(payAmount)) {
      setError("Insufficient funds in selected account");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/loans/${selectedLoan.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: parseFloat(payAmount),
          paymentType: isExtraPayment ? 'Extra' : 'Regular',
          accountId: selectedAccountId
        })
      });

      if (res.ok) {
        updateBalance(parseFloat(user.liquid_cash) - parseFloat(payAmount));
        setShowPayModal(false);
        setPayAmount('');
        fetchLoans();
        fetchAccounts();
      }
    } catch (err) {
      setError("Payment failed");
    }
  };

  const resetLoanForm = () => {
    setBankName('');
    setAmount('');
    setRate('');
    setDuration('');
  };

  const totalDebt = loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance), 0);

  return (
    <div className="p-8 pb-20 max-w-6xl mx-auto relative h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Loans</h1>
          <p className="text-gray-400">Manage your liabilities and track repayments</p>
        </div>
        <button 
          onClick={() => setShowLoanModal(true)}
          className="flex items-center gap-2 bg-[#ef4444] hover:bg-red-500 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg"
        >
          <Plus size={20} /> Take a Loan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="md:col-span-2 bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#222] rounded-[32px] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Landmark size={120} />
          </div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Total Debt Outstanding</p>
          <h2 className="text-5xl font-black text-white mb-6">${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          <div className="flex items-center gap-4">
             <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full flex items-center gap-2">
                <TrendingDown size={14} className="text-red-500" />
                <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">{loans.length} Active Loans</span>
             </div>
          </div>
        </div>
        <div className="bg-[#151515] border border-[#222] rounded-[32px] p-8 flex flex-col justify-center">
             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Monthly EMIs</p>
             <h3 className="text-3xl font-black text-white">
                ${loans.reduce((sum, loan) => sum + calculateMonthlyPayment(parseFloat(loan.principal_amount), parseFloat(loan.interest_rate), parseInt(loan.duration_months)), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </h3>
             <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tight">Consolidated Repayment</p>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-gray-500 animate-pulse">Calculating balances...</p>
        ) : loans.length === 0 ? (
          <div className="bg-[#151515] border border-dashed border-[#333] rounded-[32px] p-24 text-center">
            <div className="w-20 h-20 bg-[#222] rounded-full flex items-center justify-center mx-auto mb-8 text-gray-700 shadow-inner">
               <Wallet size={40} />
            </div>
            <p className="text-gray-400 font-medium text-lg">Clean slate! No active loans found.</p>
          </div>
        ) : (
          loans.map(loan => {
             const monthly = calculateMonthlyPayment(parseFloat(loan.principal_amount), parseFloat(loan.interest_rate), parseInt(loan.duration_months));
             const progress = (1 - (parseFloat(loan.remaining_balance) / parseFloat(loan.principal_amount))) * 100;
             return (
               <div key={loan.id} className="bg-[#151515] border border-[#222] rounded-[32px] p-8 hover:border-[#333] transition-all group relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-8 mb-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-[20px] flex items-center justify-center text-red-500 shadow-lg group-hover:scale-110 transition-transform">
                        <DollarSign size={32} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">{loan.type} Loan</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1.5 flex items-center gap-2">
                           <Building2 size={12} /> {loan.bank_name} • {loan.interest_rate}%
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-12">
                       <div className="text-right">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Remaining</p>
                          <p className="text-2xl font-black text-white">${parseFloat(loan.remaining_balance).toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Monthly EMI</p>
                          <p className="text-2xl font-black text-white">${monthly.toFixed(2)}</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="mb-8 relative z-10">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Progress to Freedom</span>
                       <span className="text-[10px] text-white font-black">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#222] rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 relative z-10">
                     <button 
                        onClick={() => { setSelectedLoan(loan); setShowPayModal(true); setIsExtraPayment(false); }}
                        className="text-[10px] font-black uppercase tracking-widest text-white bg-[#222] hover:bg-[#333] px-6 py-3 rounded-xl transition-all border border-[#222]"
                     >
                        Pay EMI
                     </button>
                     <button 
                        onClick={() => { setSelectedLoan(loan); setShowPayModal(true); setIsExtraPayment(true); }}
                        className="text-[10px] font-black uppercase tracking-widest text-black bg-white hover:bg-gray-200 px-6 py-3 rounded-xl transition-all shadow-md"
                     >
                        Extra Payment
                     </button>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mt-32 -mr-32"></div>
               </div>
             );
          })
        )}
      </div>

      {/* Take Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[40px] p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowLoanModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-bold text-white mb-2">Take Loan</h2>
            <p className="text-gray-500 mb-8 font-medium">Inject capital into your business network</p>
            
            <form onSubmit={handleTakeLoan} className="space-y-6">
               <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Loan Category</label>
                  <select 
                    value={loanType} onChange={e => setLoanType(e.target.value)}
                    className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-red-500 transition-all appearance-none"
                  >
                    <option value="Home">Home Loan</option>
                    <option value="Car">Car Loan</option>
                    <option value="Business">Business Loan</option>
                    <option value="Education">Education Loan</option>
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Issuing Bank</label>
                  <input type="text" placeholder="e.g. Standard Chartered" value={bankName} onChange={e => setBankName(e.target.value)} required className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-red-500" />
               </div>

               <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Deposit To Account</label>
                  <select 
                    value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
                    required={addCashToWallet}
                    className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-red-500 appearance-none"
                  >
                    <option value="">Select disbursement bank</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bank_name}</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Principal ($)</label>
                    <input type="number" placeholder="50000" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">APR (%)</label>
                    <input type="number" step="0.1" placeholder="7.5" value={rate} onChange={e => setRate(e.target.value)} required className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-red-500" />
                  </div>
               </div>
               
               <div className="flex items-center gap-3 p-5 bg-white/5 rounded-2xl border border-white/10" onClick={() => setAddCashToWallet(!addCashToWallet)}>
                  <div className={`w-6 h-6 rounded-lg border ${addCashToWallet ? 'bg-red-500 border-red-500' : 'border-gray-600'} flex items-center justify-center transition-all cursor-pointer shadow-inner`}>
                     {addCashToWallet && <ArrowRight size={14} className="text-white" />}
                  </div>
                  <p className="text-xs text-gray-300 font-bold uppercase tracking-tight cursor-pointer">Inject into primary liquidity pool</p>
               </div>
               
               <button type="submit" className="w-full bg-[#ef4444] hover:bg-red-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-500/30 transition-all">Disburse Capital</button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[40px] p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowPayModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X size={24} /></button>
            <h2 className="text-3xl font-bold text-white mb-2">{isExtraPayment ? 'Extra' : 'Regular'} EMI</h2>
            <p className="text-[10px] text-gray-500 mb-8 uppercase font-black tracking-widest">{selectedLoan.bank_name} {selectedLoan.type}</p>
            
            {error && <p className="text-red-500 text-sm mb-6 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{error}</p>}
            
            <form onSubmit={handlePayment} className="space-y-6">
               <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Payout Account</label>
                  <select 
                    value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
                    required
                    className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white appearance-none outline-none focus:border-red-500"
                  >
                    <option value="">Choose bank account</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bank_name} (${parseFloat(acc.balance).toLocaleString()})</option>)}
                  </select>
               </div>

               <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Payment Amount ($)</label>
                  <input 
                    type="number" 
                    value={payAmount} 
                    onChange={e => setPayAmount(e.target.value)} 
                    placeholder={isExtraPayment ? "Custom" : calculateMonthlyPayment(parseFloat(selectedLoan.principal_amount), parseFloat(selectedLoan.interest_rate), parseInt(selectedLoan.duration_months)).toFixed(2)}
                    required 
                    className="w-full bg-[#111] border border-[#222] rounded-2xl p-5 text-white outline-none focus:border-red-500" 
                  />
               </div>
               <button type="submit" className="w-full bg-white hover:bg-gray-200 text-black font-black py-5 rounded-2xl shadow-xl transition-all">Execute Payment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
