import { RefreshCw } from 'lucide-react';

export default function News() {
  const articles = [
    {
      ticker: 'AAPL',
      sentiment: 'positive',
      title: "Apple's Stock Surges Amid Strong Earnings Report",
      description: "Apple Inc. (AAPL) reported better-than-expected earnings for the first quarter of 2026, leading to a 2.9% increase in its stock price to $266.43. The company's strong performance was driven by robust iPhone sales and growth in its services division.",
      source: "AP News",
      date: "2026-04-16"
    },
    {
      ticker: 'MSFT',
      sentiment: 'positive',
      title: "Microsoft's Stock Climbs Following AI Investment Announcement",
      description: "Microsoft Corporation (MSFT) announced a significant investment in artificial intelligence research, causing its stock to rise by 4.6% to $411.22. The move is expected to enhance Microsoft's cloud computing and software offerings.",
      source: "Reuters",
      date: "2026-04-16"
    },
    {
      ticker: 'GOOGL',
      sentiment: 'neutral',
      title: "Alphabet's Stock Edges Higher Amid Regulatory Scrutiny",
      description: "Alphabet Inc. (GOOGL) saw a modest 1.3% increase in its stock price to $337.12, despite ongoing regulatory scrutiny over its advertising practices. The company is working to address concerns raised by antitrust authorities.",
      source: "Bloomberg",
      date: "2026-04-16"
    },
    {
      ticker: 'AMZN',
      sentiment: 'negative',
      title: "Amazon's Stock Declines Amid Rising Competition",
      description: "Amazon.com Inc. (AMZN) experienced a slight 0.2% decrease in its stock price to $248.50, as investors express concerns over increasing competition and rising operational costs.",
      source: "CNBC",
      date: "2026-04-15"
    }
  ];

  return (
    <div className="p-8 pb-20 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Market News</h1>
           <p className="text-gray-400">Latest financial news and analysis</p>
         </div>
         <button className="flex items-center gap-2 text-sm font-semibold bg-[#151515] hover:bg-[#222] border border-[#333] text-white px-4 py-2.5 rounded-xl transition-colors">
            <RefreshCw size={16} /> Refresh
         </button>
      </div>

      <div className="space-y-4">
         {articles.map((article, i) => (
            <div key={i} className="bg-[#151515] border border-[#222] rounded-[20px] p-6 hover:border-[#333] transition-colors cursor-pointer group">
               <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] bg-[#222] font-bold px-2 py-0.5 rounded text-white tracking-wider">{article.ticker}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded lowercase ${
                      article.sentiment === 'positive' ? 'bg-primary/10 text-primary' : 
                      article.sentiment === 'negative' ? 'bg-red-500/10 text-red-500' : 
                      'bg-gray-500/10 text-gray-400'
                  }`}>
                      {article.sentiment}
                  </span>
               </div>
               <h2 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{article.title}</h2>
               <p className="text-sm text-gray-400 mb-4 leading-relaxed">{article.description}</p>
               
               <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                  <span>{article.source}</span>
                  <span>{article.date}</span>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
