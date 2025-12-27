
import React, { useState } from 'react';

interface EmailPopupProps {
  onClose: () => void;
  onSubscribe: (email: string) => void;
}

const EmailPopup: React.FC<EmailPopupProps> = ({ onClose, onSubscribe }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setStatus('submitting');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      onSubscribe(email);
      setTimeout(onClose, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-blue-500/30 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"></div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center text-3xl text-white shadow-xl shadow-blue-500/20">
            <i className="fas fa-envelope-open-text"></i>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Power User Detected!</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              You've performed 3 successful structural discoveries. Join 5,000+ engineers receiving weekly prompt optimization tips.
            </p>
          </div>

          {status === 'success' ? (
            <div className="py-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-green-400 text-4xl">
                <i className="fas fa-check-circle"></i>
              </div>
              <p className="text-white font-bold">Welcome to the inner circle!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <input 
                type="email"
                required
                placeholder="Enter your professional email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 focus:border-blue-500 rounded-2xl py-4 px-6 text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-center"
              />
              <button 
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                {status === 'submitting' ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    Securing Connection...
                  </>
                ) : (
                  'Level Up My Prompts'
                )}
              </button>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                No spam. Ever. Just pure engineering.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPopup;
