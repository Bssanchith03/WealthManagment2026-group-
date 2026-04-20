/**
 * Realistic mock data for the landing page simulations.
 * Includes volatility and realistic growth patterns for different assets.
 */

const generateTrend = (points, startValue, growth, volatility, sectorBias = 0) => {
  let current = startValue;
  return Array.from({ length: points }).map((_, i) => {
    // Basic random walk
    let random = (Math.random() - 0.5) * volatility;
    
    // Inject occasional "flash dips" (5% chance of a 2% drop)
    if (Math.random() < 0.05) random -= 0.02;

    const trend = (growth + sectorBias) / points;
    current = current * (1 + trend + random);
    
    // Floor value to avoid zero/negative
    if (current < 1) current = 1;

    return {
      index: i,
      value: current,
      date: new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    };
  });
};

export const marketSummaryData = {
  nifty: generateTrend(100, 18000, 0.12, 0.025), // Steady but occasional shocks
  nasdaq: generateTrend(100, 14000, 0.18, 0.04), // High growth, high volatility
  gold: generateTrend(100, 60000, 0.07, 0.012), // Lower growth, very stable
  silver: generateTrend(100, 72000, 0.09, 0.025), // More volatile than gold
};

// Historic performance for last 10 years (Normalized to 100 in 2014)
// Includes realistic market drawdowns (2020 COVID, 2022 Rates)
export const assetPerformance10Y = [
  { year: '2014', nifty: 100, nasdaq: 100, gold: 100, silver: 100 },
  { year: '2015', nifty: 96,  nasdaq: 107, gold: 88,  silver: 82  },
  { year: '2016', nifty: 101, nasdaq: 114, gold: 96,  silver: 94  },
  { year: '2017', nifty: 128, nasdaq: 146, gold: 108, silver: 102 },
  { year: '2018', nifty: 132, nasdaq: 142, gold: 112, silver: 94  },
  { year: '2019', nifty: 151, nasdaq: 188, gold: 132, silver: 115 },
  // 2020: The COVID Crash & Recovery
  { year: '2020', nifty: 135, nasdaq: 220, gold: 162, silver: 130 }, 
  { year: '2021', nifty: 225, nasdaq: 310, gold: 145, silver: 125 },
  // 2022: The Inflation/Interest Rate Crash (NASDAQ hit hard)
  { year: '2022', nifty: 220, nasdaq: 215, gold: 165, silver: 120 },
  { year: '2023', nifty: 265, nasdaq: 315, gold: 185, silver: 145 },
  { year: '2024', nifty: 310, nasdaq: 385, gold: 215, silver: 160 },
];

export const investorPaths = {
  steady: {
    title: "Steady Starter",
    description: "Focus on low volatility and consistent wealth building.",
    risk: "Low",
    allocation: [
      { name: 'Fixed Income', value: 50, color: '#10b981' },
      { name: 'Gold', value: 20, color: '#f59e0b' },
      { name: 'Large Cap Stocks', value: 30, color: '#3b82f6' },
    ]
  },
  growth: {
    title: "Growth Seeker",
    description: "Prioritizing capital appreciation over safety.",
    risk: "Medium",
    allocation: [
      { name: 'Index Funds', value: 50, color: '#10b981' },
      { name: 'Mid Cap Stocks', value: 30, color: '#3b82f6' },
      { name: 'Crypto', value: 10, color: '#8b5cf6' },
      { name: 'Gold', value: 10, color: '#f59e0b' },
    ]
  },
  balanced: {
    title: "Balanced Planner",
    description: "A mix of everything to weather any storm.",
    risk: "Medium",
    allocation: [
      { name: 'Stocks', value: 40, color: '#3b82f6' },
      { name: 'Fixed Income', value: 30, color: '#10b981' },
      { name: 'Gold', value: 20, color: '#f59e0b' },
      { name: 'Cash', value: 10, color: '#6b7280' },
    ]
  },
  aggressive: {
    title: "Aggressive Player",
    description: "High risk, high potential reward. Focus on the future.",
    risk: "High",
    allocation: [
      { name: 'Small Cap Stocks', value: 40, color: '#3b82f6' },
      { name: 'Crypto', value: 30, color: '#8b5cf6' },
      { name: 'Tech Stocks', value: 20, color: '#10b981' },
      { name: 'Gold', value: 10, color: '#f59e0b' },
    ]
  }
};
