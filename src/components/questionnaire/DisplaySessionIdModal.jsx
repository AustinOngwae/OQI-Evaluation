import React from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const DisplaySessionIdModal = ({ sessionId, onContinue }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 w-full max-w-md text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Your Session Code</h2>
        <p className="text-gray-300 mb-6">Please save this code. You'll need it to resume your evaluation later.</p>
        <div className="w-full bg-white/10 rounded-lg flex items-center justify-center p-4 mb-6">
          <span className="text-5xl font-mono tracking-[0.2em] mr-4">{sessionId}</span>
          <button onClick={handleCopy} className="p-2 rounded-full hover:bg-white/20">
            {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
          </button>
        </div>
        <button onClick={onContinue} className="w-full btn-primary py-3">
          Continue to Evaluation
        </button>
      </div>
    </div>
  );
};

export default DisplaySessionIdModal;