import React from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

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
        <h2 className="text-2xl font-bold mb-2 font-sans">Your Session Code</h2>
        <p className="text-gray-300 mb-6 font-body">Please save this code. You'll need it to resume your evaluation later.</p>
        <div className="w-full bg-white/10 rounded-lg flex items-center justify-center p-4 mb-6">
          <span className="text-5xl font-mono tracking-[0.2em] mr-4">{sessionId}</span>
          <Button onClick={handleCopy} variant="ghost" size="icon">
            {copied ? <Check size={20} className="text-brand-green" /> : <Copy size={20} />}
          </Button>
        </div>
        <Button onClick={onContinue} className="w-full" size="lg">
          Continue to Evaluation
        </Button>
      </div>
    </div>
  );
};

export default DisplaySessionIdModal;