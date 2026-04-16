export default function StatCard({ title, amount, changeText, changePositive, icon: Icon }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-[20px] p-5 flex flex-col justify-between h-full relative overflow-hidden transition-all hover:bg-[#1e1e1e]">
      
      {/* Background Glow Effect - Subtle */}
      {changePositive !== undefined && (
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-[0.03] rounded-full translate-x-1/2 -translate-y-1/2
          ${changePositive ? 'bg-primary' : 'bg-red-500'}`} 
        />
      )}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        {Icon && (
          <div className="bg-[#222] p-1.5 rounded-lg border border-[#333]">
             <Icon size={16} className={changePositive ? "text-primary" : "text-gray-400"} />
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{amount}</h2>
        {changeText && (
          <p className={`text-sm font-semibold ${changePositive ? 'text-primary' : 'text-red-500'}`}>
            {changeText}
          </p>
        )}
      </div>
    </div>
  );
}
