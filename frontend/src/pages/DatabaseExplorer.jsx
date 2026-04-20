import { useState, useEffect } from 'react';
import { Database, RefreshCw, Terminal, ChevronDown, ChevronRight, Table as TableIcon } from 'lucide-react';

export default function DatabaseExplorer() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTables, setExpandedTables] = useState({});

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const fetchSnapshot = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/admin/db-snapshot');
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
        // Initially expand all tables
        const initialExpand = {};
        Object.keys(data).forEach(k => initialExpand[k] = true);
        setExpandedTables(initialExpand);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableName) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  if (loading && !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
        <RefreshCw className="animate-spin" size={32} />
        <p className="font-mono text-sm tracking-widest uppercase">Connecting to SQL Cluster...</p>
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto h-full overflow-y-auto font-mono">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Database size={24} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">RDBMS Explorer</h1>
          </div>
          <p className="text-gray-500 text-xs">Real-time inspection of core SQL entities and relational integrity</p>
        </div>
        <button 
          onClick={fetchSnapshot}
          className="flex items-center gap-2 bg-[#111] border border-[#222] hover:border-primary/50 text-gray-400 hover:text-primary px-6 py-3 rounded-2xl transition-all shadow-xl group"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          <span className="text-sm font-bold uppercase tracking-widest">Execute Sync</span>
        </button>
      </div>

      <div className="space-y-8">
        {snapshot && Object.entries(snapshot).map(([tableName, rows]) => (
          <div key={tableName} className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden shadow-2xl">
            <div 
              onClick={() => toggleTable(tableName)}
              className="flex items-center justify-between p-6 bg-[#151515] hover:bg-[#1a1a1a] cursor-pointer transition-colors border-b border-[#222]"
            >
              <div className="flex items-center gap-4">
                <div className={`transition-transform duration-200 ${expandedTables[tableName] ? 'rotate-0' : '-rotate-90'}`}>
                  <ChevronDown size={20} className="text-gray-600" />
                </div>
                <div className="flex items-center gap-2">
                  <TableIcon size={18} className="text-primary/70" />
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    dbo.<span className="text-primary">{tableName}</span>
                  </h3>
                </div>
                <span className="text-[10px] bg-[#222] text-gray-500 px-2 py-1 rounded font-bold uppercase tracking-tighter border border-[#333]">
                  {rows.length} Rows
                </span>
              </div>
              <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                Relational Entity
              </div>
            </div>

            {expandedTables[tableName] && (
              <div className="overflow-x-auto">
                {rows.length === 0 ? (
                  <div className="p-10 text-center text-gray-700 italic text-sm">
                    No data found in entity '{tableName}'. Waiting for transactions...
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0c0c0c] border-b border-[#222]">
                        {Object.keys(rows[0]).map(col => (
                          <th key={col} className="p-4 text-[10px] text-gray-500 uppercase font-black tracking-widest border-r border-[#222] last:border-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#151515] transition-colors last:border-0">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="p-4 text-xs font-medium text-gray-400 border-r border-[#1a1a1a] last:border-0 max-w-[300px] truncate">
                              {val === null ? (
                                <span className="text-red-900 opacity-50">NULL</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-3xl flex items-start gap-4">
        <Terminal size={24} className="text-primary mt-1" />
        <div>
          <h4 className="text-primary font-black text-sm uppercase tracking-widest mb-2">Technical Insight</h4>
          <p className="text-gray-400 text-xs leading-relaxed max-w-3xl">
            This explorer provides direct serialization of our MySQL pool. Each table is mapped according to our relational schema defined in <span className="text-white">backend/db.js</span>. 
            All timestamps are UTC-synchronized, and financial decimals are rounded to statutory precision. 
            Open browser <span className="text-white">DevTools (Network Tab)</span> to see the raw JSON payload as it arrives from the orchestration layer.
          </p>
        </div>
      </div>
    </div>
  );
}
