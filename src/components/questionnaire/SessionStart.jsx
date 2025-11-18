import React, { useState } from 'react';
import UserInfoForm from './UserInfoForm';
import { ArrowRight, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const SessionStart = ({ onResume, onNewUserSubmit }) => {
  const [mode, setMode] = useState('initial'); // 'initial', 'resume', 'newUser'
  const [sessionId, setSessionId] = useState('');

  const handleResumeSubmit = (e) => {
    e.preventDefault();
    if (sessionId.length === 4 && !isNaN(sessionId)) {
      onResume(sessionId);
    } else {
      toast.error('Please enter a valid 4-digit code.');
    }
  };

  if (mode === 'newUser') {
    return <UserInfoForm onSubmit={onNewUserSubmit} />;
  }

  if (mode === 'resume') {
    return (
      <div className="max-w-md mx-auto p-2 sm:p-4 md:p-6">
        <div className="glass-card p-4 sm:p-6 md:p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Resume Evaluation</h2>
          <p className="text-gray-300 mb-6">Enter the 4-digit code you were given to continue your session.</p>
          <form onSubmit={handleResumeSubmit} className="space-y-4">
            <div>
              <label htmlFor="sessionId" className="sr-only">4-Digit Code</label>
              <input
                type="text"
                id="sessionId"
                name="sessionId"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                maxLength="4"
                placeholder="----"
                className="w-48 mx-auto text-center text-3xl tracking-[0.5em] font-mono"
                required
              />
            </div>
            <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center">
              <Key size={18} className="mr-2" /> Resume Session
            </button>
          </form>
          <button onClick={() => setMode('initial')} className="mt-4 text-sm text-gray-400 hover:text-white">
            &larr; Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 md:p-6">
      <div className="glass-card p-4 sm:p-6 md:p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Welcome!</h2>
        <p className="text-gray-300 mb-8">Are you starting a new evaluation or resuming a previous one?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setMode('newUser')} className="group glass-card flex flex-col items-center justify-center p-6 sm:p-8 text-center transition-all duration-300 ease-in-out hover:border-white/40 hover:-translate-y-1 text-purple-300">
            <ArrowRight size={48} className="mb-4 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-semibold text-white">Start New Evaluation</span>
            <p className="text-sm text-gray-300 mt-2">Begin a fresh evaluation and get a new session code.</p>
          </button>
          <button onClick={() => setMode('resume')} className="group glass-card flex flex-col items-center justify-center p-6 sm:p-8 text-center transition-all duration-300 ease-in-out hover:border-white/40 hover:-translate-y-1 text-blue-300">
            <Key size={48} className="mb-4 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-semibold text-white">Resume with Code</span>
            <p className="text-sm text-gray-300 mt-2">Enter your 4-digit code to continue where you left off.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionStart;