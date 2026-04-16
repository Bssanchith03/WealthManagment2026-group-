import { Plus, Landmark } from 'lucide-react';

export default function FixedDeposits() {
  return (
    <div className="p-8 pb-20 max-w-5xl mx-auto h-full">
      <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Fixed Deposits</h1>
           <p className="text-gray-400">Manage your FD accounts</p>
         </div>
         <button className="flex items-center gap-2 bg-[#10b981] hover:bg-emerald-400 text-[#111] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus size={18} /> New FD
         </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <div className="bg-[#151515] border border-[#222] rounded-[24px] p-6 shadow-sm">
            <p className="text-gray-400 text-sm font-medium mb-2">Total Invested</p>
            <h2 className="text-3xl font-bold text-white">$0.00</h2>
         </div>
         <div className="bg-[#151515] border border-[#222] rounded-[24px] p-6 shadow-sm">
            <p className="text-gray-400 text-sm font-medium mb-2">Maturity Value</p>
            <h2 className="text-3xl font-bold text-primary">$0.00</h2>
         </div>
      </div>

      {/* Empty State */}
      <div className="bg-[#151515] border border-[#222] rounded-[24px] p-16 flex flex-col items-center justify-center text-center">
         <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-6 text-gray-500">
            <Landmark size={32} />
         </div>
         <p className="text-gray-400 font-medium">No fixed deposits yet. Create one to get started.</p>
      </div>
    </div>
  );
}
