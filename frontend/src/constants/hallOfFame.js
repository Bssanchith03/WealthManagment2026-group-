export const hallOfFame = [
  { 
    id: 'gold', 
    symbol: 'GC=F', 
    name: 'Gold', 
    desc: 'A classic hedge against inflation and geopolitical uncertainty.', 
    detailedDesc: 'Gold has been the ultimate store of value for over 5,000 years. Unlike fiat currency, its supply cannot be expanded at will. In your portfolio, Gold acts as a "safety net"—its price typically surges during equity market crashes or periods of hyper-inflation. It is not a growth asset, but a wealth preservation tool.',
    stats: { volatility: 'Low', role: 'Wealth Hedge', decadeReturn: '+82%' }
  },
  { 
    id: 'silver', 
    symbol: 'SI=F', 
    name: 'Silver', 
    desc: 'Silver follows Gold\'s trend but with higher industrial utility.', 
    detailedDesc: 'Often called "Gold\'s volatile cousin," Silver offers both a monetary hedge and industrial exposure. It is crucial in green energy (solar panels) and electronics. This dual nature means it can outperform Gold in bull markets but faces higher drawdown risk during industrial slowdowns.',
    stats: { volatility: 'Medium', role: 'Dual Asset', decadeReturn: '+64%' }
  },
  { 
    id: 'nifty', 
    symbol: '^NSEI', 
    name: 'Nifty 50', 
    desc: 'Reflects the heartbeat of India\'s economy.', 
    detailedDesc: 'The Nifty 50 represents the top 50 diversified blue-chip companies in India. As India moves toward becoming the world\'s third-largest economy, this index captures the growth of the rising middle class, infrastructure expansion, and digital transformation. It is the core of any India-focused long-term growth strategy.',
    stats: { volatility: 'Medium', role: 'Core Growth', decadeReturn: '+215%' }
  },
  { 
    id: 'btc', 
    symbol: 'BTC-USD', 
    name: 'Bitcoin', 
    desc: 'The "digital gold" and the asset of the decade.', 
    detailedDesc: 'Bitcoin is the first decentralized digital asset with a mathematically capped supply. Over the last 10 years, it has evolved from a niche experiment to an institutional asset class. Its extreme volatility is a byproduct of its rapid price discovery process. It serves as a high-risk, high-reward alternative to traditional hedges.',
    stats: { volatility: 'Extreme', role: 'Digital Store', decadeReturn: '+16,400%' }
  },
  { 
    id: 'aapl', 
    symbol: 'AAPL', 
    name: 'Apple Inc.', 
    desc: 'Driven by ecosystem dominance and high service margins.', 
    detailedDesc: 'Apple\'s strength lies in its ecosystem "stickiness." Once a user enters the iOS environment, switching costs are high. This creates a recurring revenue machine through Services and hardware upgrades. For investors, Apple represents high-quality cash flows and a fortress-like balance sheet.',
    stats: { volatility: 'Medium', role: 'Quality Value', decadeReturn: '+840%' }
  },
  { 
    id: 'nvda', 
    symbol: 'NVDA', 
    name: 'NVIDIA', 
    desc: 'The engine room of the global AI revolution.', 
    detailedDesc: 'NVIDIA is the undisputed leader in accelerated computing. Its GPUs are the essential hardware for training Large Language Models (LLMs) and driving AI research. The shift from general-purpose CPUs to GPUs has transformed NVIDIA from a gaming company into the most critical infrastructure provider of the 21st century.',
    stats: { volatility: 'High', role: 'AI Frontier', decadeReturn: '+24,500%' }
  },
  { 
    id: 'amzn', 
    symbol: 'AMZN', 
    name: 'Amazon', 
    desc: 'The world\'s most customer-centric company and cloud giant.', 
    detailedDesc: 'Amazon has evolved from an online bookstore into a logistics and cloud computing (AWS) powerhouse. Its business model focuses on long-term cash flow reinvestment. AWS provides the margins that support its retail dominance, making it a "conglomerate of the digital age" with unparalleled scale.',
    stats: { volatility: 'Medium', role: 'Infrastructure Giant', decadeReturn: '+1,100%' }
  }
];
