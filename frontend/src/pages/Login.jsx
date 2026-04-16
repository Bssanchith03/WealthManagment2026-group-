import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [liquidCash, setLiquidCash] = useState('10000');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // In a real app we would hit standard login endpoints.
      const response = await fetch('http://localhost:5001/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           email, 
           password, 
           isSignUp, 
           initialCash: isSignUp ? parseFloat(liquidCash) : null 
         })
      });

      if (!response.ok) throw new Error('Authentication failed');
      const data = await response.json();
      
      login(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[400px] bg-white rounded-[24px] p-8 shadow-sm border border-[#e5e7eb] flex flex-col items-center">
        
        {/* Logo */}
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-md">
          <div className="relative w-8 h-10 flex flex-col items-center justify-center -space-y-3">
             <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <polyline points="18 15 12 9 6 15"></polyline>
             </svg>
             <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <polyline points="18 15 12 9 6 15"></polyline>
             </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#111] mb-2 tracking-tight">Welcome to ApexInvest</h1>
        <p className="text-[#666] text-sm mb-8 font-medium">{isSignUp ? "Create an account" : "Sign in to continue"}</p>

        {error && <div className="w-full bg-red-100 text-red-600 text-sm p-3 rounded-xl mb-4 text-center">{error}</div>}

        <button 
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#e5e7eb] rounded-xl py-3 px-4 text-sm font-semibold text-[#333] hover:bg-gray-50 transition-colors mb-6"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.369 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.109 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center w-full gap-4 mb-6">
          <div className="flex-1 h-px bg-[#e5e7eb]"></div>
          <span className="text-xs text-[#999] font-medium tracking-wider uppercase">OR</span>
          <div className="flex-1 h-px bg-[#e5e7eb]"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full relative">
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#333] mb-2 pl-1">Email</label>
            <div className="relative">
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full bg-white border border-[#e5e7eb] rounded-xl py-3 px-4 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#333] mb-2 pl-1">Password</label>
            <div className="relative">
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-white border border-[#e5e7eb] rounded-xl py-3 px-4 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#333] mb-2 pl-1">Starting Liquid Cash ($)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={liquidCash}
                  onChange={e => setLiquidCash(e.target.value)}
                  placeholder="10000.00" 
                  className="w-full bg-white border border-[#e5e7eb] rounded-xl py-3 px-4 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 pl-1">This is the cash you have available to invest.</p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-[#111] hover:bg-black text-white font-semibold rounded-xl py-3.5 px-4 transition-colors mb-6"
          >
            {isSignUp ? "Create Account" : "Sign in"}
          </button>
        </form>

        <div className="w-full flex items-center justify-between text-sm">
          {!isSignUp && <a href="#" className="font-semibold text-[#666] hover:text-[#111]">Forgot password?</a>}
          <div className="text-[#666] w-full text-center">
            {isSignUp ? "Already have an account?" : "Need an account?"}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-bold text-[#111] hover:text-[#10b981] ml-1">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
