import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'risk',
    question: 'How would you describe your risk tolerance?',
    options: [
      { label: 'Conservative (Protect my capital)', value: 'conservative', score: 1 },
      { label: 'Moderate (Balanced growth and risk)', value: 'moderate', score: 2 },
      { label: 'Aggressive (Maximize growth, high volatility)', value: 'aggressive', score: 3 },
    ],
  },
  {
    id: 'goal',
    question: 'What is your primary investment goal?',
    options: [
      { label: 'Retirement Planning', value: 'retirement' },
      { label: 'Buying a Home', value: 'real_estate' },
      { label: 'Education Fund', value: 'education' },
      { label: 'General Wealth Building', value: 'wealth' },
    ],
  },
  {
    id: 'horizon',
    question: 'What is your investment time horizon?',
    options: [
      { label: 'Short Term (1-3 years)', value: 'short' },
      { label: 'Medium Term (5-10 years)', value: 'medium' },
      { label: 'Long Term (15-25+ years)', value: 'long' },
    ],
  },
];

export default function Survey() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleOptionSelect = (value) => {
    const newAnswers = { ...answers, [QUESTIONS[currentStep].id]: value };
    setAnswers(newAnswers);
    
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitSurvey(newAnswers);
    }
  };

  const submitSurvey = async (finalAnswers) => {
    if (!user?.id) {
      alert("Session expired. Please log in again.");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/survey/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, answers: finalAnswers }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Survey submission failed:', response.status, errorData);
        throw new Error(`Failed to analyze survey: ${response.status}`);
      }
      
      // Show success state for 2 seconds before redirecting
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2500);

    } catch (err) {
      console.error('Submission Catch Error:', err);
      alert('Error submitting survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <CheckCircle className="text-primary w-12 h-12" />
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-black text-white tracking-tighter">Plan Generated</h2>
             <p className="text-gray-400 text-lg leading-relaxed">
               Our AI has analyzed your risk profile and constructed your multi-asset DNA. Redirecting to your strategic dashboard...
             </p>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-primary animate-progress-fast"></div>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto pt-20 px-6 min-h-screen">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
                 <Sparkles className="text-primary w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">AI Wealth Survey</h1>
           </div>
           <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Step {currentStep + 1} of {QUESTIONS.length}</p>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 shadow-3xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
        
        <h2 className="text-3xl font-black text-white mb-10 leading-tight tracking-tight">
          {QUESTIONS[currentStep].question}
        </h2>
        
        <div className="space-y-4 relative z-10">
          {QUESTIONS[currentStep].options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              disabled={isSubmitting}
              className="w-full text-left p-6 rounded-[24px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group flex items-center justify-between"
            >
              <span className="font-bold text-gray-300 group-hover:text-white transition-colors">{option.label}</span>
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                 <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {isSubmitting && (
        <div className="mt-12 text-center animate-pulse space-y-4">
          <div className="flex items-center justify-center gap-3 text-primary">
             <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
             <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
             <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">AI is orchestrating your strategy...</p>
        </div>
      )}
    </div>
  );
}
